// Service d'authentification pour DATALYS Consulting

import {
  API_CONFIG,
  buildApiUrl,
  getDefaultHeaders,
  ApiResponse,
  LoginResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
} from "@/lib/api-config";
import { SecureStorage } from "@/lib/secure-storage";
import { extractBackendMessage } from "@/lib/error-handler";

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  role_id: number;
  partner_id?: number; // ID du partenaire associé (pour les clients/partenaires)
  is_active: boolean;
  is_deleted?: boolean;
  is_temp_password?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  client_code?: string | null;
  fcm_token?: string;
  // Note: password_hash volontairement exclu pour la sécurité
}

export class AuthService {
  /**
   * Connexion utilisateur
   */
  static async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(credentials),
        },
      );

      const result = await response.json();

      // Adapter la réponse de l'API réelle au format attendu
      if (result.status === "success") {
        // Si MFA requis, ne pas stocker les données d'authentification
        if (result.data?.requires_mfa) {
          return {
            status: "success",
            message: result.message,
            data: result.data,
          };
        }
        
        // Connexion normale : stocker le token et les informations utilisateur
        if (result.data && result.data.token) {
          this.storeAuthData(result.data);
        }
        
        return {
          status: "success",
          message: result.message,
          data: result.data,
        };
      } else {
        return {
          status: "error",
          message: result.message || "Erreur de connexion",
        };
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      const message = extractBackendMessage(error);
      return {
        status: "error",
        message,
      };
    }
  }

  /**
   * Vérification du code MFA
   */
  static async verifyMFA(
    request: MFAVerificationRequest
  ): Promise<MFAVerificationResponse> {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY_MFA),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(request),
        }
      );

      const result = await response.json();

      if (result.status === "success" && result.data) {
        // Vérification MFA réussie : stocker les données d'authentification
        this.storeAuthData(result.data);
        
        return {
          status: "success",
          message: result.message,
          data: result.data,
        };
      } else {
        return {
          status: "error",
          message: result.message || "Code MFA incorrect",
          remaining_attempts: result.remaining_attempts,
        };
      }
    } catch (error) {
      console.error("Erreur lors de la vérification MFA:", error);
      const message = extractBackendMessage(error);
      return {
        status: "error",
        message,
      };
    }
  }

  /**
   * Changement de mot de passe temporaire
   */
  static async changeTempPassword(data: {
    email: string;
    current_password: string;
    new_password: string;
  }): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.CHANGE_TEMP_PASSWORD),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        // Si MFA requis, ne pas stocker les données d'authentification
        if (result.data?.requires_mfa) {
          return {
            status: "success",
            message: result.message,
            data: result.data,
          };
        }
        
        // Changement réussi sans MFA : stocker le token et les informations utilisateur
        if (result.data && result.data.token) {
          this.storeAuthData(result.data);
        }
        
        return {
          status: "success",
          message: result.message,
          data: result.data,
        };
      } else {
        return {
          status: "error",
          message: result.message || "Erreur lors du changement de mot de passe",
        };
      }
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      const message = extractBackendMessage(error);
      return {
        status: "error",
        message,
      };
    }
  }

  /**
   * Déconnexion utilisateur
   */
  static async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT),
        {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify({}),
        },
      );

      const result: ApiResponse = await response.json();

      if (response.ok && result.status === "success") {
        // Nettoyer le stockage local
        this.clearAuthData();
        return { success: true };
      } else {
        // Nettoyer quand même le stockage local en cas d'erreur API
        this.clearAuthData();
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Nettoyer le stockage local même en cas d'erreur réseau
      this.clearAuthData();
      return {
        success: false,
        message: "Erreur de connexion lors de la déconnexion",
      };
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    const token = SecureStorage.getItem("authToken");
    const userInfo = SecureStorage.getItem("userInfo");

    return !!(token && userInfo);
  }

  /**
   * Obtenir le token d'authentification
   */
  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return SecureStorage.getItem("authToken");
  }

  /**
   * Obtenir les informations utilisateur
   */
  static getUser(): User | null {
    if (typeof window === "undefined") return null;

    const userInfo = SecureStorage.getItem("userInfo");
    if (!userInfo) return null;

    try {
      return JSON.parse(userInfo) as User;
    } catch {
      return null;
    }
  }

  /**
   * Stocker les données d'authentification
   */
  private static storeAuthData(data: LoginResponse): void {
    if (typeof window === "undefined") return;

    // Filtrer les données sensibles avant le stockage (TypeScript ignore cette propriété car elle n'est pas dans l'interface)
    const safeUserData = data;

    // Créer un objet utilisateur sécurisé
    const userInfo = {
      id: safeUserData.id,
      name: safeUserData.name,
      email: safeUserData.email,
      username: safeUserData.username,
      role_id: safeUserData.role_id,
      partner_id: safeUserData.partner_id,
      is_active: safeUserData.is_active,
      is_deleted: safeUserData.is_deleted,
      is_temp_password: safeUserData.is_temp_password,
      created_at: safeUserData.created_at,
      updated_at: safeUserData.updated_at,
      created_by: safeUserData.created_by,
      updated_by: safeUserData.updated_by,
      client_code: safeUserData.client_code,
      fcm_token: safeUserData.fcm_token,
    };

    // Utiliser SecureStorage pour une gestion unifiée des tokens
    SecureStorage.setItem("authToken", data.token || "");
    SecureStorage.setItem("userInfo", JSON.stringify(userInfo));

    // Stocker aussi dans les cookies sécurisés pour l'accès côté serveur (middleware)
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    
    document.cookie = `authToken=${data.token || ""}; path=/; max-age=86400; SameSite=Strict${secureFlag}`;
    document.cookie = `userInfo=${JSON.stringify(userInfo)}; path=/; max-age=86400; SameSite=Strict${secureFlag}`;
  }

  /**
   * Effacer les données d'authentification
   */
  static clearAuthData(): void {
    if (typeof window === "undefined") return;

    // Supprimer du SecureStorage et localStorage (pour compatibilité)
    SecureStorage.removeItem("authToken");
    SecureStorage.removeItem("userInfo");
    // Nettoyer aussi localStorage au cas où
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    
    // Nettoyer aussi SecureStorage au cas où
    SecureStorage.removeItem("authToken");
    SecureStorage.removeItem("userInfo");
    SecureStorage.removeItem("rememberMe");

    // Supprimer aussi les cookies
    document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `userInfo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Demander la réinitialisation de mot de passe
   */
  static async resetPasswordRequest(
    email: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(
        buildApiUrl("/auth/reset-password-request"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      const message = extractBackendMessage(error);
      return {
        status: "error",
        message,
      };
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(
        buildApiUrl("/auth/reset-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, new_password: newPassword }),
        },
      );

      const result: ApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      const message = extractBackendMessage(error);
      return {
        status: "error",
        message,
      };
    }
  }

  /**
   * Rafraîchir le token (si implémenté côté API)
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH),
        {
          method: "POST",
          headers: getDefaultHeaders(),
        },
      );

      if (response.ok) {
        const result: ApiResponse<LoginResponse> = await response.json();
        if (result.status === "success" && result.data) {
          this.storeAuthData(result.data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      return false;
    }
  }
}
