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
  Send, 
  MessageCircle, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import messagesService, { 
  Message, 
  CreateMessageRequest,
  ReplyMessageRequest 
} from "@/services/messages";

// Types pour les conversations groupées
interface Conversation {
  id: string;
  title: string;
  lastMessage: Message;
  unreadCount: number;
  participants: string[];
  messages: Message[];
  updatedAt: string;
}

const ModernMessagesInterface: React.FC = () => {
  const { user } = useAuth();
  
  // États principaux
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // États mobile
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  
  // États pour nouveau message
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    description: "",
    priority: "moyenne" as "faible" | "moyenne" | "haute" | "critique",
    project_id: ""
  });
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  
  // État pour réponse
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Charger et organiser les messages en conversations
  useEffect(() => {
    loadMessages();
  }, []);

  // Scroll vers le bas automatiquement
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesService.getMyMessages(0, 100);
      const messages = response.items || [];
      
      // Organiser les messages en conversations
      const conversationsMap = new Map<string, Conversation>();
      
      messages.forEach(message => {
        // Grouper par titre de conversation (parent_id pour les réponses, sinon par title)
        const conversationKey = message.parent_id || message.id;
        const conversationTitle = message.title || 'Sans titre';
        const senderName = message.sender_name || 'Utilisateur inconnu';
        
        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, {
            id: conversationKey,
            title: conversationTitle,
            lastMessage: message,
            unreadCount: 0,
            participants: [senderName],
            messages: [],
            updatedAt: message.updated_at || new Date().toISOString()
          });
        }
        
        const conversation = conversationsMap.get(conversationKey)!;
        conversation.messages.push(message);
        
        // Mettre à jour le dernier message
        const messageDate = new Date(message.updated_at || message.created_at || Date.now());
        const lastMessageDate = new Date(conversation.lastMessage.updated_at || conversation.lastMessage.created_at || 0);
        
        if (messageDate > lastMessageDate) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.updated_at || message.created_at || new Date().toISOString();
        }
        
        // Ajouter les participants
        if (senderName && !conversation.participants.includes(senderName)) {
          conversation.participants.push(senderName);
        }
        
        // Compter les non lus
        if (!message.is_read) {
          conversation.unreadCount++;
        }
      });
      
      // Convertir en array et trier par date
      const conversationsArray = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setConversations(conversationsArray);
      
      // Sélectionner la première conversation par défaut
      if (conversationsArray.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsArray[0]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowConversationDetail(true);
    }
  };

  const handleBackToList = () => {
    setShowConversationDetail(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      setSending(true);
      
      const replyData: ReplyMessageRequest = {
        parent_id: selectedConversation.id,
        description: replyText.trim()
      };
      
      await messagesService.replyToMessage(replyData);
      
      setReplyText("");
      await loadMessages(); // Recharger pour voir la nouvelle réponse
      
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.title.trim() || !newMessage.description.trim()) return;

    try {
      setSendingNewMessage(true);
      
      const messageData: CreateMessageRequest = {
        title: newMessage.title.trim(),
        description: newMessage.description.trim(),
        priority: newMessage.priority,
        project_id: newMessage.project_id ? parseInt(newMessage.project_id) : undefined
      };
      
      await messagesService.sendMessage(messageData);
      
      // Réinitialiser le formulaire
      setNewMessage({
        title: "",
        description: "",
        priority: "moyenne",
        project_id: ""
      });
      
      setShowNewMessageModal(false);
      await loadMessages();
      
    } catch (error) {
      console.error('Erreur envoi nouveau message:', error);
    } finally {
      setSendingNewMessage(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critique": return "bg-red-500";
      case "haute": return "bg-orange-500";
      case "moyenne": return "bg-blue-500";
      case "faible": return "bg-green-500";
      default: return "bg-gray-400";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = conv.title?.toLowerCase().includes(searchLower) || false;
    const participantMatch = conv.participants?.some(p => 
      p?.toLowerCase().includes(searchLower)
    ) || false;
    return titleMatch || participantMatch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-gray-200 animate-pulse dark:bg-gray-700" />
        <div className="h-96 rounded-2xl bg-gray-200 animate-pulse dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {conversations.length} conversation(s)
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => setShowNewMessageModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            Nouveau Message
          </Button>
        </div>
      </motion.div>

      {/* Interface principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex gap-6 overflow-hidden"
      >
        {/* Liste des conversations */}
        <div className={`${isMobile && showConversationDetail ? 'hidden' : 'flex'} flex-col w-full md:w-1/3 lg:w-1/4`}>
          <Card className="h-full border border-gray-200 dark:border-gray-700">
            <CardBody className="p-0">
              {/* Recherche */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Input
                  placeholder="Rechercher une conversation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={<Search className="h-4 w-4 text-gray-400" />}
                  variant="bordered"
                />
              </div>

              {/* Liste des conversations */}
              <ScrollShadow className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune conversation trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(conversation.lastMessage.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                {conversation.title}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.updatedAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conversation.lastMessage.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(conversation.lastMessage.priority)}`} />
                                <span className="text-xs text-gray-500">
                                  {conversation.participants.join(', ')}
                                </span>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Chip size="sm" color="danger" variant="solid">
                                  {conversation.unreadCount}
                                </Chip>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollShadow>
            </CardBody>
          </Card>
        </div>

        {/* Détail de la conversation */}
        <div className={`${isMobile && !showConversationDetail ? 'hidden' : 'flex'} flex-col flex-1`}>
          {selectedConversation ? (
            <Card className="h-full border border-gray-200 dark:border-gray-700">
              <CardBody className="p-0 flex flex-col h-full">
                {/* En-tête de conversation */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <Button
                          isIconOnly
                          variant="light"
                          onPress={handleBackToList}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.participants.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollShadow className="flex-1 p-4 space-y-4">
                  {selectedConversation.messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${message.sender_id === user?.id.toString() ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${
                        message.sender_id === user?.id.toString()
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      } rounded-2xl px-4 py-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {message.sender_name}
                          </span>
                          <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(message.priority)}`} />
                        </div>
                        <p className="text-sm leading-relaxed">
                          {message.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-75">
                            {formatTime(message.created_at)}
                          </span>
                          {message.sender_id === user?.id.toString() && (
                            <div className="flex items-center gap-1">
                              {message.is_read ? (
                                <CheckCircle className="h-3 w-3 opacity-75" />
                              ) : (
                                <Clock className="h-3 w-3 opacity-75" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollShadow>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Tapez votre réponse..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        minRows={1}
                        maxRows={4}
                        variant="bordered"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />
                    </div>
                    <Button
                      isIconOnly
                      color="primary"
                      isDisabled={!replyText.trim() || sending}
                      isLoading={sending}
                      onPress={handleSendReply}
                      className="mb-1"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="h-full border border-gray-200 dark:border-gray-700">
              <CardBody className="flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choisissez une conversation pour voir les messages
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Modal Nouveau Message */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        size="2xl"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Nouveau Message</h3>
                  <p className="text-sm text-gray-500">Créer une nouvelle conversation</p>
                </div>
              </ModalHeader>
              
              <ModalBody className="py-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Entrez le sujet de votre message..."
                      value={newMessage.title}
                      onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                      variant="bordered"
                      size="lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priorité</label>
                    <Select
                      placeholder="Sélectionner la priorité"
                      selectedKeys={[newMessage.priority]}
                      onSelectionChange={(keys) => {
                        const priority = Array.from(keys)[0] as "faible" | "moyenne" | "haute" | "critique";
                        setNewMessage({...newMessage, priority});
                      }}
                      variant="bordered"
                      size="lg"
                    >
                      <SelectItem key="faible" value="faible">🟢 Faible</SelectItem>
                      <SelectItem key="moyenne" value="moyenne">🟡 Moyenne</SelectItem>
                      <SelectItem key="haute" value="haute">🟠 Haute</SelectItem>
                      <SelectItem key="critique" value="critique">🔴 Critique</SelectItem>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID du Projet</label>
                    <Input
                      placeholder="ID du projet (optionnel)"
                      value={newMessage.project_id}
                      onChange={(e) => setNewMessage({...newMessage, project_id: e.target.value})}
                      variant="bordered"
                      size="lg"
                      type="number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Décrivez votre message..."
                      value={newMessage.description}
                      onChange={(e) => setNewMessage({...newMessage, description: e.target.value})}
                      variant="bordered"
                      size="lg"
                      minRows={4}
                    />
                  </div>
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button
                  color="primary"
                  isLoading={sendingNewMessage}
                  isDisabled={!newMessage.title.trim() || !newMessage.description.trim()}
                  onPress={handleSendNewMessage}
                >
                  Envoyer Message
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ModernMessagesInterface;