// Service API pour la gestion des partenaires
import { SecureStorage } from '@/lib/secure-storage';
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
  country_code: string;
  address: string;
  is_active: boolean;
  logo_url?: string;
}

export interface CreatePartnerFormData extends CreatePartnerData {
  logo?: File;
}

export interface UpdatePartnerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface UpdatePartnerFormData extends UpdatePartnerData {
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
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/proxy';
  private token: string | null = null;

  constructor() {
    // Récupérer le token depuis le localStorage au chargement
    if (typeof window !== 'undefined') {
      this.token = SecureStorage.getItem('authToken');
    }
  }

  // Méthode pour définir le token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      SecureStorage.setItem('authToken', token);
    }
  }

  // Méthode pour supprimer le token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      SecureStorage.removeItem('authToken');
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
      this.token = SecureStorage.getItem('authToken');
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
  async createPartner(partnerData: CreatePartnerFormData, userId?: number): Promise<PartnerApiResponse<Partner[]> & { logoUploadError?: string }> {
    try {
      console.log('🚀 Création du partenaire démarrée:', {
        baseUrl: this.baseUrl,
        hasToken: !!this.token,
        token: this.token ? `${this.token.substring(0, 20)}...` : null,
        userId: userId,
        hasLogo: !!partnerData.logo
      });

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      // Étape 1: Créer le partenaire sans logo (toujours avec JSON selon les nouvelles APIs)
      console.log('📝 Étape 1: Création du partenaire sans logo...');
      const partnerResult = await this.createPartnerWithJSON(partnerData);
      
      if (partnerResult.code !== 200) {
        throw new Error(partnerResult.message?.message || 'Erreur lors de la création du partenaire');
      }
      
      let logoUploadError: string | undefined = undefined;
      
      // Étape 2: Upload du logo si présent (optionnel)
      if (partnerData.logo && partnerData.logo instanceof File && partnerResult.items?.[0]) {
        console.log('🖼️ Étape 2: Upload du logo...');
        const partnerId = partnerResult.items[0].id;
        
        try {
          await this.uploadPartnerLogo(partnerId, partnerData.logo);
          console.log('✅ Logo uploadé avec succès');
        } catch (logoError) {
          console.warn('⚠️ Partenaire créé mais échec upload logo:', logoError);
          logoUploadError = logoError instanceof Error ? logoError.message : 'Erreur inconnue lors de l\'upload du logo';
          // Ne pas faire échouer toute l'opération si seulement le logo échoue
          // Le partenaire est déjà créé, on continue
        }
      }
      
      return {
        ...partnerResult,
        logoUploadError
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création du partenaire:', error);
      throw error;
    }
  }

  // Nouvelle méthode pour uploader le logo séparément
  async uploadPartnerLogo(partnerId: number, logo: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('logo', logo);
      
      console.log('📤 Upload logo pour partenaire ID:', partnerId);
      
      const response = await fetch(`${this.baseUrl}/partners/upload-logo/${partnerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          // Ne pas définir Content-Type pour FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur upload logo:', errorText);
        throw new Error(`Erreur upload logo: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Logo uploadé:', result);
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload du logo:', error);
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

  // Création avec JSON - format direct selon l'API
  private async createPartnerWithJSON(partnerData: CreatePartnerFormData): Promise<PartnerApiResponse<Partner[]>> {
    const requestBody = {
      name: partnerData.name,
      email: partnerData.email,
      phone: partnerData.phone,
      country_code: partnerData.country_code,
      address: partnerData.address,
      ...(partnerData.logo_url && { logo_url: partnerData.logo_url })
    };

    console.log('📤 Envoi JSON création (format direct):', requestBody);

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
      let errorMessage = `Erreur ${response.status}`;
      
      try {
        const errorText = await response.text();
        console.error('❌ Erreur API brute:', errorText);
        
        // Essayer de parser le JSON d'erreur
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = errorText;
          }
        } catch {
          errorMessage = errorText;
        }
      } catch {
        errorMessage = `Erreur HTTP ${response.status}`;
      }
      
      console.error('❌ Message d\'erreur final:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Réponse API complète:', result);
    
    // Vérifier si l'API retourne un code d'erreur dans le JSON (ex: {code: 400, message: {...}})
    if (result.code && result.code !== 200) {
      console.error('❌ Code d\'erreur API dans JSON:', result.code, result.message);
      
      let errorString = 'Erreur inconnue';
      
      // Extraire le message d'erreur de la structure imbriquée
      if (result.message && typeof result.message === 'object' && 'message' in result.message) {
        const messageText = String(result.message.message);
        // Vérifier si c'est vraiment un message d'erreur ou de succès
        if (messageText.toLowerCase().includes('succès') || messageText.toLowerCase().includes('créé')) {
          console.log('✅ Message de succès détecté:', messageText);
          // Ne pas traiter comme une erreur, continuer le traitement normal
        } else {
          errorString = messageText;
          console.error('❌ Message d\'erreur extrait:', errorString);
          throw new Error(errorString);
        }
      } else if (result.message && typeof result.message === 'string') {
        const messageText = result.message;
        if (messageText.toLowerCase().includes('succès') || messageText.toLowerCase().includes('créé')) {
          console.log('✅ Message de succès détecté:', messageText);
        } else {
          errorString = messageText;
          console.error('❌ Message d\'erreur extrait:', errorString);
          throw new Error(errorString);
        }
      } else if (result.error && typeof result.error === 'string') {
        errorString = result.error;
        console.error('❌ Message d\'erreur extrait:', errorString);
        throw new Error(errorString);
      } else if (result.message) {
        errorString = JSON.stringify(result.message);
        console.error('❌ Message d\'erreur extrait:', errorString);
        throw new Error(errorString);
      }
    }
    
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

  // Modifier un partenaire
  async updatePartner(partnerId: number, partnerData: UpdatePartnerFormData, userId?: number): Promise<PartnerApiResponse<Partner[]> & { logoUploadError?: string }> {
    try {
      console.log('🔄 Modification du partenaire démarrée:', {
        partnerId,
        hasToken: !!this.token,
        userId: userId,
        hasLogo: !!partnerData.logo
      });

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      // Note: userId n'est plus utilisé car l'API utilise maintenant le format direct
      
      // Étape 1: Modifier le partenaire sans logo
      console.log('📝 Étape 1: Modification du partenaire sans logo...');
      const partnerResult = await this.updatePartnerWithJSON(partnerId, partnerData);
      
      if (partnerResult.code !== 200) {
        throw new Error(partnerResult.message?.message || 'Erreur lors de la modification du partenaire');
      }
      
      let logoUploadError: string | undefined = undefined;
      
      // Étape 2: Upload du logo si présent (optionnel)
      if (partnerData.logo && partnerData.logo instanceof File) {
        console.log('🖼️ Étape 2: Upload du nouveau logo...');
        
        try {
          await this.uploadPartnerLogo(partnerId, partnerData.logo);
          console.log('✅ Logo modifié avec succès');
        } catch (logoError) {
          console.warn('⚠️ Partenaire modifié mais échec upload logo:', logoError);
          logoUploadError = logoError instanceof Error ? logoError.message : 'Erreur inconnue lors de l\'upload du logo';
        }
      }
      
      return {
        ...partnerResult,
        logoUploadError
      };
    } catch (error) {
      console.error('❌ Erreur lors de la modification du partenaire:', error);
      throw error;
    }
  }

  // Modification avec JSON
  private async updatePartnerWithJSON(partnerId: number, partnerData: UpdatePartnerFormData): Promise<PartnerApiResponse<Partner[]>> {
    // L'API partners/update attend un objet direct, pas le format {user, datas}
    const requestBody: any = {
      id: partnerId
    };
    
    // Ajouter les champs seulement s'ils sont fournis et non vides
    if (partnerData.name !== undefined && partnerData.name.trim() !== '') {
      requestBody.name = partnerData.name.trim();
    }
    if (partnerData.email !== undefined && partnerData.email.trim() !== '') {
      requestBody.email = partnerData.email.trim();
    }
    if (partnerData.phone !== undefined && partnerData.phone.trim() !== '') {
      requestBody.phone = partnerData.phone.trim();
    }
    if (partnerData.address !== undefined && partnerData.address.trim() !== '') {
      requestBody.address = partnerData.address.trim();
    }
    if (partnerData.is_active !== undefined) {
      requestBody.is_active = partnerData.is_active;
    }

    console.log('📤 Envoi JSON update (format direct):', requestBody);
    console.log('📋 Request body stringified:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseUrl}/partners/update`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(requestBody),
    });

    return await this.handleResponse(response);
  }

  // Supprimer un partenaire (soft delete)
  async deletePartner(partnerId: number, userId?: number): Promise<PartnerApiResponse<any>> {
    try {
      console.log('🗑️ Suppression du partenaire démarrée:', {
        partnerId,
        hasToken: !!this.token,
        userId: userId
      });

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      // L'API partners/delete attend un objet direct, comme pour update
      const requestBody = {
        id: partnerId
      };

      console.log('📤 Envoi JSON delete (format direct):', requestBody);

      const response = await fetch(`${this.baseUrl}/partners/delete`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(requestBody),
      });

      const result = await this.handleResponse(response);
      
      if (result.code !== 200) {
        throw new Error(result.message?.message || 'Erreur lors de la suppression du partenaire');
      }

      console.log('✅ Partenaire supprimé avec succès');
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du partenaire:', error);
      throw error;
    }
  }

  // Récupérer un partenaire par ID
  async getPartnerById(partnerId: number): Promise<Partner | null> {
    try {
      const result = await this.getPartners({
        index: 0,
        size: 1000, // Pour être sûr de récupérer le partenaire
      });
      
      const partner = result.items?.find(p => p.id === partnerId);
      return partner || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du partenaire par ID:', error);
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