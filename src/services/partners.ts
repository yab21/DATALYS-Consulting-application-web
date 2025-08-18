// Service API pour la gestion des partenaires
export interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  is_deleted: boolean;
}

export interface CreatePartnerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface CreatePartnerFormData extends CreatePartnerData {
  logo?: File;
}

export interface GetPartnersParams {
  index?: number;
  size?: number;
  data?: {
    name?: string;
    is_active?: boolean;
  };
}

export interface PartnerApiResponse<T> {
  code: number;
  message: {
    code: number;
    message: string;
  };
  items?: T;
  count?: number;
}

export interface PartnerLoginResponse {
  data: {
    id: number;
    email: string;
    name: string;
    token: string;
    is_active: boolean;
    role_id: number;
    created_at: string;
    updated_at: string;
  };
  message: string;
  status: string;
}

class PartnersService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
  private token: string | null = null;

  constructor() {
    // Récupérer le token depuis le localStorage au chargement
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  // Méthode pour définir le token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  // Méthode pour supprimer le token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  // Headers communs
  private getHeaders(isFormData = false): HeadersInit {
    const headers: HeadersInit = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Synchroniser le token avec le localStorage si nécessaire
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Connexion utilisateur
  async login(email: string, password: string): Promise<PartnerLoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PartnerLoginResponse = await response.json();
      
      if (result.status === 'success' && result.data.token) {
        this.setToken(result.data.token);
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  // Créer un nouveau partenaire
  async createPartner(partnerData: CreatePartnerFormData, userId?: number): Promise<PartnerApiResponse<Partner[]>> {
    try {
      console.log('🔧 Debug createPartner - État du service:', {
        baseUrl: this.baseUrl,
        hasToken: !!this.token,
        token: this.token ? `${this.token.substring(0, 20)}...` : null,
        userId: userId
      });

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      const userIdToUse = userId || 1;
      
      // Essayer d'abord avec FormData si un logo est présent
      if (partnerData.logo && partnerData.logo instanceof File) {
        return await this.createPartnerWithFormData(partnerData, userIdToUse);
      } else {
        // Sinon, utiliser JSON
        return await this.createPartnerWithJSON(partnerData, userIdToUse);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du partenaire:', error);
      throw error;
    }
  }

  // Création avec FormData (pour les logos)
  private async createPartnerWithFormData(partnerData: CreatePartnerFormData, userId: number): Promise<PartnerApiResponse<Partner[]>> {
    const formData = new FormData();
    
    // Ajouter les données du partenaire
    const data = {
      name: partnerData.name,
      email: partnerData.email,
      phone: partnerData.phone,
      address: partnerData.address,
      is_active: partnerData.is_active,
    };
    
    formData.append('data', JSON.stringify(data));
    formData.append('user', JSON.stringify({ id: userId }));
    
    if (partnerData.logo) {
      formData.append('logo', partnerData.logo);
    }

    console.log('📤 Envoi FormData:', {
      data: JSON.stringify(data),
      user: JSON.stringify({ id: userId }),
      logo: partnerData.logo ? partnerData.logo.name : 'aucun'
    });

    const response = await fetch(`${this.baseUrl}/partners/create`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });

    return await this.handleResponse(response);
  }

  // Création avec JSON (sans logo)
  private async createPartnerWithJSON(partnerData: CreatePartnerFormData, userId: number): Promise<PartnerApiResponse<Partner[]>> {
    const requestBody = {
      data: {
        name: partnerData.name,
        email: partnerData.email,
        phone: partnerData.phone,
        address: partnerData.address,
        is_active: partnerData.is_active,
      },
      user: { id: userId }
    };

    console.log('📤 Envoi JSON:', requestBody);

    const response = await fetch(`${this.baseUrl}/partners/create`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(requestBody),
    });

    return await this.handleResponse(response);
  }

  // Gestionnaire de réponse commun
  private async handleResponse(response: Response): Promise<PartnerApiResponse<Partner[]>> {
    console.log('📨 Statut de la réponse:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Réponse API complète:', result);
    
    return {
      code: result.code,
      message: result.message,
      items: result.items,
      count: result.items?.length || 0
    };
  }

  // Récupérer la liste des partenaires avec getByCriteria
  async getPartners(params: GetPartnersParams = {}): Promise<PartnerApiResponse<Partner[]>> {
    try {
      console.log('🔧 Debug getPartners - État du service:', {
        baseUrl: this.baseUrl,
        hasToken: !!this.token,
        token: this.token ? `${this.token.substring(0, 20)}...` : null,
      });

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      const requestBody = {
        index: params.index || 0,
        size: params.size || 10,
        data: {
          name: params.data?.name || "",
          is_active: params.data?.is_active !== undefined ? params.data.is_active : true,
        },
      };

      console.log('📤 Requête getByCriteria:', requestBody);

      const headers = this.getHeaders();
      console.log('📋 Headers de la requête getByCriteria:', Object.keys(headers));

      const fullUrl = `${this.baseUrl}/partners/getByCriteria`;
      console.log('🌐 URL complète getByCriteria:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log('📨 Statut de la réponse:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API getByCriteria:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Réponse getByCriteria complète:', result);

      // Adapter la réponse au format attendu
      return {
        code: result.code,
        message: result.message,
        items: result.items,
        count: result.count
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des partenaires:', error);
      throw error;
    }
  }

  // Récupérer tous les partenaires (sans pagination)
  async getAllPartners(): Promise<Partner[]> {
    try {
      const result = await this.getPartners({
        index: 0,
        size: 1000, // Grande taille pour récupérer tous les partenaires
      });
      
      return result.items || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les partenaires:', error);
      throw error;
    }
  }

  // Rechercher des partenaires par nom
  async searchPartners(name: string): Promise<Partner[]> {
    try {
      const result = await this.getPartners({
        data: { name },
      });
      
      return result.items || [];
    } catch (error) {
      console.error('Erreur lors de la recherche de partenaires:', error);
      throw error;
    }
  }

  // Récupérer les partenaires actifs uniquement
  async getActivePartners(): Promise<Partner[]> {
    try {
      const result = await this.getPartners({
        data: { is_active: true },
      });
      
      return result.items || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des partenaires actifs:', error);
      throw error;
    }
  }

  // Test de l'API avec données minimales
  async testCreateEndpoint(): Promise<any> {
    try {
      const testData = {
        data: {
          name: "Test API",
          email: "test@test.com", 
          phone: "+123456789",
          address: "Test Address",
          is_active: true
        },
        user: { id: 1 }
      };

      console.log('🧪 Test de l\'endpoint create avec:', testData);

      const response = await fetch(`${this.baseUrl}/partners/create`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(testData),
      });

      const result = await response.text();
      console.log('🧪 Réponse test:', { status: response.status, body: result });
      
      return { status: response.status, body: result };
    } catch (error) {
      console.error('🧪 Erreur test:', error);
      return { error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }
}

// Instance singleton du service
export const partnersService = new PartnersService();

// Les types sont déjà exportés individuellement ci-dessus