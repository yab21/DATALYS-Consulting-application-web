import { API_CONFIG } from "@/lib/api-config";
import { SecureStorage } from "@/lib/secure-storage";
import { extractBackendMessage } from '@/lib/error-handler';

// Types pour le système de messages
export interface Message {
  id: string;
  title: string;
  description: string;
  type: "message" | "support" | "notification";
  priority: "faible" | "moyenne" | "haute" | "critique";
  status: "ouvert" | "en_cours" | "resolu" | "ferme";
  category: "communication" | "technique" | "officiel";
  project_id?: string;
  project_name?: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id?: string;
  recipient_name?: string;
  parent_id?: string; // Pour les réponses
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
  assigned_to?: string;
  resolution_notes?: string;
  attachments?: MessageAttachment[];
  // Nouvelles propriétés pour l'intégration incidents
  incident_id?: string; // Lien vers un incident
  expert_id?: string;   // Expert assigné pour le support
  user?: {              // Objet utilisateur selon la nouvelle API
    id: number;
    name: string;
    email: string;
    role?: string;
  };
}

export interface MessageAttachment {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
}

export interface Conversation {
  id: string;
  title: string;
  participants: Participant[];
  last_message: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface CreateMessageRequest {
  title: string;
  description: string;
  recipient_id?: number;
  parent_id?: number;
  project_id?: number;
  priority?: "faible" | "moyenne" | "haute" | "critique";
  category?: "communication" | "technique" | "officiel";
  type?: "message" | "support" | "notification";
  // Nouvelles propriétés pour l'intégration incidents
  incident_id?: string;
  expert_id?: string;
}

export interface CreateNotificationRequest {
  title: string;
  description: string;
  assigned_to?: number;
  priority?: "faible" | "moyenne" | "haute" | "critique";
}


export interface MessageFilters {
  type?: "message" | "support" | "notification";
  category?: "communication" | "technique" | "officiel";
  status?: "ouvert" | "en_cours" | "resolu" | "ferme";
  priority?: "faible" | "moyenne" | "haute" | "critique";
  is_read?: boolean;
  project_id?: number;
  sender_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface GetMyMessagesRequest {
  user: {
    id: number;
  };
  index: number;
  size: number;
  filters?: MessageFilters;
}

export interface GetConversationThreadRequest {
  user: {
    id: number;
  };
  incident_id?: number;
  parent_id?: number;
}

export interface MessagesResponse {
  items: Message[];
  count: number;
  message: string;
  code: number;
}

export interface ConversationResponse {
  items: Message[];
  count: number;
  message: string;
  code: number;
}

class MessagesService {
  private baseUrl = API_CONFIG.BASE_URL;
  
  // Récupérer le token d'authentification
  private getAuthHeaders() {
    const token = SecureStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Envoyer un nouveau message
   */
  async sendMessage(data: CreateMessageRequest): Promise<{ message: Message; code: number }> {
    try {
      // Construire le body selon le format API requis
      const requestBody: any = {
        title: data.title,
        description: data.description
      };

      // Ajouter recipient_id si fourni
      if (data.recipient_id) {
        requestBody.recipient_id = data.recipient_id;
      }

      // Ajouter parent_id si fourni (pour les réponses)
      if (data.parent_id) {
        requestBody.parent_id = data.parent_id;
      }

      const response = await fetch(`${this.baseUrl}/messages/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du message');
      }

      const result = await response.json();
      return {
        message: result.items[0],
        code: result.code
      };
    } catch (error) {
      console.error('Erreur envoi message:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Envoyer une notification (pour admin → partenaires)
   */
  async sendNotification(data: CreateNotificationRequest): Promise<{ message: Message; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi de la notification');
      }

      const result = await response.json();
      return {
        message: result.items[0],
        code: result.code
      };
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(index: number = 0, size: number = 20): Promise<MessagesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/unread`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          index,
          size
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData: any;
        
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          const textResponse = await response.text();
          errorData = { message: `Erreur ${response.status}: Service temporairement indisponible` };
        }
        
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/mark-read`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id: notificationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du marquage');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer mes messages avec pagination
   */
  async getMyMessages(
    userId: number,
    index: number = 0, 
    size: number = 20
  ): Promise<MessagesResponse> {
    try {
      const requestBody: GetMyMessagesRequest = {
        user: {
          id: userId
        },
        index,
        size,
        // Inclure tous les types de messages : messages et notifications
        filters: {
          type: undefined, // Pas de filtre sur le type pour récupérer tout
          category: undefined // Pas de filtre sur la catégorie
        }
      };

      const response = await fetch(`${this.baseUrl}/messages/my-messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }


  /**
   * Récupérer un fil de conversation
   */
  async getConversationThread(
    userId: number,
    parentId?: number,
    incidentId?: number
  ): Promise<ConversationResponse> {
    try {
      const requestBody: GetConversationThreadRequest = {
        user: {
          id: userId
        }
      };

      // Ajouter incident_id si fourni
      if (incidentId) {
        requestBody.incident_id = incidentId;
      }

      // Ajouter parent_id si fourni
      if (parentId) {
        requestBody.parent_id = parentId;
      }

      const response = await fetch(`${this.baseUrl}/conversations/thread`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération de la conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération conversation:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }


  /**
   * Créer une demande de support
   */
  async createSupportRequest(data: CreateMessageRequest): Promise<{ message: Message; code: number }> {
    try {
      // Format exact selon l'API spécifiée
      const supportData = {
        title: data.title,
        description: data.description,
        priority: data.priority || 'moyenne',
        project_id: data.project_id
      };

      const response = await fetch(`${this.baseUrl}/support/request`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(supportData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du ticket');
      }

      const result = await response.json();
      return {
        message: result.items?.[0] || result,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur création support:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les demandes de support (Admin)
   */
  async getSupportRequests(
    index: number = 0,
    size: number = 20,
    filters: MessageFilters = {}
  ): Promise<MessagesResponse> {
    try {
      // Format exact selon l'API spécifiée
      const requestData = {
        index,
        size,
        data: {
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          project_id: filters.project_id || undefined
        }
      };

      const response = await fetch(`${this.baseUrl}/support/requests`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération support:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer mes demandes de support (pour les partenaires)
   */
  async getMySupportRequests(
    index: number = 0,
    size: number = 20,
    filters: MessageFilters = {}
  ): Promise<MessagesResponse> {
    try {
      // Les partenaires utilisent aussi l'endpoint support/requests mais avec leurs propres données
      const requestData = {
        index,
        size,
        data: {
          ...filters,
          type: 'support'
        }
      };

      const response = await fetch(`${this.baseUrl}/support/requests`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération de vos tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération mes tickets support:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Recherche unifiée dans toutes les communications
   */
  async searchCommunications(
    index: number = 0,
    size: number = 20,
    filters: MessageFilters = {}
  ): Promise<MessagesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/incidents/getByCriteria`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          index,
          size,
          data: filters
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la recherche');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur recherche communications:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Mettre à jour le statut d'un message/ticket
   */
  async updateMessageStatus(
    messageId: string, 
    status: "ouvert" | "en_cours" | "resolu" | "ferme",
    resolutionNotes?: string
  ): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/update-status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id: messageId,
          status,
          resolution_notes: resolutionNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // ========================
  // NOUVELLES MÉTHODES POUR COMMUNICATION EXPERT-CLIENT
  // ========================

  /**
   * Envoyer un message lié à un incident (communication expert-client)
   */
  async sendIncidentMessage(data: {
    incident_id: string;
    description: string;
    title?: string;
    priority?: "faible" | "moyenne" | "haute" | "critique";
  }): Promise<{ message: Message; code: number }> {
    try {
      const messageData = {
        title: data.title || `Message incident #${data.incident_id}`,
        description: data.description,
        incident_id: data.incident_id,
        priority: data.priority || 'moyenne',
        type: 'support' as const
      };

      const response = await fetch(`${this.baseUrl}/messages/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du message incident');
      }

      const result = await response.json();
      return {
        message: result.items[0],
        code: result.code
      };
    } catch (error) {
      console.error('Erreur envoi message incident:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les messages liés à un incident spécifique
   */
  async getIncidentMessages(
    incidentId: string,
    index: number = 0,
    size: number = 50
  ): Promise<MessagesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/my-messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          index,
          size,
          data: {
            incident_id: incidentId,
            type: 'support'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des messages de l\'incident');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération messages incident:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer toutes les conversations avec des experts assignés
   */
  async getExpertConversations(
    index: number = 0,
    size: number = 20
  ): Promise<MessagesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/my-messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          index,
          size,
          data: {
            type: 'support',
            // Filtrer les messages qui ont un expert assigné
            has_expert: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des conversations expert');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération conversations expert:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Répondre dans le contexte d'un incident
   */
  async replyToIncidentMessage(data: {
    parent_id: number;
    incident_id: number;
    description: string;
    title?: string;
  }): Promise<{ message: Message; code: number }> {
    try {
      // Utiliser sendMessage avec parent_id pour les réponses
      const messageData: CreateMessageRequest = {
        title: data.title || `Réponse incident #${data.incident_id}`,
        description: data.description,
        parent_id: data.parent_id,
        incident_id: data.incident_id.toString()
      };

      return await this.sendMessage(messageData);
    } catch (error) {
      console.error('Erreur réponse incident:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId: number): Promise<{ success: boolean; code: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/delete`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id: messageId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du message');
      }

      const result = await response.json();
      return {
        success: result.code === 200,
        code: result.code,
        message: result.message?.message || result.message || 'Message supprimé avec succès'
      };
    } catch (error) {
      console.error('Erreur suppression message:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

}

// Instance singleton du service
export const messagesService = new MessagesService();
export default messagesService;