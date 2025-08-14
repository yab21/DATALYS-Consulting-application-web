"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";

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

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté et que le chargement est terminé, rediriger vers la connexion
    if (!isLoading && !isAuthenticated) {
      router.push("/connexion");
    }
  }, [isAuthenticated, isLoading, router]);

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      fallback || (
        <LoadingSpinner 
          size="xl" 
          text="Vérification de votre session DATALYS" 
          fullScreen={true}
        />
      )
    );
  }

  // Si l'utilisateur n'est pas connecté, ne rien afficher (la redirection est en cours)
  if (!isAuthenticated) {
    return null;
  }

  // Afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
