/**
 * Service de gestion des dossiers pour les projets
 * Basé sur les APIs documentées dans le guide d'intégration
 */

// Interfaces TypeScript
export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  project_id: number;
  path: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  size?: number;
  file_count?: number;
  is_active: boolean;
  permissions?: FolderPermission[];
}

export interface FolderPermission {
  user_id: number;
  permission_type: 'read' | 'write' | 'admin';
  granted_by: number;
  granted_at: string;
}

export interface CreateFolderRequest {
  user: { id: number };
  datas: Array<{
    name: string;
    project_name: string;  // L'API utilise project_name, pas project_id
    parent_folder_name?: string;  // L'API utilise parent_folder_name pour les sous-dossiers
    description?: string;
  }>;
}

export interface UpdateFolderRequest {
  user: { id: number };
  datas: Array<{
    id: number;
    name?: string;
    parent_id?: number | null;
    description?: string;
    is_active?: boolean;
  }>;
}

export interface FolderListRequest {
  index: number;
  size: number;
  data: {
    project_id?: number;
    parent_id?: number | null;
    is_active?: boolean;
    name?: string;
  };
}

export interface FolderResponse {
  status: string;
  message: string;
  data?: Folder[];
  items?: Folder[];
  count?: number;
}

class FoldersService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser la réponse, on garde le message HTTP
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Erreur lors de la requête');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Erreur dans makeRequest (${endpoint}):`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupérer les dossiers d'un projet avec filtrage
   */
  async getFoldersByProject(
    projectId: number, 
    parentId: number | null = null,
    userId: number,
    searchTerm?: string
  ): Promise<Folder[]> {
    const requestData: FolderListRequest = {
      index: 0,
      size: 100,
      data: {
        project_id: projectId,
        parent_id: parentId,
        is_active: true,
        ...(searchTerm && { name: searchTerm })
      }
    };

    const response = await this.makeRequest<FolderResponse>('/folders/getByCriteria', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return response.items || response.data || [];
  }

  /**
   * Récupérer l'arborescence complète d'un projet
   */
  async getFolderTree(projectId: number, userId: number): Promise<Folder[]> {
    const allFolders = await this.getFoldersByProject(projectId, null, userId);
    
    // Construire l'arborescence
    const folderMap = new Map<number, Folder & { children: Folder[] }>();
    const rootFolders: (Folder & { children: Folder[] })[] = [];

    // Initialiser tous les dossiers avec un tableau children
    allFolders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Construire la hiérarchie
    allFolders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id);
      if (!folderWithChildren) return;

      if (folder.parent_id === null) {
        rootFolders.push(folderWithChildren);
      } else {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderWithChildren);
        }
      }
    });

    return rootFolders;
  }

  /**
   * Convertir project_id en project_name (helper privé)
   */
  private async getProjectName(projectId: number): Promise<string> {
    // Utiliser l'API projects pour récupérer le nom du projet
    const response = await fetch(`${this.baseUrl}/projects/getByCriteria`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        index: 0,
        size: 1,
        data: { id: projectId }
      })
    });
    
    if (!response.ok) throw new Error('Projet non trouvé');
    
    const result = await response.json();
    if (result.code === 200 && result.items?.[0]) {
      return result.items[0].title;
    }
    throw new Error(`Projet non trouvé: ID ${projectId}`);
  }

  /**
   * Convertir parent_id en parent_folder_name (helper privé)
   */
  private async getParentFolderName(parentId: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/folders/getByCriteria`, {
      method: 'POST', 
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        index: 0,
        size: 1,
        data: { id: parentId }
      })
    });
    
    if (!response.ok) throw new Error('Dossier parent non trouvé');
    
    const result = await response.json();
    if (result.code === 200 && result.items?.[0]) {
      return result.items[0].name;
    }
    throw new Error(`Dossier parent non trouvé: ID ${parentId}`);
  }

  /**
   * Créer un nouveau dossier
   */
  async createFolder(
    name: string,
    projectId: number,
    userId: number,
    parentId: number | null = null,
    description?: string
  ): Promise<Folder> {
    // Convertir les IDs en noms comme attendu par l'API
    const projectName = await this.getProjectName(projectId);
    
    const folderData: any = {
      name,
      project_name: projectName,
      description
    };

    // Ajouter parent_folder_name seulement si parentId est fourni
    if (parentId !== null) {
      const parentFolderName = await this.getParentFolderName(parentId);
      folderData.parent_folder_name = parentFolderName;
    }

    const requestData: CreateFolderRequest = {
      user: { id: userId },
      datas: [folderData]
    };

    console.log('📁 Création dossier avec payload:', requestData);
    
    const response = await this.makeRequest<any>('/folders/create', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    
    if (!response.items || response.items.length === 0) {
      throw new Error('Aucune donnée retournée lors de la création');
    }
    return response.items[0];
  }

  /**
   * Mettre à jour un dossier
   */
  async updateFolder(
    folderId: number,
    updates: Partial<Pick<Folder, 'name' | 'parent_id'>>,
    userId: number,
    description?: string
  ): Promise<Folder> {
    const requestData: UpdateFolderRequest = {
      user: { id: userId },
      datas: [{
        id: folderId,
        ...updates,
        description
      }]
    };

    const response = await this.makeRequest<FolderResponse>('/folders/update', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Aucune donnée retournée lors de la mise à jour');
    }

    return response.data[0];
  }

  /**
   * Supprimer un dossier
   */
  async deleteFolder(folderId: number, userId: number): Promise<boolean> {
    const requestData = {
      datas: [{ id: folderId }]
    };

    console.log('🗑️ Suppression dossier avec payload:', requestData);

    await this.makeRequest('/folders/delete', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return true;
  }

  /**
   * Déplacer un dossier vers un autre parent
   */
  async moveFolder(
    folderId: number,
    newParentId: number | null,
    userId: number
  ): Promise<Folder> {
    return this.updateFolder(folderId, { parent_id: newParentId }, userId);
  }

  /**
   * Rechercher des dossiers dans un projet
   */
  async searchFolders(
    projectId: number,
    searchTerm: string,
    userId: number
  ): Promise<Folder[]> {
    return this.getFoldersByProject(projectId, null, userId, searchTerm);
  }

  /**
   * Obtenir les statistiques d'un dossier
   */
  async getFolderStats(folderId: number, userId: number): Promise<{
    totalFiles: number;
    totalSize: number;
    subfolderCount: number;
  }> {
    // Cette fonctionnalité pourrait nécessiter une API dédiée
    // Pour l'instant, on retourne des valeurs par défaut
    return {
      totalFiles: 0,
      totalSize: 0,
      subfolderCount: 0
    };
  }

  /**
   * Vérifier les permissions d'un dossier pour un utilisateur
   */
  async checkFolderPermission(
    folderId: number,
    userId: number,
    permissionType: 'read' | 'write' | 'admin'
  ): Promise<boolean> {
    // À implémenter selon les besoins de sécurité
    // Pour l'instant, on retourne true (à adapter selon le rôle utilisateur)
    return true;
  }

  /**
   * Obtenir le chemin complet d'un dossier
   */
  async getFolderPath(folderId: number, projectId: number, userId: number): Promise<string> {
    const allFolders = await this.getFoldersByProject(projectId, null, userId);
    const folderMap = new Map(allFolders.map(f => [f.id, f]));
    
    const buildPath = (id: number): string => {
      const folder = folderMap.get(id);
      if (!folder) return '';
      
      if (folder.parent_id === null) {
        return folder.name;
      }
      
      const parentPath = buildPath(folder.parent_id);
      return parentPath ? `${parentPath}/${folder.name}` : folder.name;
    };

    return buildPath(folderId);
  }
}

export const foldersService = new FoldersService();