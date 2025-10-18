"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService, User } from "@/services/auth";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { SecureStorage } from "@/lib/secure-storage";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();
  const { showNotification } = useSimpleNotifications();

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = AuthService.isAuthenticated();
      const user = AuthService.getUser();

      setAuthState({
        user,
        isAuthenticated: isAuth,
        isLoading: false,
      });
    };

    checkAuth();

    // Écouter les changements dans SecureStorage via custom events
    const handleAuthChange = () => {
      checkAuth();
    };

    // Écouter les changements d'authentification via custom events
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // Fonction de déconnexion
  const logout = async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await AuthService.logout();

      if (result.success) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        showNotification(simpleNotificationHelpers.success(
          "Déconnexion réussie",
          "À bientôt ! Vous pouvez vous reconnecter à tout moment."
        ));
        router.push("/connexion");
      } else {
        console.error("Erreur de déconnexion:", result.message);
        showNotification(simpleNotificationHelpers.warning(
          "Déconnexion partielle",
          "Vous avez été déconnecté localement."
        ));
        // Rediriger quand même vers la page de connexion
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        router.push("/connexion");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur de déconnexion",
        "Problème de connexion, mais vous avez été déconnecté localement."
      ));
      // En cas d'erreur, forcer la déconnexion locale
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.push("/connexion");
    }
  };

  // Fonction pour mettre à jour les informations utilisateur
  const updateUser = (updatedUser: Partial<User>): void => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updatedUser } : null,
    }));

    // Mettre à jour le stockage sécurisé
    if (authState.user) {
      const updatedUserData = { ...authState.user, ...updatedUser };
      SecureStorage.setItem("userInfo", JSON.stringify(updatedUserData));
    }
  };

  return {
    ...authState,
    logout,
    updateUser,
  };
};
