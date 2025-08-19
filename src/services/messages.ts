import { API_CONFIG } from "@/lib/api-config";

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
  project_id?: number;
  priority?: "faible" | "moyenne" | "haute" | "critique";
  category?: "communication" | "technique" | "officiel";
  type?: "message" | "support" | "notification";
  recipient_id?: number;
}

export interface ReplyMessageRequest {
  parent_id: string;
  description: string;
}

export interface MessageFilters {
  type?: "message" | "support" | "notification";
  status?: "ouvert" | "en_cours" | "resolu" | "ferme";
  priority?: "faible" | "moyenne" | "haute" | "critique";
  is_read?: boolean;
  project_id?: number;
  sender_id?: number;
  date_from?: string;
  date_to?: string;
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
    const token = localStorage.getItem('authToken');
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
      const response = await fetch(`${this.baseUrl}/messages/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
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
      throw error;
    }
  }

  /**
   * Récupérer mes messages avec pagination et filtres
   */
  async getMyMessages(
    index: number = 0, 
    size: number = 20, 
    filters: MessageFilters = {}
  ): Promise<MessagesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/my-messages`, {
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
        throw new Error(errorData.message || 'Erreur lors de la récupération des messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      throw error;
    }
  }

  /**
   * Répondre à un message
   */
  async replyToMessage(data: ReplyMessageRequest): Promise<{ message: Message; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/reply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la réponse');
      }

      const result = await response.json();
      return {
        message: result.items[0],
        code: result.code
      };
    } catch (error) {
      console.error('Erreur réponse message:', error);
      throw error;
    }
  }

  /**
   * Récupérer un fil de conversation
   */
  async getConversationThread(
    parentId: string, 
    index: number = 0, 
    size: number = 50
  ): Promise<ConversationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/thread`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          parent_id: parentId,
          index,
          size
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération de la conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération conversation:', error);
      throw error;
    }
  }

  /**
   * Marquer un message comme lu
   */
  async markAsRead(messageId: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/mark-read`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id: messageId
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
      console.error('Erreur marquage lu:', error);
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
    }
  }

}

// Instance singleton du service
export const messagesService = new MessagesService();
export default messagesService;