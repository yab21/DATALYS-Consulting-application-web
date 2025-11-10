"use client";
import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, MessageSquare } from "lucide-react";
import messagesService from "@/services/messages";

const SimpleDropdownNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  
  // Charger les notifications depuis localStorage ET l'API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // 1. Charger depuis localStorage (notifications FCM)
        const stored = localStorage.getItem('datalys-notifications');
        let localNotifications: any[] = [];
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localNotifications = parsed.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp),
              source: 'fcm'
            }));
          } catch (parseError) {
            console.warn('Erreur parsing localStorage notifications:', parseError);
            localStorage.removeItem('datalys-notifications'); // Nettoyer les données corrompues
          }
        }

        // 2. Charger depuis l'API (notifications backend)
        setIsLoadingApi(true);
        setApiError(null);
        
        try {
          const apiResponse = await messagesService.getUnreadNotifications(0, 10);
          const apiNotifications = (apiResponse.items || []).map((n: any) => ({
            id: `api-${n.id}`,
            type: n.type === 'notification' ? 'message' : n.type,
            title: n.title,
            message: n.description,
            timestamp: new Date(n.created_at),
            priority: n.priority,
            read: n.is_read,
            source: 'api'
          }));

          // 3. Combiner les deux sources (éviter les doublons)
          const allNotifications = [...apiNotifications, ...localNotifications];
          setNotifications(allNotifications);
          setApiError(null); // Reset erreur si succès
        } catch (apiError: any) {
          // Gestion détaillée des erreurs API
          const errorMessage = apiError?.message || 'Erreur API inconnue';
          
          if (apiError?.message?.includes('Failed to execute \'json\'')) {
            setApiError('Service temporairement indisponible');
          } else if (apiError?.message?.includes('Token d\'authentification')) {
            setApiError('Session expirée - reconnectez-vous');
          } else if (apiError?.message?.includes('fetch failed') || apiError?.message?.includes('NetworkError')) {
            setApiError('Connexion réseau impossible');
          } else {
            setApiError('Service notifications indisponible');
          }
          
          console.warn('Erreur API notifications, utilisation localStorage uniquement:', {
            error: errorMessage,
            type: apiError?.constructor?.name,
            status: apiError?.status
          });
          
          // Utiliser uniquement localStorage en cas d'erreur API
          setNotifications(localNotifications);
        } finally {
          setIsLoadingApi(false);
        }
      } catch (error) {
        console.error('Erreur générale chargement notifications:', error);
        setApiError('Erreur de chargement');
        setIsLoadingApi(false);
      }
    };

    loadNotifications();

    // Écouter les changements du localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'datalys-notifications') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Polling pour recharger depuis l'API toutes les 30 secondes (réduit pour éviter le spam d'erreurs)
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Obtenir l'icône selon le type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Supprimer une notification
  const removeNotification = async (id: string) => {
    try {
      // Si c'est une notification API, la marquer comme lue sur le backend
      if (id.startsWith('api-')) {
        const actualId = id.replace('api-', '');
        try {
          await messagesService.markNotificationAsRead(actualId);
        } catch (apiError) {
          console.warn('Erreur marquage notification comme lue:', apiError);
          // Continuer même si l'API échoue
        }
      }
      
      // Supprimer localement (toujours fonctionnel)
      const updated = notifications.filter((n: any) => n.id !== id);
      setNotifications(updated);
      
      // Mettre à jour localStorage pour les notifications FCM uniquement
      const localNotifications = updated.filter((n: any) => n.source === 'fcm');
      try {
        localStorage.setItem('datalys-notifications', JSON.stringify(localNotifications));
      } catch (storageError) {
        console.warn('Erreur sauvegarde localStorage:', storageError);
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = () => {
    const updated = notifications.map((n: any) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('datalys-notifications', JSON.stringify(updated));
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {/* Red dot indicator - only show if there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Notifications ({notifications.length})
                </h3>
                {isLoadingApi && (
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Tout marquer lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {apiError && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {apiError}
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {notification.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleString('fr-FR')}
                        </p>
                        {notification.priority && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {notification.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDropdownNotification;