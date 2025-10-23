// Système de permissions pour DATALYS Consulting

export enum UserRole {
  ADMIN = 1,        // Datalys Consulting - Contrôle total
  PARTNER = 5       // Client externe - Lecture seule sur ses données
}

export enum Permission {
  // 👑 ADMIN PERMISSIONS - Contrôle total
  // Gestion des Utilisateurs
  CREATE_USERS = 'create_users',
  CREATE_PARTNERS_ACCOUNTS = 'create_partners_accounts',
  MODIFY_ALL_PROFILES = 'modify_all_profiles',
  DELETE_USERS = 'delete_users',
  SEARCH_ALL_USERS = 'search_all_users',
  MANAGE_ROLES_PERMISSIONS = 'manage_roles_permissions',
  
  // Gestion des Partenaires
  CREATE_PARTNERS = 'create_partners',
  UPLOAD_PARTNER_LOGOS = 'upload_partner_logos',
  MODIFY_PARTNER_INFO = 'modify_partner_info',
  DELETE_PARTNERS = 'delete_partners',
  TRACK_ALL_PARTNERS_ACTIVITY = 'track_all_partners_activity',
  ACTIVATE_DEACTIVATE_PARTNERS = 'activate_deactivate_partners',
  
  // Gestion des Projets
  CREATE_PROJECTS_ALL_PARTNERS = 'create_projects_all_partners',
  MODIFY_ALL_PROJECTS = 'modify_all_projects',
  ASSIGN_PROJECTS_TO_PARTNERS = 'assign_projects_to_partners',
  DELETE_PROJECTS = 'delete_projects',
  ACCESS_ALL_PROJECTS = 'access_all_projects',
  SUPERVISE_GLOBAL_PROGRESS = 'supervise_global_progress',
  
  // Gestion Complète des Documents
  CREATE_FOLDER_STRUCTURES_ALL = 'create_folder_structures_all',
  UPLOAD_DOCUMENTS_ALL_PROJECTS = 'upload_documents_all_projects',
  ACCESS_ALL_FILES = 'access_all_files',
  DELETE_ANY_DOCUMENT = 'delete_any_document',
  SHARE_LINKS_TO_PARTNERS = 'share_links_to_partners',
  
  // Gestion des Incidents
  VIEW_ALL_INCIDENTS = 'view_all_incidents',
  HANDLE_ALL_INCIDENTS = 'handle_all_incidents',
  ANALYZE_RECURRING_ISSUES = 'analyze_recurring_issues',
  COMMUNICATE_SOLUTIONS = 'communicate_solutions',
  
  // Analytics & Reporting
  GLOBAL_DASHBOARD = 'global_dashboard',
  PARTNER_ACTIVITY_REPORTS = 'partner_activity_reports',
  PROJECT_PERFORMANCE_TRACKING = 'project_performance_tracking',
  COMPLETE_ACTION_HISTORY = 'complete_action_history',
  
  // 🤝 PARTNER PERMISSIONS - Lecture seule limitée
  // Dashboard Partenaire
  VIEW_OWN_PROJECTS = 'view_own_projects',
  TRACK_OWN_PROJECT_PROGRESS = 'track_own_project_progress',
  RECEIVE_OWN_NOTIFICATIONS = 'receive_own_notifications',
  VIEW_OWN_ACTIVITY_STATS = 'view_own_activity_stats',
  
  // Projets Uniquement
  CONSULT_ASSIGNED_PROJECTS = 'consult_assigned_projects',
  VIEW_OWN_PROJECT_DETAILS = 'view_own_project_details',
  TRACK_OWN_STATUS_PROGRESS = 'track_own_status_progress',
  COMMENT_ON_OWN_PROJECTS = 'comment_on_own_projects',
  
  // Dossiers & Documents
  ACCESS_OWN_PROJECT_FOLDERS = 'access_own_project_folders',
  CONSULT_OWN_DOCUMENTS = 'consult_own_documents',
  DOWNLOAD_OWN_AUTHORIZED_FILES = 'download_own_authorized_files',
  VIEW_OWN_DOCUMENT_HISTORY = 'view_own_document_history',
  
  // Recherche Restreinte
  SEARCH_OWN_PROJECTS_ONLY = 'search_own_projects_only',
  FIND_OWN_DOCUMENTS = 'find_own_documents',
  FILTER_OWN_DATA = 'filter_own_data',
  
  // Consultation de Profil
  VIEW_OWN_PERSONAL_INFO = 'view_own_personal_info',
  VIEW_OWN_COMPANY_LOGO = 'view_own_company_logo',
  VIEW_OWN_CONTACTS = 'view_own_contacts',
  
  // Communication avec Datalys
  REPORT_INCIDENTS_OWN_PROJECTS = 'report_incidents_own_projects',
  SEND_MESSAGES_TO_ADMINS = 'send_messages_to_admins',
  RECEIVE_OFFICIAL_COMMUNICATIONS = 'receive_official_communications',
  REQUEST_TECHNICAL_SUPPORT = 'request_technical_support',
}

// Matrice des permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Toutes les permissions admin
    Permission.CREATE_USERS,
    Permission.CREATE_PARTNERS_ACCOUNTS,
    Permission.MODIFY_ALL_PROFILES,
    Permission.DELETE_USERS,
    Permission.SEARCH_ALL_USERS,
    Permission.MANAGE_ROLES_PERMISSIONS,
    Permission.CREATE_PARTNERS,
    Permission.UPLOAD_PARTNER_LOGOS,
    Permission.MODIFY_PARTNER_INFO,
    Permission.DELETE_PARTNERS,
    Permission.TRACK_ALL_PARTNERS_ACTIVITY,
    Permission.ACTIVATE_DEACTIVATE_PARTNERS,
    Permission.CREATE_PROJECTS_ALL_PARTNERS,
    Permission.MODIFY_ALL_PROJECTS,
    Permission.ASSIGN_PROJECTS_TO_PARTNERS,
    Permission.DELETE_PROJECTS,
    Permission.ACCESS_ALL_PROJECTS,
    Permission.SUPERVISE_GLOBAL_PROGRESS,
    Permission.CREATE_FOLDER_STRUCTURES_ALL,
    Permission.UPLOAD_DOCUMENTS_ALL_PROJECTS,
    Permission.ACCESS_ALL_FILES,
    Permission.DELETE_ANY_DOCUMENT,
    Permission.SHARE_LINKS_TO_PARTNERS,
    Permission.VIEW_ALL_INCIDENTS,
    Permission.HANDLE_ALL_INCIDENTS,
    Permission.ANALYZE_RECURRING_ISSUES,
    Permission.COMMUNICATE_SOLUTIONS,
    Permission.GLOBAL_DASHBOARD,
    Permission.PARTNER_ACTIVITY_REPORTS,
    Permission.PROJECT_PERFORMANCE_TRACKING,
    Permission.COMPLETE_ACTION_HISTORY,
    // Plus les permissions de consultation (comme les partenaires)
    Permission.VIEW_OWN_PROJECTS,
    Permission.TRACK_OWN_PROJECT_PROGRESS,
    Permission.COMMENT_ON_OWN_PROJECTS,
    Permission.REPORT_INCIDENTS_OWN_PROJECTS,
    Permission.SEND_MESSAGES_TO_ADMINS,
  ],
  
  [UserRole.PARTNER]: [
    // Permissions limitées aux données propres
    Permission.VIEW_OWN_PROJECTS,
    Permission.TRACK_OWN_PROJECT_PROGRESS,
    Permission.RECEIVE_OWN_NOTIFICATIONS,
    Permission.VIEW_OWN_ACTIVITY_STATS,
    Permission.CONSULT_ASSIGNED_PROJECTS,
    Permission.VIEW_OWN_PROJECT_DETAILS,
    Permission.TRACK_OWN_STATUS_PROGRESS,
    Permission.COMMENT_ON_OWN_PROJECTS,
    Permission.ACCESS_OWN_PROJECT_FOLDERS,
    Permission.CONSULT_OWN_DOCUMENTS,
    Permission.DOWNLOAD_OWN_AUTHORIZED_FILES,
    Permission.VIEW_OWN_DOCUMENT_HISTORY,
    Permission.SEARCH_OWN_PROJECTS_ONLY,
    Permission.FIND_OWN_DOCUMENTS,
    Permission.FILTER_OWN_DATA,
    Permission.VIEW_OWN_PERSONAL_INFO,
    Permission.VIEW_OWN_COMPANY_LOGO,
    Permission.VIEW_OWN_CONTACTS,
    Permission.REPORT_INCIDENTS_OWN_PROJECTS,
    Permission.SEND_MESSAGES_TO_ADMINS,
    Permission.RECEIVE_OFFICIAL_COMMUNICATIONS,
    Permission.REQUEST_TECHNICAL_SUPPORT,
    // Ajout de la permission pour voir les incidents
    Permission.VIEW_ALL_INCIDENTS,
  ],
};

// Interface utilisateur étendue avec partner_id
export interface UserWithPermissions {
  id: number;
  name: string;
  email: string;
  role_id: UserRole;
  partner_id?: number; // ID du partenaire associé (pour les clients)
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

// Helper pour vérifier les permissions
export class PermissionManager {
  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  static hasPermission(user: UserWithPermissions, permission: Permission): boolean {
    if (!user || !user.role_id) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role_id];
    if (!rolePermissions) {
      console.warn(`Role ID ${user.role_id} not found in ROLE_PERMISSIONS`);
      return false;
    }
    
    return rolePermissions.includes(permission);
  }

  /**
   * Vérifie si un utilisateur est administrateur
   */
  static isAdmin(user: UserWithPermissions): boolean {
    return user.role_id === UserRole.ADMIN;
  }

  /**
   * Vérifie si un utilisateur est partenaire
   */
  static isPartner(user: UserWithPermissions): boolean {
    return user.role_id === UserRole.PARTNER; // role_id === 5
  }

  /**
   * Vérifie si un partenaire peut accéder à un projet spécifique
   */
  static canAccessProject(user: UserWithPermissions, projectPartnerId: number): boolean {
    if (this.isAdmin(user)) return true;
    if (this.isPartner(user) && user.partner_id === projectPartnerId) return true;
    return false;
  }

  /**
   * Vérifie si un utilisateur peut modifier des données
   */
  static canModify(user: UserWithPermissions): boolean {
    return this.isAdmin(user);
  }

  /**
   * Vérifie si un utilisateur peut supprimer des données
   */
  static canDelete(user: UserWithPermissions): boolean {
    return this.isAdmin(user);
  }

  /**
   * Vérifie si un utilisateur peut créer des éléments
   */
  static canCreate(user: UserWithPermissions): boolean {
    return this.isAdmin(user);
  }

  /**
   * Obtient toutes les permissions d'un utilisateur
   */
  static getUserPermissions(user: UserWithPermissions): Permission[] {
    if (!user || !user.role_id) return [];
    return ROLE_PERMISSIONS[user.role_id] || [];
  }

  /**
   * Vérifie les permissions multiples (OU logique)
   */
  static hasAnyPermission(user: UserWithPermissions, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Vérifie les permissions multiples (ET logique)
   */
  static hasAllPermissions(user: UserWithPermissions, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Filtre les projets selon les permissions de l'utilisateur
   */
  static filterProjectsByPermissions(user: UserWithPermissions, projects: any[]): any[] {
    if (this.isAdmin(user)) return projects;
    if (this.isPartner(user)) {
      return projects.filter(project => project.partner_id === user.partner_id);
    }
    return [];
  }
}

// Types pour les actions CRUD avec permissions
export interface CRUDPermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Obtient les permissions CRUD pour un type d'entité
 */
export function getCRUDPermissions(
  user: UserWithPermissions, 
  entityType: 'projects' | 'partners' | 'users' | 'documents'
): CRUDPermissions {
  const isAdmin = PermissionManager.isAdmin(user);
  
  switch (entityType) {
    case 'projects':
      return {
        canRead: isAdmin || PermissionManager.hasPermission(user, Permission.VIEW_OWN_PROJECTS),
        canCreate: isAdmin && PermissionManager.hasPermission(user, Permission.CREATE_PROJECTS_ALL_PARTNERS),
        canUpdate: isAdmin && PermissionManager.hasPermission(user, Permission.MODIFY_ALL_PROJECTS),
        canDelete: isAdmin && PermissionManager.hasPermission(user, Permission.DELETE_PROJECTS),
      };
    
    case 'partners':
      return {
        canRead: isAdmin,
        canCreate: isAdmin && PermissionManager.hasPermission(user, Permission.CREATE_PARTNERS),
        canUpdate: isAdmin && PermissionManager.hasPermission(user, Permission.MODIFY_PARTNER_INFO),
        canDelete: isAdmin && PermissionManager.hasPermission(user, Permission.DELETE_PARTNERS),
      };
    
    case 'users':
      return {
        canRead: isAdmin,
        canCreate: isAdmin && PermissionManager.hasPermission(user, Permission.CREATE_USERS),
        canUpdate: isAdmin && PermissionManager.hasPermission(user, Permission.MODIFY_ALL_PROFILES),
        canDelete: isAdmin && PermissionManager.hasPermission(user, Permission.DELETE_USERS),
      };
    
    case 'documents':
      return {
        canRead: isAdmin || PermissionManager.hasPermission(user, Permission.CONSULT_OWN_DOCUMENTS),
        canCreate: isAdmin && PermissionManager.hasPermission(user, Permission.UPLOAD_DOCUMENTS_ALL_PROJECTS),
        canUpdate: isAdmin,
        canDelete: isAdmin && PermissionManager.hasPermission(user, Permission.DELETE_ANY_DOCUMENT),
      };
    
    default:
      return { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
  }
}