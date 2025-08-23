"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type FastNotificationType = "success" | "error" | "warning" | "info";

export interface FastNotification {
  id: string;
  type: FastNotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface FastNotificationContextType {
  showNotification: (notification: Omit<FastNotification, "id">) => void;
}

const FastNotificationContext = createContext<FastNotificationContextType | undefined>(undefined);

export const useFastNotification = () => {
  const context = useContext(FastNotificationContext);
  if (!context) {
    throw new Error("useFastNotification must be used within a FastNotificationProvider");
  }
  return context;
};

interface FastNotificationProviderProps {
  children: ReactNode;
}

const NOTIFICATION_STYLES = {
  success: {
    bg: "bg-gradient-to-r from-green-500 to-emerald-500",
    border: "border-green-200",
    text: "text-white",
    icon: CheckCircle,
    iconColor: "text-white"
  },
  error: {
    bg: "bg-gradient-to-r from-red-500 to-rose-500",
    border: "border-red-200", 
    text: "text-white",
    icon: XCircle,
    iconColor: "text-white"
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    border: "border-amber-200",
    text: "text-white", 
    icon: AlertTriangle,
    iconColor: "text-white"
  },
  info: {
    bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
    border: "border-blue-200",
    text: "text-white",
    icon: Info,
    iconColor: "text-white"
  }
};

export const FastNotificationProvider: React.FC<FastNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<FastNotification[]>([]);

  const showNotification = useCallback((notification: Omit<FastNotification, "id">) => {
    const id = Date.now().toString();
    const duration = notification.duration || 3000;
    
    const newNotification: FastNotification = {
      ...notification,
      id
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 2)]); // Max 3 notifications

    // Auto-hide notification
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <FastNotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2 w-96 max-w-[calc(100vw-2rem)]">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => {
            const style = NOTIFICATION_STYLES[notification.type];
            const IconComponent = style.icon;

            return (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, scale: 0.8, x: 100 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 100 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  duration: 0.3
                }}
                className={`relative rounded-xl ${style.bg} ${style.border} shadow-lg border backdrop-blur-sm overflow-hidden`}
              >
                {/* Content */}
                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <IconComponent className={`h-5 w-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                  </motion.div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <motion.h4
                      className={`font-semibold ${style.text} text-sm`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {notification.title}
                    </motion.h4>
                    {notification.message && (
                      <motion.p
                        className={`text-xs ${style.text} opacity-90 mt-1`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {notification.message}
                      </motion.p>
                    )}
                  </div>

                  {/* Close Button */}
                  <motion.button
                    onClick={() => removeNotification(notification.id)}
                    className={`${style.text} opacity-70 hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded-full hover:bg-white/20`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Progress Bar */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ 
                    duration: (notification.duration || 3000) / 1000,
                    ease: "linear" 
                  }}
                />

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </FastNotificationContext.Provider>
  );
};

// Helper functions for easy usage
export const fastNotificationHelpers = {
  success: (title: string, message?: string) => ({
    type: "success" as const,
    title,
    message,
    duration: 3000
  }),
  
  error: (title: string, message?: string) => ({
    type: "error" as const,
    title,
    message,
    duration: 4000
  }),
  
  warning: (title: string, message?: string) => ({
    type: "warning" as const,
    title,
    message,
    duration: 3500
  }),
  
  info: (title: string, message?: string) => ({
    type: "info" as const,
    title,
    message,
    duration: 3000
  })
};