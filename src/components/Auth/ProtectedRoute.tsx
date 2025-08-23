"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { showAuthLoading, hideLoading } = useGlobalLoading();

  useEffect(() => {
    // Afficher le loading global pendant la vérification
    if (isLoading) {
      showAuthLoading("Vérification de votre session DATALYS...");
    } else {
      hideLoading();
    }

    // Si l'utilisateur n'est pas connecté et que le chargement est terminé, rediriger vers la connexion
    if (!isLoading && !isAuthenticated) {
      router.push("/connexion");
    }
  }, [isAuthenticated, isLoading, router, showAuthLoading, hideLoading]);

  // Le GlobalLoader s'occupe de l'affichage
  if (isLoading) {
    return fallback || null;
  }

  // Si l'utilisateur n'est pas connecté, ne rien afficher (la redirection est en cours)
  if (!isAuthenticated) {
    return null;
  }

  // Afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
