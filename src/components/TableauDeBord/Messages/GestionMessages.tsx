"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Textarea,
  Avatar,
  Divider,
  ScrollShadow,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Send, 
  MessageCircle, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Reply,
  Plus,
  Paperclip,
  Phone,
  Video,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import messagesService, { 
  Message, 
  CreateMessageRequest,
  ReplyMessageRequest 
} from "@/services/messages";

// Types pour l'état local
interface MessageStats {
  total: number;
  unread: number;
  support_open: number;
  support_resolved: number;
  critical: number;
  avg_response_time: number;
}

const GestionMessages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("tous");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    unread: 0,
    support_open: 0,
    support_resolved: 0,
    critical: 0,
    avg_response_time: 0
  });


  // État pour réponse
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Charger les données initiales
  useEffect(() => {
    loadMessages();
    loadStats();
  }, []);

  // Filtrage des messages
  useEffect(() => {
    let filtered = messages;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par type
    if (filterType !== "tous") {
      filtered = filtered.filter(message => message.type === filterType);
    }

    // Filtrage par statut
    if (filterStatus !== "tous") {
      filtered = filtered.filter(message => message.status === filterStatus);
    }


    setFilteredMessages(filtered);
  }, [messages, searchTerm, filterType, filterStatus]);

  // Auto-scroll vers le bas des conversations
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationMessages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesService.getMyMessages(0, 50);
      setMessages(response.items || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await messagesService.getCommunicationStats();
      setStats({
        total: response.total_messages,
        unread: response.unread_messages,
        support_open: response.open_support_tickets,
        support_resolved: response.resolved_tickets,
        critical: response.critical_priority,
        avg_response_time: response.avg_response_time
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setStats({
        total: 0,
        unread: 0,
        support_open: 0,
        support_resolved: 0,
        critical: 0,
        avg_response_time: 0
      });
    }
  };

  const loadConversation = async (messageId: string) => {
    try {
      const response = await messagesService.getConversationThread(messageId);
      setConversationMessages(response.items || []);
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
      setConversationMessages([]);
    }
  };


  const handleReply = async () => {
    if (!replyText || !selectedMessage) return;

    try {
      setSending(true);
      const replyData: ReplyMessageRequest = {
        parent_id: selectedMessage.id,
        description: replyText
      };
      
      await messagesService.replyToMessage(replyData);
      
      // Recharger la conversation pour avoir les données à jour
      loadConversation(selectedMessage.id);
      setReplyText("");
    } catch (error) {
      console.error('Erreur réponse:', error);
    } finally {
      setSending(false);
    }
  };

  const handleInlineReply = async (messageId: string, replyText: string) => {
    if (!replyText.trim()) return;

    try {
      setSending(true);
      
      // Utiliser l'API POST /messages/send pour envoyer la réponse
      const originalMessage = messages.find(m => m.id === messageId);
      const replyData: CreateMessageRequest = {
        title: `Réponse à: ${originalMessage?.title || 'Message'}`,
        description: replyText,
        priority: "moyenne"
      };
      
      await messagesService.sendMessage(replyData);
      
      // Recharger tous les messages pour avoir la liste à jour
      await loadMessages();
      
      // Actualiser les stats
      await loadStats();
    } catch (error) {
      console.error('Erreur réponse inline:', error);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messagesService.markAsRead(messageId);
      
      // Recharger les messages pour avoir l'état à jour
      await loadMessages();
      await loadStats();
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageCircle className="h-4 w-4" />;
      case "support": return <AlertTriangle className="h-4 w-4" />;
      case "notification": return <Clock className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ouvert": return "danger";
      case "en_cours": return "warning";
      case "resolu": return "success";
      case "ferme": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critique": return "danger";
      case "haute": return "warning";
      case "moyenne": return "primary";
      case "faible": return "success";
      default: return "default";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return "Il y a moins d'1h";
    if (hours < 24) return `Il y a ${Math.round(hours)}h`;
    if (hours < 48) return "Hier";
    return `Il y a ${Math.round(hours / 24)} jours`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques des messages */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Messages
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Non lus
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.unread}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                  <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Support Ouvert
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.support_open}
                  </p>
                </div>
                <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Support Résolu
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.support_resolved}
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Critique
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.critical}
                  </p>
                </div>
                <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Temps Moyen
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.avg_response_time}h
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Filtres et actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <Input
                  placeholder="Rechercher un message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={<Search className="h-4 w-4 text-gray-400" />}
                  className="max-w-md"
                />
                
                <Select
                  placeholder="Type"
                  selectedKeys={filterType ? [filterType] : []}
                  onSelectionChange={(keys) => setFilterType(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  <SelectItem key="tous" value="tous">Tous</SelectItem>
                  <SelectItem key="message" value="message">Messages</SelectItem>
                  <SelectItem key="support" value="support">Support</SelectItem>
                  <SelectItem key="notification" value="notification">Notifications</SelectItem>
                </Select>

                <Select
                  placeholder="Statut"
                  selectedKeys={filterStatus ? [filterStatus] : []}
                  onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                >
                  <SelectItem key="tous" value="tous">Tous</SelectItem>
                  <SelectItem key="ouvert" value="ouvert">Ouvert</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                  <SelectItem key="ferme" value="ferme">Fermé</SelectItem>
                </Select>

                <Button
                  variant="light"
                  startContent={<RefreshCw className="h-4 w-4" />}
                  onPress={loadMessages}
                >
                  Actualiser
                </Button>
              </div>

            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {filteredMessages.length} message(s) trouvé(s)
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Messages en style forum */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        {filteredMessages.length === 0 ? (
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun message trouvé</p>
            </CardBody>
          </Card>
        ) : (
          filteredMessages.map((message, index) => (
            <ForumMessageCard
              key={message.id}
              message={message}
              index={index}
              onReply={(messageId, replyText) => handleInlineReply(messageId, replyText)}
              onMarkAsRead={(messageId) => handleMarkAsRead(messageId)}
              formatTimeAgo={formatTimeAgo}
              getTypeIcon={getTypeIcon}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              currentUser={user}
              loading={sending}
            />
          ))
        )}
      </motion.div>


      {/* Modal conversation */}
      <Modal
        isOpen={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/50">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedMessage?.title}</h3>
                  <p className="text-sm text-gray-600">
                    Conversation avec {selectedMessage?.sender_name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button isIconOnly variant="light" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button isIconOnly variant="light" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="max-h-[60vh]">
            <ScrollShadow className="h-full">
              <div className="space-y-4">
                {/* Message principal */}
                {selectedMessage && (
                  <div className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Avatar
                      size="sm"
                      name={selectedMessage.sender_name.charAt(0)}
                      className="bg-primary-100 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{selectedMessage.sender_name}</span>
                          <Chip size="sm" variant="flat" color={getPriorityColor(selectedMessage.priority)}>
                            {selectedMessage.priority}
                          </Chip>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(selectedMessage.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">
                        {selectedMessage.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages de la conversation */}
                {conversationMessages.filter(msg => msg.parent_id).map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex gap-3 ${
                      message.sender_id === user?.id?.toString() ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar
                      size="sm"
                      name={message.sender_name.charAt(0)}
                      className="bg-secondary-100 text-secondary-600"
                    />
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender_id === user?.id?.toString()
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{message.sender_name}</span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{message.description}</p>
                    </div>
                  </motion.div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollShadow>
            
            {/* Zone de réponse */}
            <Divider className="my-4" />
            <div className="flex gap-3">
              <Avatar
                size="sm"
                name={user?.name?.charAt(0) || "U"}
                className="bg-success-100 text-success-600"
              />
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Tapez votre réponse..."
                  value={replyText}
                  onValueChange={setReplyText}
                  minRows={2}
                  maxRows={4}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    color="primary"
                    size="sm"
                    isIconOnly
                    onPress={handleReply}
                    isLoading={sending}
                  >
                    {!sending && <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

// Composant ForumMessageCard pour l'affichage en style forum
interface ForumMessageCardProps {
  message: Message;
  index: number;
  onReply: (messageId: string, replyText: string) => void;
  onMarkAsRead: (messageId: string) => void;
  formatTimeAgo: (dateString: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  getPriorityColor: (priority: string) => "danger" | "warning" | "primary" | "success" | "default";
  getStatusColor: (status: string) => "danger" | "warning" | "success" | "default";
  currentUser: any;
  loading: boolean;
}

const ForumMessageCard: React.FC<ForumMessageCardProps> = ({
  message,
  index,
  onReply,
  onMarkAsRead,
  formatTimeAgo,
  getTypeIcon,
  getPriorityColor,
  getStatusColor,
  currentUser,
  loading
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    
    await onReply(message.id, replyText);
    setReplyText("");
    setShowReplyForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`border ${!message.is_read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'} dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg transition-all duration-200`}>
        <CardBody className="p-6">
          {/* En-tête du message */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Avatar
                size="md"
                name={message.sender_name?.charAt(0) || 'U'}
                className="bg-primary-100 text-primary-600"
              />
              {!message.is_read && (
                <div className="h-3 w-3 rounded-full bg-blue-500 absolute -top-1 -right-1" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Métadonnées */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {message.sender_name || 'Utilisateur'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {message.sender_role || 'N/A'}
                  </span>
                  <div className="flex gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      startContent={getTypeIcon(message.type || 'message')}
                    >
                      {message.type || 'message'}
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getPriorityColor(message.priority || 'moyenne')}
                    >
                      {message.priority || 'moyenne'}
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStatusColor(message.status || 'ouvert')}
                    >
                      {message.status || 'ouvert'}
                    </Chip>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {message.created_at ? formatTimeAgo(message.created_at) : 'N/A'}
                </span>
              </div>
              
              {/* Titre du message */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {message.title || 'Message sans titre'}
              </h3>
              
              {/* Description */}
              <div className="prose prose-sm max-w-none">
                <p className={`text-gray-700 dark:text-gray-300 ${!isExpanded && message.description && message.description.length > 200 ? 'line-clamp-3' : ''}`}>
                  {message.description || 'Aucune description'}
                </p>
                {message.description && message.description.length > 200 && (
                  <Button
                    variant="light"
                    size="sm"
                    onPress={() => setIsExpanded(!isExpanded)}
                    className="mt-2 p-0 h-auto text-blue-600"
                  >
                    {isExpanded ? 'Voir moins' : 'Voir plus'}
                  </Button>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<Reply className="h-4 w-4" />}
                    onPress={() => setShowReplyForm(!showReplyForm)}
                    color="primary"
                  >
                    Répondre
                  </Button>
                  {!message.is_read && (
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={<CheckCircle className="h-4 w-4" />}
                      onPress={() => onMarkAsRead(message.id)}
                      color="success"
                    >
                      Marquer lu
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {message.created_at ? new Date(message.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  }) : 'N/A'}
                </div>
              </div>
              
              {/* Formulaire de réponse inline */}
              <AnimatePresence>
                {showReplyForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex gap-3">
                      <Avatar
                        size="sm"
                        name={currentUser?.name?.charAt(0) || "U"}
                        className="bg-success-100 text-success-600 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <Textarea
                          placeholder="Tapez votre réponse..."
                          value={replyText}
                          onValueChange={setReplyText}
                          minRows={3}
                          maxRows={6}
                        />
                        <div className="flex gap-2 mt-3">
                          <Button
                            color="primary"
                            size="sm"
                            onPress={handleSubmitReply}
                            isLoading={loading}
                            startContent={!loading ? <Send className="h-4 w-4" /> : undefined}
                            isDisabled={!replyText.trim()}
                          >
                            {loading ? "Envoi..." : "Envoyer"}
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            onPress={() => {
                              setShowReplyForm(false);
                              setReplyText("");
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default GestionMessages;