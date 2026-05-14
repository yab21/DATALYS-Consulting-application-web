// Service API pour la gestion des partenaires
import { SecureStorage } from '@/lib/secure-storage';
import { extractBackendMessage } from '@/lib/error-handler';
import { API_CONFIG } from '@/lib/api-config';
import { isTokenExpiredError } from '@/lib/api-interceptor';
export interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone_formatted?: string;
  country_code?: string;
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
  country_code?: string;
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
  private baseUrl = API_CONFIG.BASE_URL;
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
    
    // Toujours récupérer le token le plus récent depuis le storage
    const currentToken = typeof window !== 'undefined' ? SecureStorage.getItem('authToken') : this.token;
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
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
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la connexion:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Créer un nouveau partenaire
  async createPartner(partnerData: CreatePartnerFormData, userId?: number): Promise<PartnerApiResponse<Partner[]> & { logoUploadError?: string }> {
    try {

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      // Étape 1: Créer le partenaire sans logo (toujours avec JSON selon les nouvelles APIs)
      const partnerResult = await this.createPartnerWithJSON(partnerData);
      
      // Vérifier si c'est une erreur
      if ((partnerResult as any).error || (partnerResult.code !== 200 && partnerResult.code !== 201)) {
        const errorMessage = typeof partnerResult.message === 'string' 
          ? partnerResult.message 
          : partnerResult.message?.message || 'Erreur inconnue';
        const error = new Error(errorMessage);
        (error as any).handled = true; // Marquer comme gérée
        throw error;
      }
      
      let logoUploadError: string | undefined = undefined;
      
      
      // Récupérer le partenaire créé (peut être dans items, data ou data.data selon la structure de la réponse)
      const createdPartner = partnerResult.items?.[0] || 
                           ((partnerResult as any).data?.data as Partner | undefined) || 
                           ((partnerResult as any).data as Partner | undefined);
      
      
      // Étape 2: Upload du logo si présent (optionnel)
      if (partnerData.logo && partnerData.logo instanceof File && createdPartner) {
        const partnerId = createdPartner.id;
        
        try {
          const logoResult = await this.uploadPartnerLogo(partnerId, partnerData.logo);
          
          // Étape 3: Mettre à jour le partenaire avec la vraie URL du logo
          try {
            await this.updatePartnerLogoUrl(partnerId, logoResult.file_url);
            
            // Mettre à jour l'objet dans la réponse pour refléter la vraie URL
            if (createdPartner) {
              createdPartner.logo_url = logoResult.file_url;
            }
          } catch (updateError) {
            logoUploadError = `Logo uploadé mais URL non mise à jour: ${updateError instanceof Error ? updateError.message : 'Erreur inconnue'}`;
          }
        } catch (logoError) {
          logoUploadError = logoError instanceof Error ? logoError.message : 'Erreur inconnue lors de l\'upload du logo';
          // Ne pas faire échouer toute l'opération si seulement le logo échoue
          // Le partenaire est déjà créé, on continue
        }
      } else {
      }
      
      // S'assurer que le partenaire retourné contient bien l'URL du logo mise à jour
      const finalResult = {
        ...partnerResult,
        logoUploadError
      };
      
      // Si le partenaire était dans data, s'assurer qu'il a bien l'URL mise à jour
      if ((partnerResult as any).data && createdPartner) {
        (finalResult as any).data = createdPartner;
      }
      
      return finalResult;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la création du partenaire:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Nouvelle méthode pour uploader le logo séparément
  async uploadPartnerLogo(partnerId: number, logo: File): Promise<{ file_url: string; filename: string; file_path: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', logo);
      formData.append('partner_id', partnerId.toString());
      
      
      const response = await fetch(`${this.baseUrl}/files/upload/logo`, {
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
      console.log('✅ Logo uploadé avec succès:', result);
      
      // Retourner les données de l'API selon la nouvelle structure
      if (result.status === 'success' && result.data) {
        return {
          file_url: result.data.file_url,
          filename: result.data.filename,
          file_path: result.data.file_path
        };
      } else {
        throw new Error(result.message || 'Erreur inconnue lors de l\'upload');
      }
      
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de l\'upload du logo:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Mettre à jour l'URL du logo d'un partenaire
  async updatePartnerLogoUrl(partnerId: number, logoUrl: string): Promise<void> {
    try {
      
      const response = await fetch(`${this.baseUrl}/partners/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          id: partnerId,
          logo_url: logoUrl
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur mise à jour URL logo:', errorText);
        throw new Error(`Erreur mise à jour URL logo: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Codes de succès : 200 (OK) et 201 (Created)
      if (result.code !== 200 && result.code !== 201) {
        throw new Error(result.message?.message || 'Erreur lors de la mise à jour de l\'URL du logo');
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la mise à jour de l\'URL du logo:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Supprimer le logo d'un partenaire
  async deletePartnerLogo(partnerId: number): Promise<{ success: boolean; deleted_logo?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/partners/delete-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          partner_id: partnerId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur suppression logo:', errorText);
        throw new Error(`Erreur suppression logo: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.code === 200) {
        return {
          success: true,
          deleted_logo: result.data?.deleted_logo
        };
      } else {
        throw new Error(result.message?.message || 'Erreur lors de la suppression du logo');
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la suppression du logo:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
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


    const response = await fetch(`${this.baseUrl}/partners/create`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(requestBody),
    });

    return await this.handleResponse(response);
  }

  // Gestionnaire de réponse commun
  private async handleResponse(response: Response): Promise<PartnerApiResponse<Partner[]>> {

    // Vérifier si l'erreur a déjà été gérée par l'intercepteur
    if ((response as any).errorHandled) {
      const error = new Error('Token expiré');
      (error as any).handled = true;
      throw error;
    }

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      
      try {
        const errorText = await response.text();
        
        // Essayer de parser le JSON d'erreur pour extraire le message exact du backend
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message && typeof errorData.message === 'object' && errorData.message.message) {
            // Message structuré du backend (ex: validation téléphone)
            errorMessage = errorData.message.message;
          } else if (errorData.message && typeof errorData.message === 'string') {
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
      
      // Ne pas lancer d'erreur, retourner un objet d'erreur à la place
      return {
        code: response.status,
        message: { message: errorMessage },
        items: [],
        count: 0,
        error: true
      } as any;
    }

    const result = await response.json();
    
    // Pour les codes d'erreur 400+, extraire directement le message backend
    if (result.code >= 400) {
      const errorMessage = result.message?.message || result.message || `Erreur ${result.code}`;
      console.error('❌ Erreur backend:', errorMessage);
      // Marquer comme erreur et retourner au lieu de lancer une exception
      return {
        ...result,
        error: true
      };
    }
    
    return {
      code: result.code,
      message: result.message,
      items: result.items,
      count: result.items?.length || 0,
      // Préserver les données additionnelles de la réponse (comme data pour la création)
      ...(result.data && { data: result.data })
    };
  }

  // Récupérer la liste des partenaires avec getByCriteria
  async getPartners(params: GetPartnersParams = {}): Promise<PartnerApiResponse<Partner[]>> {
    try {

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


      const headers = this.getHeaders();

      const fullUrl = `${this.baseUrl}/partners/getByCriteria`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API getByCriteria:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Adapter la réponse au format attendu
      return {
        code: result.code,
        message: result.message,
        items: result.items,
        count: result.count
      };
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la récupération des partenaires:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
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
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la récupération de tous les partenaires:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
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
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la recherche de partenaires:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
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
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la récupération des partenaires actifs:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Modifier un partenaire
  async updatePartner(partnerId: number, partnerData: UpdatePartnerFormData, userId?: number): Promise<PartnerApiResponse<Partner[]> & { logoUploadError?: string }> {
    try {

      if (!this.token) {
        throw new Error('Token d\'authentification manquant dans le service');
      }

      // Note: userId n'est plus utilisé car l'API utilise maintenant le format direct
      
      // Étape 1: Modifier le partenaire sans logo
      const partnerResult = await this.updatePartnerWithJSON(partnerId, partnerData);
      
      // Codes de succès : 200 (OK) et 201 (Created)
      if (partnerResult.code !== 200 && partnerResult.code !== 201) {
        throw new Error(partnerResult.message?.message || 'Erreur lors de la modification du partenaire');
      }
      
      let logoUploadError: string | undefined = undefined;
      
      // Récupérer le partenaire mis à jour
      const updatedPartner = partnerResult.items?.[0] || (partnerResult as any).data;
      
      // Étape 2: Upload du logo si présent (optionnel)
      if (partnerData.logo && partnerData.logo instanceof File) {
        
        try {
          const logoResult = await this.uploadPartnerLogo(partnerId, partnerData.logo);
          
          // Étape 3: Mettre à jour le partenaire avec la vraie URL du logo
          try {
            await this.updatePartnerLogoUrl(partnerId, logoResult.file_url);
            
            // Mettre à jour l'objet dans la réponse pour refléter la vraie URL
            if (updatedPartner) {
              updatedPartner.logo_url = logoResult.file_url;
            }
          } catch (updateError) {
            logoUploadError = `Logo uploadé mais URL non mise à jour: ${updateError instanceof Error ? updateError.message : 'Erreur inconnue'}`;
          }
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
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la modification du partenaire:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
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
    if (partnerData.country_code !== undefined) {
      requestBody.country_code = partnerData.country_code;
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
      
      // Codes de succès : 200 (OK) et 201 (Created)
      if (result.code !== 200 && result.code !== 201) {
        throw new Error(result.message?.message || 'Erreur lors de la suppression du partenaire');
      }

      console.log('✅ Partenaire supprimé avec succès');
      return result;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la suppression du partenaire:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
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
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la récupération du partenaire par ID:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
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