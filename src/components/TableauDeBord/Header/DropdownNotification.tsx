"use client";
import { useState } from "react";
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
import { useNotifications } from "@/context/NotificationContext";

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    removeNotification,
    subscribeToRealTime,
    unsubscribeFromRealTime 
  } = useNotifications();

  const notifying = unreadCount > 0;

  const handleDropdownOpen = () => {
    setDropdownOpen(true);
    // Auto-activer les notifications temps réel à l'ouverture
    subscribeToRealTime();
  };

  const deleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeNotification(notificationId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'primary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <span className="text-red-500">🔴</span>;
      case 'high':
        return <span className="text-orange-500">🟠</span>;
      case 'medium':
        return <span className="text-blue-500">🔵</span>;
      case 'low':
        return <span className="text-gray-500">⚪</span>;
      default:
        return null;
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
    return timestamp.toLocaleDateString('fr-FR');
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
              "relative h-12 w-12",
              "bg-default-100 hover:bg-default-200",
              "dark:bg-default-50 dark:hover:bg-default-100",
            )}
          >
            <div className="relative">
              <svg
                className="fill-default-500 dark:fill-default-300"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.0001 1.0415C6.43321 1.0415 3.54172 3.933 3.54172 7.49984V8.08659C3.54172 8.66736 3.36981 9.23513 3.04766 9.71836L2.09049 11.1541C0.979577 12.8205 1.82767 15.0855 3.75983 15.6125C4.3895 15.7842 5.0245 15.9294 5.66317 16.0482L5.66475 16.0525C6.30558 17.7624 8.01834 18.9582 10 18.9582C11.9817 18.9582 13.6944 17.7624 14.3352 16.0525L14.3368 16.0483C14.9755 15.9295 15.6106 15.7842 16.2403 15.6125C18.1724 15.0855 19.0205 12.8205 17.9096 11.1541L16.9524 9.71836C16.6303 9.23513 16.4584 8.66736 16.4584 8.08659V7.49984C16.4584 3.933 13.5669 1.0415 10.0001 1.0415Z"
                />
              </svg>
              {notifying && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-danger">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                </span>
              )}
            </div>
          </Button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Notifications"
          className="relative z-50 overflow-y-scroll w-[400px] h-[500px] p-0"
          closeOnSelect={false}
          items={[
            { key: "header", type: "header" },
            ...(unreadCount > 3 ? [{ key: "mark-all", type: "mark-all" }] : []),
            ...notifications.slice(0, 10).map(n => ({ key: n.id, ...n })),
            ...(notifications.length === 0 ? [{ key: "empty", type: "empty" }] : []),
            ...(notifications.length > 10 ? [{ key: "see-all", type: "see-all" }] : [])
          ]}
        >
          {(item: any) => {
            if (item.type === "header") {
              return (
                <DropdownItem
                  key="header"
                  textValue="Notifications"
                  className="h-16 gap-2 border-b border-default-200"
                >
                  <div className="flex w-full items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold">Notifications</span>
                      <div className="flex gap-1 mt-1">
                        <Chip size="sm" variant="flat" color="primary">
                          {notifications.length} total
                        </Chip>
                        {unreadCount > 0 && (
                          <Chip size="sm" variant="flat" color="danger">
                            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                          </Chip>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-green-500">●</span>
                      <span className="text-xs text-default-400">Temps réel</span>
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
                  className="py-2"
                >
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="w-full"
                    onPress={markAllAsRead}
                  >
                    Tout marquer comme lu
                  </Button>
                </DropdownItem>
              );
            }
            
            if (item.type === "empty") {
              return (
                <DropdownItem key="empty" textValue="Aucune notification" className="py-8">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔔</div>
                    <p className="text-default-400 font-medium">Aucune notification</p>
                    <p className="text-tiny text-default-300 mt-1">
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
                  className="py-3 border-t border-default-200"
                >
                  <Link href="/tableaudebord/notifications" className="w-full">
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="w-full"
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
                  "py-4 border-b border-default-100",
                  !item.read && "bg-primary-50 dark:bg-primary-950/20",
                )}
              >
                <div className="flex w-full items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    {getPriorityIcon(item.priority)}
                    {!item.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <Link
                      href={item.link || "#"}
                      className="block"
                      onClick={() => markAsRead(item.id)}
                    >
                      <Card shadow="none" className="bg-transparent">
                        <CardBody className="gap-2 p-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">
                              {item.title}
                            </p>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={getTypeColor(item.type)}
                              className="flex-shrink-0"
                            >
                              {item.type}
                            </Chip>
                          </div>
                          
                          <p className="text-xs text-default-500 line-clamp-2">
                            {item.body}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-tiny text-default-400">
                              {formatTimestamp(item.timestamp)}
                            </p>
                            <Chip size="sm" variant="flat" className="text-tiny">
                              {item.category}
                            </Chip>
                          </div>
                          
                          {item.action && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="bordered"
                                color="primary"
                                className="text-xs"
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
                  
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="flex-shrink-0 self-start opacity-60 hover:opacity-100"
                    onClick={(e) => deleteNotification(e, item.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      className="text-default-400"
                    >
                      <path
                        fill="currentColor"
                        d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"
                      />
                    </svg>
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