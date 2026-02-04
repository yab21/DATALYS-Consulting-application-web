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
  ScrollShadow,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { motion } from "framer-motion";
import { 
  Search, 
  Send, 
  MessageCircle, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  Plus,
  ArrowLeft,
  Bug,
  MoreVertical,
  Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import messagesService, {
  Message,
  CreateMessageRequest
} from "@/services/messages";
import { UsersService, User } from "@/services/users";
import { ProjectsService, Project } from "@/services/projects";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";

// Types pour les conversations groupées par tickets
interface Conversation {
  id: string; // incident_number (ex: "INC-2025-00064")
  title: string; // incident_number
  subtitle: string; // titre original nettoyé
  lastMessage: Message;
  unreadCount: number;
  participants: string[];
  messages: Message[];
  updatedAt: string;
  // Informations du ticket
  incident_number: string;
  priority: string;
  priority_label: string;
  status: string;
  status_color: string;
  sla_prise_en_charge_status: string;
  sla_resolution_status: string;
  temps_restant_prise_en_charge?: any;
  temps_restant_resolution?: any;
  // Support pour les incidents (conservé pour compatibilité)
  incident_id?: string;
  expert_id?: string;
  isIncidentChat?: boolean;
}

const ModernMessagesInterface: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showNotification } = useSimpleNotifications();
  
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
    project_id: "",
    recipient_type: "normal" as "normal" | "specific_partner" | "all_partners",
    recipient_id: "",
    // Support incidents
    incident_id: "",
    expert_id: ""
  });
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  
  // États pour les utilisateurs (admins seulement)
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Map pour stocker les noms d'utilisateurs par ID
  const [userNamesMap, setUserNamesMap] = useState<Map<number, string>>(new Map());

  // Fonction utilitaire pour extraire le nom d'un utilisateur à partir d'un message
  const extractUserName = (message: any, isCurrentUser: boolean = false): string => {
    if (isCurrentUser && user?.name) {
      return user.name;
    }

    // Priorité 1: Nom direct du message
    if (message.sender_name) return message.sender_name;
    if (message.user?.name) return message.user.name;
    if (message.created_by_name) return message.created_by_name;
    
    // Priorité 2: Map des noms chargés
    const userId = message.created_by || message.user_id || message.sender_id;
    if (userId && userNamesMap.has(parseInt(userId))) {
      return userNamesMap.get(parseInt(userId))!;
    }
    
    // Priorité 3: Si c'est l'utilisateur connecté
    if (userId && user?.id && (parseInt(userId) === user.id || String(userId) === String(user.id))) {
      return user.name || 'Moi';
    }
    
    // Fallback: Utilisateur + ID
    return userId ? `Utilisateur ${userId}` : 'Utilisateur inconnu';
  };
  
  // États pour les projets
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // État pour réponse
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // États pour suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Récupérer les paramètres de l'URL pour le contexte de l'incident
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const partnerName = urlParams.get('partner_name');
    const projectName = urlParams.get('project_name');
    const incidentNumber = urlParams.get('incident_number');
    
    if (partnerName && incidentNumber && isAdmin()) {
      // Pré-remplir le nouveau message avec le contexte de l'incident
      setNewMessage(prev => ({
        ...prev,
        title: `Re: Incident ${incidentNumber} - ${projectName || 'Projet'}`,
        description: `Concernant votre incident ${incidentNumber}`,
        recipient_type: "specific_partner" as const
      }));
      
      // Ouvrir automatiquement le modal de nouveau message
      setShowNewMessageModal(true);
      
    }
  }, [isAdmin]);

  // Charger et organiser les messages en conversations
  useEffect(() => {
    loadMessages();
    loadUserNames(); // Charger les noms d'utilisateurs pour l'affichage
  }, []);
  
  // Mettre à jour la conversation sélectionnée quand les conversations changent
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      const updatedConversation = conversations.find(conv => conv.id === selectedConversation.id);
      if (updatedConversation && updatedConversation !== selectedConversation) {
        // Vérifier si le contenu a changé (nouveau message)
        const hasNewMessages = updatedConversation.messages.length !== selectedConversation.messages.length;
        if (hasNewMessages) {
          setSelectedConversation(updatedConversation);
        }
      }
    }
  }, [conversations, selectedConversation]);

  // Charger les projets
  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsService = new ProjectsService();
      const projectsResult = await projectsService.getActiveProjects();
      if (projectsResult && projectsResult.length > 0) {
        setProjects(projectsResult);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Charger les noms d'utilisateurs pour l'affichage des messages
  const loadUserNames = async () => {
    // Ne pas appeler l'API pour les partenaires (403 Forbidden)
    if ((user?.role_id !== 1 && String(user?.role_id) !== "1") || user?.partner_id) {
      return;
    }

    try {
      const usersResult = await UsersService.getUsersByCriteria({
        index: 0,
        size: 200,
        data: {}
      });
      
      if (usersResult && usersResult.items) {
        const namesMap = new Map<number, string>();
        usersResult.items.forEach((user: User) => {
          if (user.id && user.name) {
            namesMap.set(user.id, user.name);
          }
        });
        setUserNamesMap(namesMap);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des noms d\'utilisateurs (peut être normal pour les partenaires):', error);
      // Pour les partenaires, nous nous appuierons sur les données des messages eux-mêmes
    }
  };

  // Charger les utilisateurs quand un admin ouvre le modal
  const loadUsers = async () => {
    if (user?.role_id !== 1 && String(user?.role_id) !== "1") {
      return; // Seulement pour les admins
    }
    
    try {
      setLoadingUsers(true);
      
      // Récupérer SEULEMENT les utilisateurs normaux pour éviter l'erreur 401 sur partners
      let allUsers: any[] = [];
      
      try {
        const usersResult = await UsersService.getUsersByCriteria({
          index: 0,
          size: 100,
          data: { is_active: true }
        });
        
        // Ajouter les utilisateurs normaux
        if (usersResult && usersResult.items && usersResult.items.length > 0) {
          allUsers = [...usersResult.items];
        }
      } catch (usersError) {
        console.error('Erreur getUsersByCriteria:', usersError);
        allUsers = [];
      }
      
      // NE PLUS essayer de récupérer les partenaires car cela cause l'erreur 401
      // Les admins peuvent envoyer des messages aux utilisateurs disponibles
      
      setUsers(allUsers);
      
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

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
      
      if (!user?.id) {
        console.error('User ID not available');
        return;
      }
      
      // Récupérer les messages normaux avec gestion d'erreur robuste
      let messages: any[] = [];
      try {
        const messagesResponse = await messagesService.getMyMessages(0, 100);
        messages = messagesResponse.items || [];
      } catch (msgError) {
        console.error('❌ Erreur récupération messages:', msgError);
        // Ne pas propager l'erreur, juste continuer avec un tableau vide
        messages = [];
      }
      
      // Temporairement désactivé car l'API notifications retourne 500
      // try {
      //   const notificationsResponse = await messagesService.getUnreadNotifications(0, 100);
      //   const notifications = notificationsResponse.items || [];
      //   
      //   if (notifications.length > 0) {
      //     // Combiner messages et notifications
      //     messages = [...messages, ...notifications];
      //   }
      // } catch (notifError) {
      //   console.warn('⚠️ Impossible de récupérer les notifications:', notifError);
      // }
      
      // Récupérer les messages marqués comme lus depuis localStorage
      const readMessagesKey = `readMessages_user_${user?.id}`;
      const readMessageIds = new Set(JSON.parse(localStorage.getItem(readMessagesKey) || '[]'));

      // Organiser les messages en conversations
      const conversationsMap = new Map<string, Conversation>();
      
      messages.forEach((message: any) => {
        // Grouper par numéro de ticket (incident_number)
        const conversationKey = message.incident_number;
        
        // Nettoyer le titre pour éviter les "Réponse: " multiples
        let originalTitle = message.title || 'Sans titre';
        originalTitle = originalTitle.replace(/^(Réponse:\s*)+/gi, '').trim();
        
        // Utiliser la fonction utilitaire pour extraire le nom
        const senderName = extractUserName(message);
        
        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, {
            id: conversationKey,
            title: message.incident_number, // Titre = numéro du ticket
            subtitle: originalTitle, // Sous-titre = titre original nettoyé
            lastMessage: message,
            unreadCount: 0,
            participants: [senderName],
            messages: [],
            updatedAt: message.updated_at || new Date().toISOString(),
            // Informations du ticket
            incident_number: message.incident_number,
            priority: message.priority,
            priority_label: message.priority_label,
            status: message.status,
            status_color: message.status_color,
            sla_prise_en_charge_status: message.sla_prise_en_charge_status,
            sla_resolution_status: message.sla_resolution_status,
            temps_restant_prise_en_charge: message.temps_restant_prise_en_charge,
            temps_restant_resolution: message.temps_restant_resolution,
            // Support incidents (conservé pour compatibilité)
            incident_id: message.incident_id,
            expert_id: message.expert_id,
            isIncidentChat: true // Tous les messages sont maintenant liés à des incidents
          });
        }
        
        const conversation = conversationsMap.get(conversationKey)!;
        
        // Déterminer si c'est mon message
        const isMyMessage = (
          ((message as any).created_by && String((message as any).created_by) === String(user?.id)) ||
          ((message as any).user_id && String((message as any).user_id) === String(user?.id))
        );
        
        // Appliquer l'état "lu" depuis localStorage OU marquer automatiquement mes propres messages comme lus
        const messageWithReadState = {
          ...message,
          is_read: isMyMessage || message.is_read || readMessageIds.has(message.id)
        };
        
        conversation.messages.push(messageWithReadState);
        
        // Mettre à jour le dernier message
        const messageDate = new Date(message.updated_at || message.created_at || Date.now());
        const lastMessageDate = new Date(conversation.lastMessage.updated_at || conversation.lastMessage.created_at || 0);
        
        if (messageDate > lastMessageDate) {
          conversation.lastMessage = messageWithReadState; // Utiliser le message avec l'état "lu" correct
          conversation.updatedAt = message.updated_at || message.created_at || new Date().toISOString();
        }
        
        // Ajouter les participants
        if (senderName && !conversation.participants.includes(senderName)) {
          conversation.participants.push(senderName);
        }
        
        // Compter les non lus en tenant compte du localStorage
        if (!messageWithReadState.is_read) {
          conversation.unreadCount++;
        }
      });
      
      // Convertir en array et trier par date
      const conversationsArray = Array.from(conversationsMap.values())
        .map(conversation => ({
          ...conversation,
          // Trier les messages par ordre chronologique (ancien vers récent)
          messages: conversation.messages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }))
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
    // Marquer tous les messages de cette conversation comme lus (côté frontend uniquement)
    const updatedConversation = {
      ...conversation,
      unreadCount: 0,
      messages: conversation.messages.map(message => {
        // Toujours marquer tous les messages comme lus quand on ouvre la conversation
        return {
          ...message,
          is_read: true,
          read_at: message.read_at || new Date().toISOString()
        };
      })
    };

    // Sauvegarder l'état "lu" en localStorage pour persister après rechargement
    const readMessagesKey = `readMessages_user_${user?.id}`;
    const currentReadMessages = JSON.parse(localStorage.getItem(readMessagesKey) || '[]');
    const messageIds = conversation.messages.map(m => m.id);
    const updatedReadMessages = [...new Set([...currentReadMessages, ...messageIds])];
    localStorage.setItem(readMessagesKey, JSON.stringify(updatedReadMessages));
    
    // Mettre à jour la liste des conversations pour refléter les changements
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === conversation.id ? updatedConversation : conv
      )
    );
    
    setSelectedConversation(updatedConversation);
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
      
      // Utiliser replyToMessage pour toutes les réponses
      // Trouver le parent_id : premier message de la conversation
      const firstMessage = selectedConversation.messages[0];
      const parentId = parseInt(firstMessage?.id || selectedConversation.id);

      await messagesService.replyToMessage({
        parent_id: parentId,
        description: replyText.trim()
      });
      
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
      
      if (newMessage.recipient_type === "all_partners") {
        // Broadcast à tous les utilisateurs
        await messagesService.broadcastMessage({
          title: newMessage.title.trim(),
          description: newMessage.description.trim(),
          recipient_ids: "all"
        });
      } else {
        // Message normal ou vers un utilisateur spécifique
        const messageData: CreateMessageRequest = {
          title: newMessage.title.trim(),
          description: newMessage.description.trim(),
          priority: newMessage.priority,
          type: "message",
          category: "communication",
          project_id: newMessage.project_id ? parseInt(newMessage.project_id) : undefined,
          ...(newMessage.recipient_type === "specific_partner" && newMessage.recipient_id && {
            recipient_id: parseInt(newMessage.recipient_id)
          })
        };

        await messagesService.sendMessage(messageData);
      }
      
      // Réinitialiser le formulaire
      setNewMessage({
        title: "",
        description: "",
        priority: "moyenne",
        project_id: "",
        recipient_type: "normal",
        recipient_id: "",
        incident_id: "",
        expert_id: ""
      });
      
      setShowNewMessageModal(false);
      // Rechargement avec un petit délai pour s'assurer que le backend a traité
      setTimeout(async () => {
        await loadMessages();
      }, 500);
      
    } catch (error) {
      console.error('Erreur envoi nouveau message:', error);
    } finally {
      setSendingNewMessage(false);
    }
  };

  // Fonction pour vérifier si l'utilisateur peut supprimer un message
  const canDeleteMessage = (message: Message): boolean => {
    if (!user) {
      console.log('❌ canDeleteMessage: user is null');
      return false;
    }
    
    // Vérifier si c'est le propriétaire du message
    const isOwner = (
      ((message as any).created_by && String((message as any).created_by) === String(user.id)) ||
      ((message as any).user_id && String((message as any).user_id) === String(user.id))
    );
    
    // Seuls les admins (role_id = 1) peuvent supprimer n'importe quel message
    const isAdmin = user.role_id === 1;
    
    console.log('🔍 canDeleteMessage Debug:', {
      messageId: message.id,
      userId: user.id,
      userRole: user.role_id,
      messageCreatedBy: (message as any).created_by,
      messageUserId: (message as any).user_id,
      isOwner,
      isAdmin,
      canDelete: isOwner || isAdmin
    });
    
    return isOwner || isAdmin;
  };

  // Fonction pour supprimer un message
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      setIsDeleting(true);
      
      // Appeler l'API de suppression
      const result = await messagesService.deleteMessage(parseInt(messageToDelete.id));
      
      if (result.success) {
        // Mettre à jour l'état local
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            if (conv.id === selectedConversation?.id) {
              // Retirer le message supprimé de la conversation
              const updatedMessages = conv.messages.filter(m => m.id !== messageToDelete.id);
              
              if (updatedMessages.length === 0) {
                // Si plus de messages, la conversation sera supprimée
                return null;
              }
              
              // Mettre à jour le dernier message
              const newLastMessage = updatedMessages[updatedMessages.length - 1];
              
              return {
                ...conv,
                messages: updatedMessages,
                lastMessage: newLastMessage,
                updatedAt: newLastMessage.updated_at || newLastMessage.created_at
              };
            }
            return conv;
          }).filter((conv): conv is Conversation => conv !== null) // Filter avec type guard
        );

        // Si la conversation sélectionnée n'a plus de messages, la désélectionner
        if (selectedConversation) {
          const updatedConv = conversations.find(c => c.id === selectedConversation.id);
          const hasMessages = updatedConv ? updatedConv.messages.filter(m => m.id !== messageToDelete.id).length > 0 : false;
          
          if (!hasMessages) {
            setSelectedConversation(null);
            if (isMobile) {
              setShowConversationDetail(false);
            }
          }
        }
        
        // Afficher une notification de succès
        showNotification(simpleNotificationHelpers.success(
          "Suppression réussie",
          "Le message a été supprimé avec succès"
        ));
        
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur de suppression",
        error instanceof Error ? error.message : "Impossible de supprimer le message"
      ));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  // Fonction pour ouvrir la modal de confirmation de suppression
  const openDeleteModal = (message: Message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const getTypeIcon = (type: string, isIncidentChat?: boolean) => {
    if (isIncidentChat) {
      return <Bug className="h-4 w-4 text-orange-500" />;
    }
    
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
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const incidentNumberMatch = conv.incident_number?.toLowerCase().includes(searchLower) || false;
    const titleMatch = conv.title?.toLowerCase().includes(searchLower) || false;
    const subtitleMatch = conv.subtitle?.toLowerCase().includes(searchLower) || false;
    const participantMatch = conv.participants?.some(p => 
      p?.toLowerCase().includes(searchLower)
    ) || false;
    const messageMatch = conv.messages?.some(m => 
      m.description?.toLowerCase().includes(searchLower)
    ) || false;
    const statusMatch = conv.status?.toLowerCase().includes(searchLower) || false;
    const priorityMatch = conv.priority?.toLowerCase().includes(searchLower) || false;
    
    return incidentNumberMatch || titleMatch || subtitleMatch || participantMatch || messageMatch || statusMatch || priorityMatch;
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
            onPress={async () => {
              setShowNewMessageModal(true);
              // Charger les projets pour tous
              await loadProjects();
              // Charger les utilisateurs immédiatement pour les admins
              if (user?.role_id === 1 || String(user?.role_id) === "1") {
                await loadUsers();
              }
            }}
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
                  placeholder="Rechercher par numéro de ticket, statut, priorité..."
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
                            {getTypeIcon(conversation.lastMessage.type, conversation.isIncidentChat)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h3 className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                  🎫 {conversation.title}
                                </h3>
                                <Chip 
                                  size="sm" 
                                  variant="flat"
                                  color={conversation.priority === 'P0' ? 'danger' : conversation.priority === 'P1' ? 'warning' : 'primary'}
                                  className="text-xs"
                                >
                                  {conversation.priority}
                                </Chip>
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatTime(conversation.updatedAt)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mb-1">
                              {conversation.subtitle}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                              {conversation.lastMessage.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Chip 
                                  size="sm" 
                                  variant="dot"
                                  color={conversation.status === 'ouvert' ? 'warning' : conversation.status === 'resolu' ? 'success' : 'default'}
                                  className="text-xs"
                                >
                                  {conversation.status}
                                </Chip>
                                <span className="text-xs text-gray-400">
                                  💬 {conversation.messages.length} msg
                                </span>
                                {conversation.sla_resolution_status === 'depasse' && (
                                  <span className="text-xs text-red-500">⏰ SLA dépassé</span>
                                )}
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
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                              🎫 {selectedConversation.title}
                            </h2>
                            <Chip 
                              size="sm" 
                              variant="flat"
                              color={selectedConversation.priority === 'P0' ? 'danger' : selectedConversation.priority === 'P1' ? 'warning' : 'primary'}
                            >
                              {selectedConversation.priority}
                            </Chip>
                            <Chip 
                              size="sm" 
                              variant="dot"
                              color={selectedConversation.status === 'ouvert' ? 'warning' : selectedConversation.status === 'resolu' ? 'success' : 'default'}
                            >
                              {selectedConversation.status}
                            </Chip>
                            {selectedConversation.sla_resolution_status === 'depasse' && (
                              <Chip size="sm" color="danger" variant="flat">
                                ⏰ SLA dépassé
                              </Chip>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedConversation.subtitle}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.participants.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollShadow className="flex-1 p-4 space-y-4">
                  {selectedConversation.messages.map((message, index) => {
                    // Utiliser les champs corrects identifiés dans les logs
                    const isMyMessage = (
                      // Vérifier created_by (présent dans tous les messages)
                      ((message as any).created_by && String((message as any).created_by) === String(user?.id)) ||
                      // Vérifier user_id (présent dans certains messages)
                      ((message as any).user_id && String((message as any).user_id) === String(user?.id)) ||
                      // Fallback vers sender_id au cas où il serait défini
                      (message.sender_id && String(message.sender_id) === String(user?.id))
                    );
                    
                    // Pour l'instant, désactiver la logique temporelle qui est incorrecte
                    // Concentrons-nous sur les champs réels dans les données
                    
                    
                    return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      <div className={`max-w-[70%] px-4 py-3 relative shadow-lg group ${
                        isMyMessage
                          ? 'text-white rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl ml-12'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl mr-12'
                      }`}
                      style={isMyMessage ? { backgroundColor: '#4ba9b7' } : {}}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${isMyMessage ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                              {extractUserName(message, isMyMessage)}
                            </span>
                            <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(message.priority)}`} />
                          </div>
                          
                          {/* Menu contextuel pour supprimer */}
                          {canDeleteMessage(message) && (
                            <div className="opacity-100 transition-opacity">
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    className={`min-w-unit-6 h-unit-6 bg-red-100 border border-red-300 ${isMyMessage ? 'text-red-600 hover:text-red-800 hover:bg-red-200' : 'text-red-600 hover:text-red-800 hover:bg-red-200'}`}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Actions du message">
                                  <DropdownItem
                                    key="delete"
                                    color="danger"
                                    startContent={<Trash2 className="h-4 w-4" />}
                                    onPress={() => openDeleteModal(message)}
                                  >
                                    Supprimer le message
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {message.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-75">
                            {formatTime(message.created_at)}
                          </span>
                          {isMyMessage && (
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
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ScrollShadow>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Tapez votre réponse..."
                       
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
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Nouveau Message</h3>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Sujet"
                    placeholder="Entrez le sujet de votre message..."
                   
                    onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                    isRequired
                  />

                  <Select
                    label="Priorité"
                    placeholder="Sélectionner la priorité"
                    selectedKeys={[newMessage.priority]}
                    onSelectionChange={(keys) => {
                      const priority = Array.from(keys)[0] as "faible" | "moyenne" | "haute" | "critique";
                      setNewMessage({...newMessage, priority});
                    }}
                    isRequired
                  >
                    <SelectItem key="faible">🟢 Faible</SelectItem>
                    <SelectItem key="moyenne">🟡 Moyenne</SelectItem>
                    <SelectItem key="haute">🟠 Haute</SelectItem>
                    <SelectItem key="critique">🔴 Critique</SelectItem>
                  </Select>

                  {/* Section Destinataires - seulement pour les admins */}
                  {(user?.role_id === 1 || String(user?.role_id) === "1") && (
                    <div className="space-y-4">
                      <Select
                        label="Destinataires"
                        placeholder="Sélectionner le type de destinataire"
                        selectedKeys={[newMessage.recipient_type]}
                        onSelectionChange={(keys) => {
                          const recipientType = Array.from(keys)[0] as "normal" | "specific_partner" | "all_partners";
                          setNewMessage({...newMessage, recipient_type: recipientType, recipient_id: ""});
                        }}
                      >
                        <SelectItem key="normal">Message normal</SelectItem>
                        <SelectItem key="specific_partner">Utilisateur spécifique</SelectItem>
                        <SelectItem key="all_partners">Tous les utilisateurs</SelectItem>
                      </Select>
                      
                      {/* Sélection de l'utilisateur spécifique */}
                      {newMessage.recipient_type === "specific_partner" && (
                        <Select
                          label="Sélectionner un utilisateur"
                          placeholder="Choisir un utilisateur"
                          selectionMode="single"
                          selectedKeys={newMessage.recipient_id ? new Set([newMessage.recipient_id]) : new Set()}
                          onSelectionChange={(keys) => {
                            const keysArray = Array.from(keys);
                            const recipientId = keysArray[0] as string;
                            if (recipientId && recipientId !== 'undefined') {
                              setNewMessage({...newMessage, recipient_id: recipientId});
                            }
                          }}
                          isLoading={loadingUsers}
                          aria-label="Sélectionner un utilisateur"
                          onOpenChange={(isOpen) => {
                            if (isOpen && users.length === 0) {
                              loadUsers();
                            }
                          }}
                        >
                          {users.length === 0 ? (
                            <SelectItem key="loading" isReadOnly>
                              {loadingUsers ? "Chargement..." : "Aucun utilisateur"}
                            </SelectItem>
                          ) : (
                            users.map((user) => (
                              <SelectItem 
                                key={user.id.toString()} 
                                textValue={`${user.name} (${user.email})`}
                              >
                                {user.name} ({user.email})
                              </SelectItem>
                            ))
                          )}
                        </Select>
                      )}
                    </div>
                  )}

                  <Select
                    label="Projet"
                    placeholder="Sélectionner un projet (optionnel)"
                    selectedKeys={newMessage.project_id ? [newMessage.project_id] : []}
                    onSelectionChange={(keys) => {
                      const projectId = Array.from(keys)[0] as string;
                      setNewMessage({...newMessage, project_id: projectId || ""});
                    }}
                    isLoading={loadingProjects}
                  >
                    {projects.map((project) => (
                      <SelectItem key={project.id.toString()} textValue={`${project.title} ${project.partner_name ? `(${project.partner_name})` : ''}`}>
                        {project.title} {project.partner_name ? `(${project.partner_name})` : ''}
                      </SelectItem>
                    ))}
                  </Select>

                  <Textarea
                    label="Message"
                    placeholder="Décrivez votre message..."
                   
                    onChange={(e) => setNewMessage({...newMessage, description: e.target.value})}
                    minRows={3}
                    isRequired
                  />
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

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        size="md"
        placement="center"
        classNames={{
          wrapper: "z-[100001]",
          backdrop: "z-[99999]"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Supprimer le message</h3>
                    <p className="text-sm text-gray-600 mt-1">Cette action est irréversible</p>
                  </div>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Êtes-vous sûr de vouloir supprimer ce message ? Cette action ne peut pas être annulée.
                  </p>
                  
                  {messageToDelete && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {extractUserName(messageToDelete)}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(messageToDelete.priority)}`} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {messageToDelete.description}
                      </p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        {formatTime(messageToDelete.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button 
                  variant="light" 
                  onPress={onClose}
                  isDisabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeleting}
                  isDisabled={isDeleting}
                  onPress={handleDeleteMessage}
                  startContent={!isDeleting ? <Trash2 className="h-4 w-4" /> : undefined}
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
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