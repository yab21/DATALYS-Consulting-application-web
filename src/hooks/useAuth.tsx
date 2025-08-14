"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService, User } from "@/services/auth";

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

    // Écouter les changements dans localStorage (pour la synchronisation entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" || e.key === "userInfo") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
        router.push("/connexion");
      } else {
        console.error("Erreur de déconnexion:", result.message);
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

    // Mettre à jour le localStorage
    if (authState.user) {
      const updatedUserData = { ...authState.user, ...updatedUser };
      localStorage.setItem("userInfo", JSON.stringify(updatedUserData));
    }
  };

  return {
    ...authState,
    logout,
    updateUser,
  };
};
