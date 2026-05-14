"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import { isRedirectInProgress } from "@/lib/api-interceptor";

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
  const { start, finish } = useTopBarProgress();

  useEffect(() => {
    if (isLoading) {
      start();
    } else {
      finish();
    }
  }, [isLoading, start, finish]);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté et que le chargement est terminé, rediriger vers la connexion
    if (!isLoading && !isAuthenticated) {
      // Si l'intercepteur gère déjà la redirection (token expiré), ne pas interférer
      if (isRedirectInProgress()) {
        return;
      }
      start(); // Progress pour la redirection
      // Terminer la progress bar après un délai pour permettre la redirection
      setTimeout(() => {
        finish();
        router.push("/connexion");
      }, 100);
    }
  }, [isAuthenticated, isLoading, router, start, finish]);

  // Pendant la vérification d'authentification, on n'affiche que la progress bar
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
