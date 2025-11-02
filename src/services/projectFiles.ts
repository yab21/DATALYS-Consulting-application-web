/**
 * Service pour la gestion des fichiers et dossiers de projets
 */

import { securedFetch } from '@/lib/api-interceptor';

// Types pour les dossiers
export interface ProjectFolder {
  id: number;
  name: string;
  description?: string;
  path: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  is_active: boolean;
  is_deleted: boolean;
  parent_folder_id?: number;
  project_id?: number;
  partner_id?: number;
}

// Types pour les fichiers
export interface ProjectFile {
  id: number;
  name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  folder_id: number;
  project_id?: number;
  incident_id?: number;
  partner_id?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  is_public: boolean;
  is_deleted: boolean;
}

// Types pour les statistiques
export interface FolderStats {
  subfolders: number;
  files: number;
  timestamp: number;
}

// Types pour les réponses API
export interface FoldersResponse {
  code: number;
  count: number;
  items: ProjectFolder[];
  message: {
    code: number;
    message: string;
  };
}

export interface FilesResponse {
  code: number;
  count: number;
  items: ProjectFile[];
  message: {
    code: number;
    message: string;
  };
}

// Types pour les requêtes
export interface CreateFolderRequest {
  user: {
    id: number;
  };
  datas: Array<{
    name: string;
    description?: string;
    parent_folder_id?: number;
    project_id?: number;
    partner_id?: number;
  }>;
}

export interface UpdateFolderRequest {
  user: {
    id: number;
    email?: string;
  };
  datas: Array<{
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
  }>;
}

export interface DeleteFolderRequest {
  datas: Array<{
    id: number;
  }>;
}

// Cache pour les statistiques des dossiers (5 minutes)
const STATS_CACHE_DURATION = 5 * 60 * 1000;
const statsCache: { [key: number]: FolderStats } = {};

export class ProjectFilesService {
  private static instance: ProjectFilesService;

  public static getInstance(): ProjectFilesService {
    if (!ProjectFilesService.instance) {
      ProjectFilesService.instance = new ProjectFilesService();
    }
    return ProjectFilesService.instance;
  }

  /**
   * Récupérer les dossiers d'un projet ou d'un dossier parent (avec logs de debug)
   */
  async getFolders(parentFolderId?: number | null, projectId?: number): Promise<ProjectFolder[]> {
    try {
      const requestData: any = {
        index: 0,
        size: 100,
        data: {}
      };

      if (parentFolderId !== undefined && parentFolderId !== null) {
        requestData.data.parent_folder_id = parentFolderId;
      }

      if (projectId !== undefined) {
        requestData.data.project_id = projectId;
      }

      // 🔍 LOG: Requête getFolders
      console.log('🔍 [DEBUG SERVICE] - Requête getFolders:', {
        parentFolderId,
        projectId,
        requestData: JSON.stringify(requestData, null, 2)
      });

      const response = await securedFetch('/api/proxy/folders/getByCriteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: FoldersResponse = await response.json();
      
      // 🔍 LOG: Réponse getFolders
      console.log('🔍 [DEBUG SERVICE] - Réponse getFolders:', {
        success: data.code === 200,
        totalItems: data.items?.length || 0,
        folders: data.items?.map(f => ({
          id: f.id,
          name: f.name,
          parent_folder_id: f.parent_folder_id,
          project_id: f.project_id
        })) || []
      });

      if (data.code === 200) {
        return data.items || [];
      } else {
        console.warn('Erreur lors de la récupération des dossiers:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers:', error);
      return [];
    }
  }

  /**
   * Récupérer les fichiers d'un dossier
   */
  async getFiles(folderId: number, projectId?: number): Promise<ProjectFile[]> {
    try {
      const requestData: any = {
        index: 0,
        size: 100,
        data: {
          folder_id: folderId
        }
      };

      // Logique adaptative : essayer project_id puis incident_id
      if (projectId !== undefined) {
        try {
          requestData.data.project_id = projectId;
          
          const response = await securedFetch('/api/proxy/files/getByCriteria', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          const data: FilesResponse = await response.json();

          if (data.code === 200) {
            return data.items || [];
          }
        } catch (error) {
          console.log('project_id failed, trying incident_id');
        }

        // Fallback avec incident_id
        try {
          delete requestData.data.project_id;
          requestData.data.incident_id = projectId;
          
          const response = await securedFetch('/api/proxy/files/getByCriteria', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          const data: FilesResponse = await response.json();

          if (data.code === 200) {
            return data.items || [];
          }
        } catch (error) {
          console.error('Erreur avec incident_id:', error);
        }
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }
  }

  /**
   * Créer un nouveau dossier (avec logs de debug)
   */
  async createFolder(
    name: string,
    description: string = '',
    parentFolderId?: number | null,
    projectId?: number,
    userId: number = 1
  ): Promise<ProjectFolder | null> {
    try {
      const requestData: CreateFolderRequest = {
        user: {
          id: userId
        },
        datas: [{
          name: name.trim(),
          description: description.trim(),
        }]
      };

      if (parentFolderId !== undefined && parentFolderId !== null) {
        requestData.datas[0].parent_folder_id = parentFolderId;
      }

      if (projectId !== undefined) {
        requestData.datas[0].project_id = projectId;
      }

      // 🔍 LOG: Requête envoyée
      console.log('🔍 [DEBUG SERVICE] - Requête createFolder:', {
        name: name.trim(),
        description: description.trim(),
        parentFolderId,
        projectId,
        userId,
        requestData: JSON.stringify(requestData, null, 2)
      });

      const response = await securedFetch('/api/proxy/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: any = await response.json();

      // 🔍 LOG: Réponse reçue
      console.log('🔍 [DEBUG SERVICE] - Réponse createFolder:', {
        responseData: data,
        success: data.code === 200,
        hasItems: !!(data.items && data.items.length > 0),
        createdFolder: data.items?.[0]
      });

      if (data.code === 200 && data.items && data.items.length > 0) {
        return data.items[0];
      } else {
        console.error('🔍 [DEBUG SERVICE] - Erreur lors de la création du dossier:', data.message);
        return null;
      }
    } catch (error) {
      console.error('🔍 [DEBUG SERVICE] - Exception lors de la création du dossier:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un dossier
   */
  async updateFolder(
    folderId: number,
    name: string,
    description: string = '',
    userId: number = 1,
    userEmail: string = ''
  ): Promise<boolean> {
    try {
      const requestData: UpdateFolderRequest = {
        user: {
          id: userId,
          email: userEmail
        },
        datas: [{
          id: folderId,
          name: name.trim(),
          description: description.trim(),
          is_active: true
        }]
      };

      const response = await securedFetch('/api/proxy/folders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: any = await response.json();

      if (data.code === 200) {
        // Invalider le cache des stats pour ce dossier
        delete statsCache[folderId];
        return true;
      } else {
        console.error('Erreur lors de la mise à jour du dossier:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier:', error);
      return false;
    }
  }

  /**
   * Supprimer un dossier
   */
  async deleteFolder(folderId: number): Promise<boolean> {
    try {
      const requestData: DeleteFolderRequest = {
        datas: [{
          id: folderId
        }]
      };

      const response = await securedFetch('/api/proxy/folders/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: any = await response.json();

      if (data.code === 200) {
        // Invalider le cache des stats pour ce dossier
        delete statsCache[folderId];
        return true;
      } else {
        console.error('Erreur lors de la suppression du dossier:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques d'un dossier (avec cache)
   */
  async getFolderStats(folderId: number, projectId?: number): Promise<FolderStats> {
    // Vérifier le cache
    const cached = statsCache[folderId];
    if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_DURATION) {
      return cached;
    }

    try {
      // Récupérer les sous-dossiers
      const folders = await this.getFolders(folderId, projectId);
      const subfolders = folders.length;

      // Récupérer les fichiers
      const files = await this.getFiles(folderId, projectId);
      const filesCount = files.length;

      const stats: FolderStats = {
        subfolders,
        files: filesCount,
        timestamp: Date.now()
      };

      // Mettre en cache
      statsCache[folderId] = stats;
      return stats;

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return { subfolders: 0, files: 0, timestamp: Date.now() };
    }
  }

  /**
   * Upload d'un fichier
   */
  async uploadFile(
    file: File,
    folderId: number,
    userId: number,
    projectId?: number
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', folderId.toString());
      formData.append('user', JSON.stringify({ id: userId }));

      if (projectId) {
        formData.append('project_id', projectId.toString());
      }

      const response = await securedFetch('/api/proxy/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.code === 200 || response.ok) {
        // Invalider le cache des stats pour ce dossier
        delete statsCache[folderId];
        return true;
      } else {
        console.error('Erreur lors de l\'upload du fichier:', data);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      return false;
    }
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(fileId: number): Promise<boolean> {
    try {
      const response = await securedFetch(`/api/proxy/files/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datas: [{ id: fileId }]
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        return true;
      } else {
        console.error('Erreur lors de la suppression du fichier:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(fileId: number, fileName: string): Promise<void> {
    try {
      const response = await securedFetch(`/api/proxy/files/download/${fileId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw error;
    }
  }

  /**
   * Invalider tout le cache des statistiques
   */
  clearStatsCache(): void {
    Object.keys(statsCache).forEach(key => {
      delete statsCache[parseInt(key)];
    });
  }

  /**
   * Récupérer les dossiers d'un partenaire
   */
  async getPartnerFolders(parentFolderId: number | null, partnerId: number): Promise<ProjectFolder[]> {
    try {
      const endpoint = parentFolderId 
        ? `/api/proxy/folders?parent_folder_id=${parentFolderId}&partner_id=${partnerId}`
        : `/api/proxy/folders?partner_id=${partnerId}`;
        
      const response = await securedFetch(endpoint);
      const data = await response.json();

      if (data.code === 200 && Array.isArray(data.datas)) {
        return data.datas.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          description: folder.description,
          parent_folder_id: folder.parent_folder_id,
          partner_id: folder.partner_id,
          created_at: folder.created_at,
          updated_at: folder.updated_at,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers du partenaire:', error);
      return [];
    }
  }

  /**
   * Récupérer les fichiers d'un dossier partenaire
   */
  async getPartnerFiles(folderId: number, partnerId: number): Promise<ProjectFile[]> {
    try {
      const response = await securedFetch(`/api/proxy/files?folder_id=${folderId}&partner_id=${partnerId}`);
      const data = await response.json();

      if (data.code === 200 && Array.isArray(data.datas)) {
        return data.datas.map((file: any) => ({
          id: file.id,
          original_name: file.original_name,
          file_name: file.file_name,
          file_path: file.file_path,
          file_size: file.file_size,
          mime_type: file.mime_type,
          folder_id: file.folder_id,
          partner_id: file.partner_id,
          created_at: file.created_at,
          updated_at: file.updated_at,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers du partenaire:', error);
      return [];
    }
  }

  /**
   * Créer un dossier pour un partenaire
   */
  async createPartnerFolder(
    name: string, 
    description: string = '', 
    parentFolderId: number | null,
    partnerId: number,
    userId: number
  ): Promise<ProjectFolder | null> {
    try {
      const requestData: CreateFolderRequest = {
        user: {
          id: userId
        },
        datas: [{
          name: name.trim(),
          description: description.trim(),
        }]
      };

      if (parentFolderId !== null) {
        requestData.datas[0].parent_folder_id = parentFolderId;
      }

      requestData.datas[0].partner_id = partnerId;

      const response = await securedFetch('/api/proxy/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.code === 201 && data.datas && data.datas.length > 0) {
        const folder = data.datas[0];
        return {
          id: folder.id,
          name: folder.name,
          description: folder.description,
          path: folder.path || '',
          created_at: folder.created_at,
          updated_at: folder.updated_at,
          created_by: folder.created_by || 0,
          updated_by: folder.updated_by || 0,
          is_active: folder.is_active ?? true,
          is_deleted: folder.is_deleted ?? false,
          parent_folder_id: folder.parent_folder_id,
          partner_id: folder.partner_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la création du dossier partenaire:', error);
      return null;
    }
  }

  /**
   * Uploader un fichier dans un dossier partenaire
   */
  async uploadPartnerFile(
    file: File,
    folderId: number,
    partnerId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', folderId.toString());
      formData.append('user', JSON.stringify({ id: userId }));
      formData.append('partner_id', partnerId.toString());

      const response = await securedFetch('/api/proxy/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.code === 200 || response.ok) {
        // Invalider le cache des stats pour ce dossier
        delete statsCache[folderId];
        return true;
      } else {
        console.error('Erreur lors de l\'upload du fichier partenaire:', data);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier partenaire:', error);
      return false;
    }
  }
}

// Instance singleton
export const projectFilesService = ProjectFilesService.getInstance();