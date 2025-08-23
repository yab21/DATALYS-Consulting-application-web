"use client";

import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '@/context/GlobalLoadingContext';
import { ReactNode, MouseEvent, useCallback } from 'react';

interface LoadingLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  loadingMessage?: string;
  loadingType?: 'auth' | 'navigation' | 'data' | 'form' | 'logout' | 'general';
  delay?: number;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Composant Link avec loader global intégré
 * Remplace les Link standard pour avoir un loader automatique sur tous les changements de page
 */
const LoadingLink: React.FC<LoadingLinkProps> = ({
  href,
  children,
  className = '',
  loadingMessage,
  loadingType = 'navigation',
  delay = 200,
  onClick,
  ...linkProps
}) => {
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Permettre à l'utilisateur de personnaliser le comportement
      if (onClick) {
        onClick(e);
      }

      // Si l'événement a été empêché, ne pas continuer
      if (e.defaultPrevented) {
        return;
      }

      // Empêcher la navigation par défaut
      e.preventDefault();

      // Déterminer le message de chargement approprié
      const finalMessage = loadingMessage || getDefaultMessage(href, loadingType);

      // Afficher le loader
      showLoading(finalMessage, loadingType);

      // Naviguer après le délai spécifié
      setTimeout(() => {
        router.push(href);
        
        // Cacher le loader après un petit délai pour permettre à la nouvelle page de se charger
        setTimeout(() => {
          hideLoading();
        }, 300);
      }, delay);
    },
    [href, loadingMessage, loadingType, delay, onClick, router, showLoading, hideLoading]
  );

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...linkProps}
    >
      {children}
    </Link>
  );
};

/**
 * Génère un message de chargement approprié basé sur l'URL et le type
 */
function getDefaultMessage(href: string, type: string): string {
  // Messages spécifiques par route
  if (href.includes('/tableaudebord')) {
    if (href.includes('/profil')) return 'Chargement de votre profil...';
    if (href.includes('/projet')) return 'Chargement des projets...';
    if (href.includes('/partenaire')) return 'Chargement des partenaires...';
    if (href.includes('/messages')) return 'Chargement des messages...';
    if (href.includes('/support')) return 'Chargement du support...';
    if (href.includes('/analytics')) return 'Chargement des analytics...';
    if (href.includes('/gestion-utilisateurs')) return 'Chargement des utilisateurs...';
    if (href.includes('/incidents')) return 'Chargement des incidents...';
    if (href.includes('/lesdossiers')) return 'Chargement des dossiers...';
    return 'Accès au tableau de bord...';
  }

  if (href.includes('/connexion')) return 'Redirection vers la connexion...';
  if (href.includes('/mot-de-passe')) return 'Chargement de la page...';

  // Messages par défaut selon le type
  switch (type) {
    case 'auth': return 'Authentification...';
    case 'data': return 'Chargement des données...';
    case 'form': return 'Traitement...';
    case 'logout': return 'Déconnexion...';
    default: return 'Chargement de la page...';
  }
}

export default LoadingLink;