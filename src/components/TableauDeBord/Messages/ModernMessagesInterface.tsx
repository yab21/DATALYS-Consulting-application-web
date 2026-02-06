"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useSSE } from "@/hooks/useSSE";
import { SSENotification } from "@/services/sse-service";

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

  // Référence pour accéder à loadMessages dans le callback SSE
  const loadMessagesRef = useRef<(() => Promise<void>) | null>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);

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
    recipient_type: "specific_partner" as "specific_partner" | "all_partners",
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
    const userId = message.created_by || message.user_id || message.sender_id;

    // Si c'est l'utilisateur connecté
    if (isCurrentUser || (userId && user?.id && (parseInt(userId) === user.id || String(userId) === String(user.id)))) {
      return user?.name || 'Moi';
    }

    // Nom direct du message
    if (message.sender_name) return message.sender_name;
    if (message.user?.name) return message.user.name;
    if (message.created_by_name) return message.created_by_name;

    // Map des noms chargés (disponible pour les admins)
    if (userId && userNamesMap.has(parseInt(userId))) {
      return userNamesMap.get(parseInt(userId))!;
    }

    // Fallback : pour les partenaires, l'autre utilisateur est le support
    // Pour les admins, afficher "Partenaire" si le nom est inconnu
    if (userId) {
      const isCurrentUserAdmin = user?.role_id === 1 || String(user?.role_id) === "1";
      return isCurrentUserAdmin ? `Partenaire` : 'Support DATALYS';
    }

    return 'Utilisateur inconnu';
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

  // SSE pour le temps réel - rafraîchir quand un nouveau message arrive
  const handleSSENotification = useCallback((notification: SSENotification) => {
    if (notification.type === 'message') {
      console.log('📩 Nouveau message reçu via SSE, rafraîchissement...');
      loadMessagesRef.current?.();
    }
  }, []);

  useSSE({
    autoConnect: true,
    onNotification: handleSSENotification
  });

  // Synchroniser selectedConversationRef
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

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
      const partnerUserId = urlParams.get('partner_user_id');

      // Pré-remplir le nouveau message avec le contexte de l'incident
      setNewMessage(prev => ({
        ...prev,
        title: `Re: Incident ${incidentNumber} - ${projectName || 'Projet'}`,
        description: `Concernant votre incident ${incidentNumber}`,
        recipient_type: "specific_partner" as const,
        ...(partnerUserId ? { recipient_id: partnerUserId } : {})
      }));

      // Ouvrir automatiquement le modal de nouveau message
      setShowNewMessageModal(true);

      // Charger les utilisateurs pour que le dropdown affiche le nom
      loadUsers();
    }
  }, [isAdmin]);

  // Charger et organiser les messages en conversations
  useEffect(() => {
    loadMessages();
    loadUserNames();
  }, []);

  // Ouvrir automatiquement une conversation depuis le paramètre URL ?open=
  useEffect(() => {
    if (loading || conversations.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const openMessageId = urlParams.get('open');

    if (openMessageId) {
      // Chercher la conversation qui contient ce message
      const targetConversation = conversations.find(conv =>
        conv.messages.some(m =>
          String(m.id) === openMessageId ||
          String((m as any).parent_id) === openMessageId
        )
      );

      if (targetConversation && targetConversation.id !== selectedConversation?.id) {
        handleSelectConversation(targetConversation);
      }

      // Nettoyer l'URL après ouverture
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [loading, conversations]);



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
      
      // Filtrer les messages supprimés (soft delete)
      // La logique doit tenir compte de QUI a supprimé et QUI consulte
      messages = messages.filter((message: any) => {
        if (message.is_deleted) return false;

        const isCurrentUserSender = String(message.created_by) === String(user?.id);
        const isCurrentUserRecipient = String(message.recipient_id) === String(user?.id);

        // Si je suis l'expéditeur et que j'ai supprimé ce message → cacher pour moi
        if (isCurrentUserSender && message.deleted_by_sender) return false;

        // Si je suis le destinataire et que j'ai supprimé ce message → cacher pour moi
        if (isCurrentUserRecipient && message.deleted_by_recipient) return false;

        return true;
      });

      // Récupérer les messages marqués comme lus depuis localStorage
      const readMessagesKey = `readMessages_user_${user?.id}`;
      let readMessageIds: Set<any>;
      try {
        readMessageIds = new Set(JSON.parse(localStorage.getItem(readMessagesKey) || '[]'));
      } catch {
        readMessageIds = new Set();
      }

      // Détecter les messages broadcast (même titre, description, created_by, created_at)
      // et leur assigner un même conversation key pour les regrouper
      const broadcastKeyMap = new Map<string, string>(); // broadcastKey -> first thread_ticket_number
      messages.forEach((message: any) => {
        const key = message.thread_ticket_number || message.incident_number;
        const isMyMessage = String(message.created_by) === String(user?.id);
        if (isMyMessage && message.title && message.created_at) {
          const broadcastKey = `broadcast_${message.title}_${message.description}_${message.created_by}_${message.created_at}`;
          if (!broadcastKeyMap.has(broadcastKey)) {
            broadcastKeyMap.set(broadcastKey, key);
          }
        }
      });
      // Créer un reverse map: thread_ticket_number -> grouped key
      const broadcastGroupMap = new Map<string, string>();
      broadcastKeyMap.forEach((firstKey, broadcastKey) => {
        messages.forEach((message: any) => {
          const key = message.thread_ticket_number || message.incident_number;
          const checkKey = `broadcast_${message.title}_${message.description}_${message.created_by}_${message.created_at}`;
          if (checkKey === broadcastKey && key !== firstKey) {
            broadcastGroupMap.set(key, firstKey);
          }
        });
      });

      // Organiser les messages en conversations
      const conversationsMap = new Map<string, Conversation>();
      const broadcastSkipped = new Set<string>(); // Tickets broadcast dupliqués à ignorer

      messages.forEach((message: any) => {
        // Grouper par thread_ticket_number (lie les réponses au ticket parent)
        // Si thread_ticket_number est absent, utiliser incident_number (message racine)
        let conversationKey = message.thread_ticket_number || message.incident_number;

        // Si c'est un doublon de broadcast, regrouper sous le premier ticket
        if (broadcastGroupMap.has(conversationKey)) {
          // Ne pas afficher les doublons broadcast, garder seulement le premier
          return;
        }
        
        // Nettoyer le titre pour éviter les "Réponse: " multiples
        let originalTitle = message.title || 'Sans titre';
        originalTitle = originalTitle.replace(/^(Réponse:\s*)+/gi, '').trim();
        
        // Utiliser la fonction utilitaire pour extraire le nom
        const senderName = extractUserName(message);
        
        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, {
            id: conversationKey,
            title: conversationKey, // Titre = numéro du ticket thread
            subtitle: originalTitle, // Sous-titre = titre original nettoyé
            lastMessage: message,
            unreadCount: 0,
            participants: [senderName],
            messages: [],
            updatedAt: message.updated_at || new Date().toISOString(),
            // Informations du ticket
            incident_number: conversationKey,
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

      // Sélectionner la première conversation par défaut si aucune n'est sélectionnée
      if (conversationsArray.length > 0 && !selectedConversation) {
        handleSelectConversation(conversationsArray[0]);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Assigner la ref pour que le callback SSE puisse appeler loadMessages
  loadMessagesRef.current = loadMessages;

  const handleSelectConversation = async (conversation: Conversation) => {
    // Charger le thread complet pour voir les messages de tous les participants
    const firstMessage = conversation.messages[0];
    const parentId = Number(firstMessage?.parent_id) || Number(firstMessage?.id);

    let fullMessages = conversation.messages;

    if (parentId && !isNaN(parentId)) {
      try {
        const threadResponse = await messagesService.getConversationThread(parentId, 0, 100);
        if (threadResponse.items && threadResponse.items.length > 0) {
          fullMessages = threadResponse.items;
        }
      } catch (error) {
        console.error('Erreur chargement thread complet:', error);
        // Fallback : garder les messages déjà chargés
      }
    }

    // Filtrer les messages supprimés (soft delete)
    fullMessages = fullMessages.filter((message: any) => {
      if (message.is_deleted) return false;
      const isSender = String(message.created_by) === String(user?.id);
      const isRecipient = String(message.recipient_id) === String(user?.id);
      if (isSender && message.deleted_by_sender) return false;
      if (isRecipient && message.deleted_by_recipient) return false;
      return true;
    });

    // Marquer tous les messages comme lus
    const updatedMessages = fullMessages.map((message: any) => {
      return {
        ...message,
        is_read: true,
        read_at: message.read_at || new Date().toISOString()
      };
    }).sort((a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const updatedConversation = {
      ...conversation,
      unreadCount: 0,
      messages: updatedMessages
    };

    // Sauvegarder l'état "lu" en localStorage
    const readMessagesKey = `readMessages_user_${user?.id}`;
    const currentReadMessages = JSON.parse(localStorage.getItem(readMessagesKey) || '[]');
    const messageIds = updatedMessages.map((m: any) => m.id);
    const updatedReadMessages = [...new Set([...currentReadMessages, ...messageIds])];
    localStorage.setItem(readMessagesKey, JSON.stringify(updatedReadMessages));

    // Mettre à jour la liste des conversations
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
      // Trouver le parent_id : ID du message racine de la conversation
      const firstMessage = selectedConversation.messages[0];
      // Utiliser parent_id du message s'il existe (pointe vers la racine), sinon l'id du premier message
      const parentId = Number(firstMessage?.parent_id) || Number(firstMessage?.id);

      if (!parentId || isNaN(parentId)) {
        console.error('Impossible de déterminer le parent_id pour la réponse');
        return;
      }

      await messagesService.replyToMessage({
        parent_id: parentId,
        title: selectedConversation.subtitle || selectedConversation.title,
        description: replyText.trim()
      });
      
      setReplyText("");

      // Recharger la liste et le thread complet de la conversation actuelle
      await loadMessages();
      if (selectedConversation) {
        await handleSelectConversation(selectedConversation);
      }
      
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
    } finally {
      setSending(false);
    }
  };

  // Vérifier si l'utilisateur est un partenaire (non-admin)
  const isPartner = (): boolean => {
    return user?.role_id !== 1 && String(user?.role_id) !== "1";
  };

  // Mapper la priorité frontend vers le format backend (P0-P4)
  const mapPriorityToBackend = (priority: string): string => {
    switch (priority) {
      case "critique": return "P0";
      case "haute": return "P1";
      case "moyenne": return "P3";
      case "faible": return "P4";
      default: return "P3";
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.title.trim() || !newMessage.description.trim()) return;

    try {
      setSendingNewMessage(true);

      // Pour les partenaires, utiliser le nouvel endpoint send-to-admins
      if (isPartner()) {
        const result = await messagesService.sendMessageToAdmins({
          title: newMessage.title.trim(),
          description: newMessage.description.trim(),
          priority: mapPriorityToBackend(newMessage.priority)
        });

        console.log(`✅ Message envoyé à ${result.count} administrateur(s)`);
      } else if (newMessage.recipient_type === "all_partners") {
        // Broadcast à tous les utilisateurs (admin seulement)
        await messagesService.broadcastMessage({
          title: newMessage.title.trim(),
          description: newMessage.description.trim(),
          recipient_ids: "all"
        });
      } else {
        // Message normal ou vers un utilisateur spécifique (admin seulement)
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
        recipient_type: "specific_partner",
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
        // Retirer le message supprimé de la conversation sélectionnée
        if (selectedConversation) {
          const updatedMessages = selectedConversation.messages.filter(m => m.id !== messageToDelete.id);

          if (updatedMessages.length === 0) {
            // Plus de messages : supprimer la conversation
            setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
            setSelectedConversation(null);
            if (isMobile) {
              setShowConversationDetail(false);
            }
          } else {
            const newLastMessage = updatedMessages[updatedMessages.length - 1];
            const updatedConversation = {
              ...selectedConversation,
              messages: updatedMessages,
              lastMessage: newLastMessage,
              updatedAt: newLastMessage.updated_at || newLastMessage.created_at
            };

            // Mettre à jour les deux états en même temps
            setSelectedConversation(updatedConversation);
            setConversations(prev =>
              prev.map(c => c.id === selectedConversation.id ? updatedConversation : c)
            );
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
                        </div>
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
                          
                          {/* Icône suppression visible au survol */}
                          {canDeleteMessage(message) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openDeleteModal(message); }}
                              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 ${isMyMessage ? 'text-white/60 hover:text-red-200' : 'text-gray-400 hover:text-red-500'}`}
                              title="Supprimer le message"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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
                  {/* Message informatif pour les partenaires */}
                  {isPartner() && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <MessageCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">
                          Votre message sera envoyé à tous les administrateurs DATALYS.
                        </p>
                      </div>
                    </div>
                  )}

                  <Input
                    label="Sujet"
                    placeholder="Entrez le sujet de votre message..."
                    value={newMessage.title}
                    maxLength={200}
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
                  {!isPartner() && (
                    <div className="space-y-4">
                      <Select
                        label="Destinataires"
                        placeholder="Sélectionner le type de destinataire"
                        selectedKeys={[newMessage.recipient_type]}
                        onSelectionChange={(keys) => {
                          const recipientType = Array.from(keys)[0] as "specific_partner" | "all_partners";
                          setNewMessage({...newMessage, recipient_type: recipientType, recipient_id: ""});
                        }}
                      >
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

                  {/* Sélection de projet - seulement pour les admins */}
                  {!isPartner() && (
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
                  )}

                  <Textarea
                    label="Message"
                    placeholder="Décrivez votre message..."
                    value={newMessage.description}
                    maxLength={5000}
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
                  {isPartner() ? "Envoyer aux Administrateurs" : "Envoyer Message"}
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