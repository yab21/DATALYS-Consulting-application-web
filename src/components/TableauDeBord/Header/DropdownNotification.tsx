"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  Chip,
  cn,
} from "@nextui-org/react";
import { useAdvancedNotifications } from "@/components/UI/Notifications/AdvancedNotificationProvider";
import {
  Bell,
  Check,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    notifications,
    removeNotification: hideNotification,
    clearAll: clearAllNotifications,
    addNotification,
  } = useAdvancedNotifications();


  // Calculer les notifications non lues (simulation)
  const unreadCount = notifications.length;
  const notifying = unreadCount > 0;

  // Adapters pour compatibilité avec l'ancien système
  const adaptNotification = (item: any) => ({
    ...item,
    body: item.message || 'Notification',
    read: item.isRead || false,
    priority: item.priority || 'medium',
    category: item.category || 'system',
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
    link: item.relatedId ? `/tableaudebord/messages/${item.relatedId}` : '#'
  });

  // Détecter le mode sombre
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Observer les changements de classe
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleDropdownOpen = () => {
    setDropdownOpen(true);
    // Auto-activer les notifications temps réel à l'ouverture (simulé)
  };

  const deleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    hideNotification(notificationId);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-blue-500";
      case "low":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return timestamp.toLocaleDateString("fr-FR");
  };

  // Classes dynamiques basées sur le mode sombre
  const getThemeClasses = {
    button: isDarkMode
      ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
      : "bg-gray-100 hover:bg-gray-200 text-gray-600",
    header: isDarkMode
      ? "border-gray-700 bg-gray-800/50"
      : "border-gray-200 bg-gray-50",
    headerText: isDarkMode ? "text-white" : "text-gray-900",
    headerChip: isDarkMode
      ? "bg-blue-900/30 text-blue-300"
      : "bg-blue-100 text-blue-700",
    headerChipDanger: isDarkMode
      ? "bg-red-900/30 text-red-300"
      : "bg-red-100 text-red-700",
    headerStatus: isDarkMode ? "text-gray-400" : "text-gray-500",
    markAllBg: isDarkMode ? "bg-gray-800/30" : "bg-gray-50",
    markAllButton: isDarkMode
      ? "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50"
      : "bg-blue-100 text-blue-700 hover:bg-blue-200",
    emptyBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    emptyText: isDarkMode ? "text-gray-300" : "text-gray-600",
    emptySubtext: isDarkMode ? "text-gray-400" : "text-gray-500",
    seeAllBg: isDarkMode ? "bg-gray-800/30" : "bg-gray-50",
    seeAllBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    seeAllText: isDarkMode
      ? "text-blue-400 hover:text-blue-300"
      : "text-blue-600 hover:text-blue-700",
    itemBorder: isDarkMode ? "border-gray-800" : "border-gray-100",
    itemHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    unreadBg: isDarkMode ? "bg-blue-950/20" : "bg-blue-50/50",
    itemTitle: isDarkMode ? "text-white" : "text-gray-900",
    itemBody: isDarkMode ? "text-gray-300" : "text-gray-600",
    itemTimestamp: isDarkMode ? "text-gray-400" : "text-gray-500",
    itemCategory: isDarkMode
      ? "bg-gray-800 text-gray-300"
      : "bg-gray-100 text-gray-700",
    actionButton: isDarkMode
      ? "bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-900/50"
      : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    deleteButton: isDarkMode
      ? "text-gray-500 hover:text-red-400"
      : "text-gray-400 hover:text-red-500",
    footerBorder: isDarkMode ? "border-gray-700" : "border-gray-100",
    footerText: isDarkMode ? "text-gray-500" : "text-gray-500",
    footerLink: isDarkMode
      ? "text-blue-400 hover:text-blue-300"
      : "text-blue-600 hover:text-blue-700",
  };

  return (
    <div className="relative block">
      <Dropdown
        isOpen={dropdownOpen}
        onOpenChange={(open) => {
          if (open) {
            handleDropdownOpen();
          } else {
            setDropdownOpen(false);
          }
        }}
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            radius="full"
            variant="light"
            className={cn(
              "relative h-12 w-12 transition-all duration-200",
              getThemeClasses.button,
            )}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {notifying && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                </span>
              )}
            </div>
          </Button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Notifications"
          className="max-h-[600px] w-96 overflow-hidden p-0"
          closeOnSelect={false}
          items={[
            { key: "header", type: "header" },
            ...(unreadCount > 3 ? [{ key: "mark-all", type: "mark-all" }] : []),
            ...notifications.slice(0, 10).map((n) => ({ key: n.id, ...adaptNotification(n) })),
            ...(notifications.length === 0
              ? [{ key: "empty", type: "empty" }]
              : []),
            ...(notifications.length > 10
              ? [{ key: "see-all", type: "see-all" }]
              : []),
          ]}
        >
          {(item: any) => {
            if (item.type === "header") {
              return (
                <DropdownItem
                  key="header"
                  textValue="Notifications"
                  className={cn("h-20 gap-3 border-b", getThemeClasses.header)}
                >
                  <div className="flex w-full items-center justify-between">
                    <div>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          getThemeClasses.headerText,
                        )}
                      >
                        Notifications
                      </span>
                      <div className="mt-2 flex gap-2">
                        <Chip
                          size="sm"
                          variant="flat"
                          color="primary"
                          className={getThemeClasses.headerChip}
                        >
                          {notifications.length} total
                        </Chip>
                        {unreadCount > 0 && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="danger"
                            className={getThemeClasses.headerChipDanger}
                          >
                            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                          </Chip>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          getThemeClasses.headerStatus,
                        )}
                      >
                        Temps réel
                      </span>
                    </div>
                  </div>
                </DropdownItem>
              );
            }

            if (item.type === "mark-all") {
              return (
                <DropdownItem
                  key="mark-all"
                  textValue="Tout marquer comme lu"
                  className={cn("py-3", getThemeClasses.markAllBg)}
                >
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className={cn("w-full", getThemeClasses.markAllButton)}
                    onPress={clearAllNotifications}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Tout marquer comme lu
                  </Button>
                </DropdownItem>
              );
            }

            if (item.type === "empty") {
              return (
                <DropdownItem
                  key="empty"
                  textValue="Aucune notification"
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "mb-4 rounded-full p-4",
                        getThemeClasses.emptyBg,
                      )}
                    >
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <p
                      className={cn(
                        "text-lg font-semibold",
                        getThemeClasses.emptyText,
                      )}
                    >
                      Aucune notification
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        getThemeClasses.emptySubtext,
                      )}
                    >
                      Vous êtes à jour !
                    </p>
                  </div>
                </DropdownItem>
              );
            }

            if (item.type === "see-all") {
              return (
                <DropdownItem
                  key="see-all"
                  textValue="Voir toutes les notifications"
                  className={cn(
                    "border-t py-3",
                    getThemeClasses.seeAllBg,
                    getThemeClasses.seeAllBorder,
                  )}
                >
                  <Link href="/tableaudebord/notifications" className="w-full">
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className={cn("w-full", getThemeClasses.seeAllText)}
                    >
                      Voir toutes les notifications ({notifications.length})
                    </Button>
                  </Link>
                </DropdownItem>
              );
            }

            return (
              <DropdownItem
                key={item.key}
                textValue={item.title}
                className={cn(
                  "border-b px-4 py-4 transition-colors duration-200",
                  getThemeClasses.itemBorder,
                  getThemeClasses.itemHover,
                  !item.read && getThemeClasses.unreadBg,
                )}
              >
                <div className="flex w-full items-start gap-4">
                  {/* Priority Indicator */}
                  <div className="mt-1 flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        getPriorityColor(item.priority),
                      )}
                    />
                    {!item.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="min-w-0 flex-grow">
                    <Link
                      href={item.link || "#"}
                      className="block"
                      onClick={() => hideNotification(item.id)}
                    >
                      <Card shadow="none" className="bg-transparent">
                        <CardBody className="gap-3 p-0">
                          {/* Header with Type Icon and Title */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              {getTypeIcon(item.type)}
                              <p
                                className={cn(
                                  "line-clamp-1 text-sm font-semibold",
                                  getThemeClasses.itemTitle,
                                )}
                              >
                                {item.title}
                              </p>
                            </div>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={getTypeColor(item.type)}
                              className="flex-shrink-0 text-xs font-medium"
                            >
                              {item.type}
                            </Chip>
                          </div>

                          {/* Body */}
                          <p
                            className={cn(
                              "line-clamp-2 text-sm leading-relaxed",
                              getThemeClasses.itemBody,
                            )}
                          >
                            {item.body}
                          </p>

                          {/* Footer with Timestamp and Category */}
                          <div className="flex items-center justify-between">
                            <div
                              className={cn(
                                "flex items-center gap-2 text-xs",
                                getThemeClasses.itemTimestamp,
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(item.timestamp)}
                            </div>
                            <Chip
                              size="sm"
                              variant="flat"
                              className={cn(
                                "text-xs font-medium",
                                getThemeClasses.itemCategory,
                              )}
                            >
                              {item.category}
                            </Chip>
                          </div>

                          {/* Action Button */}
                          {item.action && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="bordered"
                                color="primary"
                                className={cn(
                                  "h-8 text-xs",
                                  getThemeClasses.actionButton,
                                )}
                                onPress={item.action.handler}
                              >
                                {item.action.label}
                              </Button>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </Link>
                  </div>

                  {/* Delete Button */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className={cn(
                      "flex-shrink-0 self-start opacity-60 transition-all duration-200 hover:opacity-100",
                      getThemeClasses.deleteButton,
                    )}
                    onClick={(e) => deleteNotification(e, item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownItem>
            );
          }}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default DropdownNotification;
