"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";

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
