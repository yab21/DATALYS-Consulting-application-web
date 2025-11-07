"use client";

/**
 * Système centralisé de messages d'erreur
 * Tous les messages d'erreur de l'application sont définis ici
 */

export const ERROR_MESSAGES = {
  // Messages d'authentification
  AUTH: {
    TOKEN_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
    INVALID_CREDENTIALS: "Identifiants invalides. Veuillez vérifier votre email et mot de passe.",
    UNAUTHORIZED: "Accès non autorisé. Veuillez vous connecter.",
    FORBIDDEN: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
    SESSION_EXPIRED: "Votre session a expiré. Vous allez être redirigé vers la page de connexion."
  },

  // Messages de chargement de données
  DATA_LOADING: {
    GENERIC_ERROR: "Impossible de charger les données. Veuillez réessayer.",
    NETWORK_ERROR: "Erreur de connexion. Vérifiez votre connexion internet.",
    SERVER_ERROR: "Erreur serveur. Veuillez réessayer dans quelques instants.",
    TIMEOUT: "Délai d'attente dépassé. Veuillez réessayer.",
    
    // Messages spécifiques par type de données
    PROJECTS: "Impossible de charger les projets.",
    PARTNERS: "Impossible de charger les partenaires.", 
    INCIDENTS: "Impossible de charger les incidents.",
    USERS: "Impossible de charger les utilisateurs.",
    FILES: "Impossible de charger les fichiers.",
    FOLDERS: "Impossible de charger les dossiers.",
    DASHBOARD: "Impossible de charger les données du tableau de bord.",
    ANALYTICS: "Impossible de charger les données analytics.",
    PROFILE: "Impossible de charger le profil utilisateur.",
    NOTIFICATIONS: "Impossible de charger les notifications."
  },

  // Messages de validation
  VALIDATION: {
    REQUIRED_FIELD: "Ce champ est requis.",
    INVALID_EMAIL: "Format d'email invalide.",
    INVALID_PASSWORD: "Le mot de passe doit contenir au moins 8 caractères.",
    PASSWORDS_DONT_MATCH: "Les mots de passe ne correspondent pas.",
    INVALID_FILE_TYPE: "Type de fichier non supporté.",
    FILE_TOO_LARGE: "Le fichier est trop volumineux.",
    INVALID_DATE: "Date invalide."
  },

  // Messages de sauvegarde
  SAVING: {
    SUCCESS: "Données sauvegardées avec succès.",
    ERROR: "Erreur lors de la sauvegarde. Veuillez réessayer.",
    NETWORK_ERROR: "Impossible de sauvegarder. Vérifiez votre connexion.",
    VALIDATION_ERROR: "Veuillez corriger les erreurs de validation."
  },

  // Messages de suppression
  DELETION: {
    SUCCESS: "Élément supprimé avec succès.",
    ERROR: "Erreur lors de la suppression. Veuillez réessayer.",
    CONFIRMATION: "Êtes-vous sûr de vouloir supprimer cet élément ?",
    CANNOT_DELETE: "Impossible de supprimer cet élément."
  },

  // Messages réseau
  NETWORK: {
    OFFLINE: "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.",
    SLOW_CONNECTION: "Connexion lente détectée. Veuillez patienter.",
    CONNECTION_RESTORED: "Connexion rétablie.",
    REQUEST_FAILED: "Échec de la requête. Veuillez réessayer."
  },

  // Messages génériques
  GENERIC: {
    UNEXPECTED_ERROR: "Une erreur inattendue s'est produite.",
    PLEASE_RETRY: "Veuillez réessayer.",
    CONTACT_SUPPORT: "Si le problème persiste, contactez le support.",
    OPERATION_FAILED: "L'opération a échoué.",
    ACCESS_DENIED: "Accès refusé."
  }
} as const;

/**
 * Types pour les messages d'erreur
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type AuthErrorKey = keyof typeof ERROR_MESSAGES.AUTH;
export type DataLoadingErrorKey = keyof typeof ERROR_MESSAGES.DATA_LOADING;
export type ValidationErrorKey = keyof typeof ERROR_MESSAGES.VALIDATION;
export type SavingErrorKey = keyof typeof ERROR_MESSAGES.SAVING;
export type DeletionErrorKey = keyof typeof ERROR_MESSAGES.DELETION;
export type NetworkErrorKey = keyof typeof ERROR_MESSAGES.NETWORK;
export type GenericErrorKey = keyof typeof ERROR_MESSAGES.GENERIC;

/**
 * Utilitaire pour obtenir un message d'erreur
 */
export const getErrorMessage = {
  auth: (key: AuthErrorKey) => ERROR_MESSAGES.AUTH[key],
  dataLoading: (key: DataLoadingErrorKey) => ERROR_MESSAGES.DATA_LOADING[key],
  validation: (key: ValidationErrorKey) => ERROR_MESSAGES.VALIDATION[key],
  saving: (key: SavingErrorKey) => ERROR_MESSAGES.SAVING[key],
  deletion: (key: DeletionErrorKey) => ERROR_MESSAGES.DELETION[key],
  network: (key: NetworkErrorKey) => ERROR_MESSAGES.NETWORK[key],
  generic: (key: GenericErrorKey) => ERROR_MESSAGES.GENERIC[key]
};

/**
 * Fonction pour obtenir le message d'erreur approprié selon le contexte
 */
export function getContextualErrorMessage(
  error: any,
  context?: {
    operation?: 'load' | 'save' | 'delete' | 'auth';
    dataType?: 'projects' | 'partners' | 'incidents' | 'users' | 'files' | 'folders' | 'dashboard' | 'analytics' | 'profile' | 'notifications';
    fallback?: string;
  }
): string {
  const { operation = 'load', dataType, fallback } = context || {};

  // Analyser le type d'erreur - sécuriser l'extraction du message
  const rawMessage = error?.message;
  const errorMessage = (typeof rawMessage === 'string' 
    ? rawMessage 
    : typeof rawMessage === 'object' && rawMessage?.message 
      ? rawMessage.message 
      : ''
  ).toLowerCase();
  
  const statusCode = error?.status || error?.statusCode || error?.response?.status;

  // Erreurs d'authentification
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    errorMessage.includes('token') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('session') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    if (statusCode === 401 || errorMessage.includes('token') || errorMessage.includes('session')) {
      return ERROR_MESSAGES.AUTH.TOKEN_EXPIRED;
    }
    if (statusCode === 403 || errorMessage.includes('forbidden')) {
      return ERROR_MESSAGES.AUTH.FORBIDDEN;
    }
    return ERROR_MESSAGES.AUTH.UNAUTHORIZED;
  }

  // Erreurs réseau
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    !navigator?.onLine
  ) {
    if (errorMessage.includes('timeout')) {
      return ERROR_MESSAGES.DATA_LOADING.TIMEOUT;
    }
    if (!navigator?.onLine) {
      return ERROR_MESSAGES.NETWORK.OFFLINE;
    }
    return ERROR_MESSAGES.DATA_LOADING.NETWORK_ERROR;
  }

  // Erreurs serveur
  if (statusCode >= 500) {
    return ERROR_MESSAGES.DATA_LOADING.SERVER_ERROR;
  }

  // Messages selon l'opération et le type de données
  if (operation === 'load' && dataType) {
    switch (dataType) {
      case 'projects':
        return ERROR_MESSAGES.DATA_LOADING.PROJECTS;
      case 'partners':
        return ERROR_MESSAGES.DATA_LOADING.PARTNERS;
      case 'incidents':
        return ERROR_MESSAGES.DATA_LOADING.INCIDENTS;
      case 'users':
        return ERROR_MESSAGES.DATA_LOADING.USERS;
      case 'files':
        return ERROR_MESSAGES.DATA_LOADING.FILES;
      case 'folders':
        return ERROR_MESSAGES.DATA_LOADING.FOLDERS;
      case 'dashboard':
        return ERROR_MESSAGES.DATA_LOADING.DASHBOARD;
      case 'analytics':
        return ERROR_MESSAGES.DATA_LOADING.ANALYTICS;
      case 'profile':
        return ERROR_MESSAGES.DATA_LOADING.PROFILE;
      case 'notifications':
        return ERROR_MESSAGES.DATA_LOADING.NOTIFICATIONS;
      default:
        return ERROR_MESSAGES.DATA_LOADING.GENERIC_ERROR;
    }
  }

  if (operation === 'save') {
    return ERROR_MESSAGES.SAVING.ERROR;
  }

  if (operation === 'delete') {
    return ERROR_MESSAGES.DELETION.ERROR;
  }

  // Message de fallback ou message par défaut
  return fallback || ERROR_MESSAGES.DATA_LOADING.GENERIC_ERROR;
}

/**
 * Fonction pour formater un message d'erreur avec contexte supplémentaire
 */
export function formatErrorMessage(
  baseMessage: string,
  details?: {
    showRetry?: boolean;
    showSupport?: boolean;
    customSuffix?: string;
  }
): string {
  let message = baseMessage;

  if (details?.showRetry) {
    message += ` ${ERROR_MESSAGES.GENERIC.PLEASE_RETRY}`;
  }

  if (details?.showSupport) {
    message += ` ${ERROR_MESSAGES.GENERIC.CONTACT_SUPPORT}`;
  }

  if (details?.customSuffix) {
    message += ` ${details.customSuffix}`;
  }

  return message;
}

export default ERROR_MESSAGES;