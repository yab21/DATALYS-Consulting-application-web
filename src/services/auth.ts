// Service d'authentification pour DATALYS Consulting

import {
  API_CONFIG,
  buildApiUrl,
  getDefaultHeaders,
  ApiResponse,
  LoginResponse,
} from "@/lib/api-config";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
          },
          body: JSON.stringify(credentials),
        },
      );

      const result: ApiResponse<LoginResponse> = await response.json();

      if (response.ok && result.status === "success") {
        // Stocker le token et les informations utilisateur
        this.storeAuthData(result.data!);
      }

      return result;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return {
        status: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
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
          message: result.message || "Erreur lors de la déconnexion",
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

    const token = localStorage.getItem("authToken");
    const userInfo = localStorage.getItem("userInfo");

    return !!(token && userInfo);
  }

  /**
   * Obtenir le token d'authentification
   */
  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  }

  /**
   * Obtenir les informations utilisateur
   */
  static getUser(): User | null {
    if (typeof window === "undefined") return null;

    const userInfo = localStorage.getItem("userInfo");
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

    // Stocker dans localStorage pour l'accès client
    localStorage.setItem("authToken", data.token);
    localStorage.setItem(
      "userInfo",
      JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        role_id: data.role_id,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }),
    );

    // Stocker aussi dans les cookies pour l'accès côté serveur (middleware)
    document.cookie = `authToken=${data.token}; path=/; max-age=86400; SameSite=Strict`;
    document.cookie = `userInfo=${JSON.stringify({
      id: data.id,
      name: data.name,
      email: data.email,
      role_id: data.role_id,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    })}; path=/; max-age=86400; SameSite=Strict`;
  }

  /**
   * Effacer les données d'authentification
   */
  private static clearAuthData(): void {
    if (typeof window === "undefined") return;

    // Supprimer du localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("rememberMe");

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
      return {
        status: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
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
      return {
        status: "error",
        message: "Erreur de connexion. Veuillez réessayer.",
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
