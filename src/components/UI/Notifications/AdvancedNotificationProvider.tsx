'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  MessageSquare,
  Settings,
  Volume2,
  VolumeX,
  Clock,
  User,
  Building
} from 'lucide-react';
import { Card, CardBody, Button, Chip, Badge, Switch } from '@nextui-org/react';
import { usePermissions } from '@/hooks/usePermissions';

// Types étendus pour les notifications avancées
export interface AdvancedNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'message' | 'incident' | 'system';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'general' | 'project' | 'security' | 'system' | 'communication';
  actionRequired?: boolean;
  relatedId?: number; // ID du projet, incident, etc.
  fromUser?: {
    id: number;
    name: string;
    role: string;
  };
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: () => void | Promise<void>;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  desktopEnabled: boolean;
  emailEnabled: boolean;
  categories: {
    general: boolean;
    project: boolean;
    security: boolean;
    system: boolean;
    communication: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

interface AdvancedNotificationContextType {
  notifications: AdvancedNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  isDropdownOpen: boolean;
  
  // Actions principales
  addNotification: (notification: Omit<AdvancedNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Gestion de l'interface
  toggleDropdown: () => void;
  setDropdownOpen: (open: boolean) => void;
  
  // Paramètres
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Helpers
  getNotificationsByCategory: (category: string) => AdvancedNotification[];
  getUnreadByPriority: (priority: string) => number;
}

const AdvancedNotificationContext = createContext<AdvancedNotificationContextType | undefined>(undefined);

export function useAdvancedNotifications() {
  const context = useContext(AdvancedNotificationContext);
  if (!context) {
    throw new Error('useAdvancedNotifications must be used within AdvancedNotificationProvider');
  }
  return context;
}

interface AdvancedNotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  persistToStorage?: boolean;
}

export function AdvancedNotificationProvider({ 
  children, 
  maxNotifications = 50,
  persistToStorage = true 
}: AdvancedNotificationProviderProps) {
  const [notifications, setNotifications] = useState<AdvancedNotification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: false,
    desktopEnabled: true,
    emailEnabled: false,
    categories: {
      general: true,
      project: true,
      security: true,
      system: true,
      communication: true,
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      critical: true,
    },
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const permissions = usePermissions();

  // Charger les notifications depuis le localStorage au démarrage
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      const saved = localStorage.getItem('datalys-notifications');
      const savedSettings = localStorage.getItem('datalys-notification-settings');
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })));
        } catch (error) {
          console.error('Error loading notifications from storage:', error);
        }
      }
      
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('Error loading settings from storage:', error);
        }
      }
    }
  }, [persistToStorage]);

  // Sauvegarder les notifications dans le localStorage
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      localStorage.setItem('datalys-notifications', JSON.stringify(notifications));
    }
  }, [notifications, persistToStorage]);

  // Sauvegarder les paramètres
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      localStorage.setItem('datalys-notification-settings', JSON.stringify(settings));
    }
  }, [settings, persistToStorage]);

  // Initialiser l'audio pour les notifications (désactivé)
  useEffect(() => {
    // Son désactivé par défaut - pas de chargement de fichier audio
    if (settings.soundEnabled) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.3;
    }
  }, [settings.soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore errors (audio might not be available)
      });
    }
  }, [settings.soundEnabled]);

  const showDesktopNotification = useCallback((notification: AdvancedNotification) => {
    if (!settings.desktopEnabled || typeof window === 'undefined') return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, [settings.desktopEnabled]);

  const addNotification = useCallback((notificationData: Omit<AdvancedNotification, 'id' | 'timestamp' | 'read'>) => {
    const notification: AdvancedNotification = {
      ...notificationData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    // Vérifier si la notification doit être affichée selon les paramètres
    if (!settings.categories[notification.category] || !settings.priorities[notification.priority]) {
      return;
    }

    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Limiter le nombre de notifications
      return newNotifications.slice(0, maxNotifications);
    });

    // Effets sonores et visuels
    playNotificationSound();
    showDesktopNotification(notification);

  }, [settings, maxNotifications, playNotificationSound, showDesktopNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const setDropdownOpen = useCallback((open: boolean) => {
    setIsDropdownOpen(open);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const getNotificationsByCategory = useCallback((category: string) => {
    return notifications.filter(n => n.category === category);
  }, [notifications]);

  const getUnreadByPriority = useCallback((priority: string) => {
    return notifications.filter(n => !n.read && n.priority === priority).length;
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const contextValue: AdvancedNotificationContextType = {
    notifications,
    unreadCount,
    settings,
    isDropdownOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleDropdown,
    setDropdownOpen,
    updateSettings,
    getNotificationsByCategory,
    getUnreadByPriority,
  };

  return (
    <AdvancedNotificationContext.Provider value={contextValue}>
      {children}
      <NotificationDropdown />
    </AdvancedNotificationContext.Provider>
  );
}

// Composant dropdown pour afficher les notifications
function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isDropdownOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setDropdownOpen,
  } = useAdvancedNotifications();

  const permissions = usePermissions();

  const getNotificationIcon = (type: AdvancedNotification['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      case 'message': return MessageSquare;
      case 'incident': return AlertTriangle;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: AdvancedNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return timestamp.toLocaleDateString('fr-FR');
  };

  if (!isDropdownOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={() => setDropdownOpen(false)}>
      <div className="fixed top-20 right-4 w-96 max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
        <Card className="shadow-2xl border border-gray-200 dark:border-gray-700">
          <CardBody className="p-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge content={unreadCount > 99 ? '99+' : unreadCount.toString()} color="danger" size="sm">
                      <span></span>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="light"
                      onPress={markAllAsRead}
                    >
                      Tout marquer lu
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => setDropdownOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`
                          p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer
                          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                        `}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-2 rounded-lg flex-shrink-0
                            ${notification.type === 'success' ? 'bg-green-100 text-green-600' : ''}
                            ${notification.type === 'error' ? 'bg-red-100 text-red-600' : ''}
                            ${notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : ''}
                            ${notification.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
                            ${notification.type === 'message' ? 'bg-purple-100 text-purple-600' : ''}
                            ${notification.type === 'incident' ? 'bg-orange-100 text-orange-600' : ''}
                            ${notification.type === 'system' ? 'bg-gray-100 text-gray-600' : ''}
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              
                              <Chip
                                size="sm"
                                color={getPriorityColor(notification.priority) as any}
                                variant="flat"
                                className="text-xs"
                              >
                                {notification.priority}
                              </Chip>
                            </div>

                            {notification.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </div>

                              {notification.fromUser && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  {notification.fromUser.role === 'admin' ? (
                                    <Settings className="w-3 h-3" />
                                  ) : (
                                    <Building className="w-3 h-3" />
                                  )}
                                  {notification.fromUser.name}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {notification.actions.map((action) => (
                                  <Button
                                    key={action.id}
                                    size="sm"
                                    color={action.type === 'danger' ? 'danger' : 'primary'}
                                    variant={action.type === 'secondary' ? 'bordered' : 'solid'}
                                    onPress={() => action.handler()}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => {
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={clearAll}
                  className="w-full"
                >
                  Tout effacer
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// Hook pour demander les permissions de notification
export function useNotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  };
}

// Helpers pour créer des notifications typées
export const advancedNotificationHelpers = {
  success: (title: string, message?: string, options?: Partial<AdvancedNotification>) => ({
    type: 'success' as const,
    title,
    message,
    category: 'general' as const,
    priority: 'medium' as const,
    ...options,
  }),

  error: (title: string, message?: string, options?: Partial<AdvancedNotification>) => ({
    type: 'error' as const,
    title,
    message,
    category: 'general' as const,
    priority: 'high' as const,
    ...options,
  }),

  warning: (title: string, message?: string, options?: Partial<AdvancedNotification>) => ({
    type: 'warning' as const,
    title,
    message,
    category: 'general' as const,
    priority: 'medium' as const,
    ...options,
  }),

  info: (title: string, message?: string, options?: Partial<AdvancedNotification>) => ({
    type: 'info' as const,
    title,
    message,
    category: 'general' as const,
    priority: 'low' as const,
    ...options,
  }),

  message: (title: string, message?: string, fromUser?: any, options?: Partial<AdvancedNotification>) => ({
    type: 'message' as const,
    title,
    message,
    category: 'communication' as const,
    priority: 'medium' as const,
    fromUser,
    ...options,
  }),

  incident: (title: string, message?: string, options?: Partial<AdvancedNotification>) => ({
    type: 'incident' as const,
    title,
    message,
    category: 'project' as const,
    priority: 'high' as const,
    actionRequired: true,
    ...options,
  }),

  system: (title: string, message?: string, options?: Partial<AdvancedNotification>) => ({
    type: 'system' as const,
    title,
    message,
    category: 'system' as const,
    priority: 'low' as const,
    ...options,
  }),
};