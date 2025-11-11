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

// Types pour les fichiers (interface frontend)
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

// Types pour les fichiers (réponse API)
export interface ApiProjectFile {
  id: number;
  name: string;
  file_url: string;
  folder_id: number;
  project_id?: number;
  incident_id?: number;
  partner_id?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  is_active: boolean;
  is_deleted: boolean;
  is_public: boolean;
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
  items: ApiProjectFile[];
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
const statsCache: { [key: string]: FolderStats } = {};

export class ProjectFilesService {
  private static instance: ProjectFilesService;

  public static getInstance(): ProjectFilesService {
    if (!ProjectFilesService.instance) {
      ProjectFilesService.instance = new ProjectFilesService();
    }
    return ProjectFilesService.instance;
  }

  /**
   * Mapper les fichiers de l'API vers l'interface frontend
   */
  private mapApiFilesToProjectFiles(apiFiles: ApiProjectFile[]): ProjectFile[] {
    return apiFiles.map(apiFile => ({
      id: apiFile.id,
      name: apiFile.name,
      original_name: apiFile.name, // L'API utilise "name" pour le nom du fichier
      file_path: apiFile.file_url, // L'API utilise "file_url" pour le chemin
      file_size: 0, // L'API ne retourne pas la taille, on met 0 par défaut
      mime_type: this.getMimeTypeFromFileName(apiFile.name), // Déduit du nom du fichier
      folder_id: apiFile.folder_id,
      project_id: apiFile.project_id,
      incident_id: apiFile.incident_id,
      partner_id: apiFile.partner_id,
      created_at: apiFile.created_at,
      updated_at: apiFile.updated_at,
      created_by: apiFile.created_by,
      is_public: apiFile.is_public,
      is_deleted: apiFile.is_deleted
    }));
  }

  /**
   * Déterminer le type MIME à partir du nom du fichier
   */
  private getMimeTypeFromFileName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
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

      // 🔧 CORRECTION: Toujours inclure parent_folder_id pour un filtrage précis
      if (parentFolderId !== undefined) {
        requestData.data.parent_folder_id = parentFolderId; // null = dossier racine, number = sous-dossiers
      }

      if (projectId !== undefined) {
        requestData.data.project_id = projectId;
      }

      // 🔍 LOG: Requête getFolders
      console.log('🔍 [DEBUG SERVICE] - Requête getFolders CORRIGÉE:', {
        parentFolderId,
        projectId,
        requestData: JSON.stringify(requestData, null, 2),
        expliciteParentFilter: parentFolderId !== undefined ? `parent_folder_id = ${parentFolderId}` : 'Pas de filtre parent'
      });

      const response = await securedFetch('/api/folders/getByCriteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Vérifier si la réponse est OK avant de parser le JSON
      if (!response.ok) {
        console.error('🔍 [DEBUG SERVICE] - Réponse HTTP non-OK:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        return [];
      }

      let data: FoldersResponse;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('🔍 [DEBUG SERVICE] - Erreur parsing JSON:', {
          error: jsonError,
          responseText: await response.text().catch(() => 'Impossible de lire le texte')
        });
        return [];
      }
      
      // 🔍 LOG: Réponse getFolders
      console.log('🔍 [DEBUG SERVICE] - Réponse getFolders:', {
        success: data.code === 200,
        totalItems: data.items?.length || 0,
        folders: data.items?.map(f => ({
          id: f.id,
          name: f.name,
          parent_folder_id: f.parent_folder_id,
          parent_folder_type: typeof f.parent_folder_id,
          parent_folder_value: String(f.parent_folder_id),
          project_id: f.project_id,
          expectedParent: parentFolderId,
          expectedType: typeof parentFolderId,
          matchesFilter: f.parent_folder_id === parentFolderId
        })) || [],
        rawResponse: data
      });

      if (data.code === 200) {
        const folders = data.items || [];
        
        // 🔧 VALIDATION: Vérifier que tous les dossiers retournés correspondent au filtrage demandé
        console.log('🔍 [DEBUG FILTRAGE] - Analyse avant filtrage:', {
          totalFolders: folders.length,
          expectedParentId: parentFolderId,
          foldersDetails: folders.map(f => ({
            id: f.id,
            name: f.name,
            parent_folder_id: f.parent_folder_id,
            matches: f.parent_folder_id === parentFolderId
          }))
        });

        const filteredFolders = folders.filter(folder => {
          // Normaliser les valeurs pour la comparaison
          // null, 0, "" sont tous considérés comme "racine"
          const normalizedParentId = !folder.parent_folder_id || 
            Number(folder.parent_folder_id) === 0 ||
            String(folder.parent_folder_id) === '0' ||
            String(folder.parent_folder_id) === ''
            ? null 
            : folder.parent_folder_id;
          
          const normalizedExpectedId = !parentFolderId || 
            Number(parentFolderId) === 0 ||
            String(parentFolderId) === '0' ||
            String(parentFolderId) === ''
            ? null
            : parentFolderId;
          
          const isCorrectParent = normalizedParentId === normalizedExpectedId;
          
          if (!isCorrectParent) {
            console.warn('🚨 [HIERARCHY ERROR] - Dossier avec mauvais parent_folder_id détecté:', {
              folder: {
                id: folder.id,
                name: folder.name,
                original_parent_folder_id: folder.parent_folder_id,
                normalized_parent_id: normalizedParentId,
                expected_original: parentFolderId,
                expected_normalized: normalizedExpectedId,
                matches: isCorrectParent
              }
            });
          }
          return isCorrectParent;
        });
        
        if (filteredFolders.length !== folders.length) {
          console.warn(`🔧 [HIERARCHY FIX] - Filtrage appliqué côté frontend: ${folders.length} → ${filteredFolders.length} dossiers`);
        }
        
        return filteredFolders;
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

      // 🔍 LOG: Requête getFiles
      console.log('🔍 [DEBUG SERVICE] - Requête getFiles:', {
        folderId,
        projectId,
        requestData
      });

      // Essayer d'abord avec juste folder_id (cas le plus courant pour les sous-dossiers)
      try {
        const response = await securedFetch('/api/files/getByCriteria', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const data: FilesResponse = await response.json();
        
        console.log('🔍 [DEBUG SERVICE] - Réponse getFiles (folder_id seul):', {
          success: data.code === 200,
          count: data.items?.length || 0,
          items: data.items?.map(f => ({ id: f.id, name: f.name, folder_id: f.folder_id }))
        });

        if (data.code === 200 && data.items && data.items.length > 0) {
          console.log('🔄 [DEBUG SERVICE] - Mapping des fichiers API vers interface frontend (folder_id seul)');
          return this.mapApiFilesToProjectFiles(data.items);
        }
      } catch (error) {
        console.log('Tentative avec folder_id seul échouée:', error);
      }

      // Si on a un projectId, essayer avec project_id
      if (projectId !== undefined) {
        try {
          requestData.data.project_id = projectId;
          
          const response = await securedFetch('/api/files/getByCriteria', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          const data: FilesResponse = await response.json();
          
          console.log('🔍 [DEBUG SERVICE] - Réponse getFiles (avec project_id):', {
            success: data.code === 200,
            count: data.items?.length || 0
          });

          if (data.code === 200) {
            console.log('🔄 [DEBUG SERVICE] - Mapping des fichiers API vers interface frontend (avec project_id)');
            return this.mapApiFilesToProjectFiles(data.items || []);
          }
        } catch (error) {
          console.log('project_id failed, trying incident_id');
        }

        // Fallback avec incident_id
        try {
          delete requestData.data.project_id;
          requestData.data.incident_id = projectId;
          
          const response = await securedFetch('/api/files/getByCriteria', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          const data: FilesResponse = await response.json();
          
          console.log('🔍 [DEBUG SERVICE] - Réponse getFiles (avec incident_id):', {
            success: data.code === 200,
            count: data.items?.length || 0
          });

          if (data.code === 200) {
            console.log('🔄 [DEBUG SERVICE] - Mapping des fichiers API vers interface frontend (avec incident_id)');
            return this.mapApiFilesToProjectFiles(data.items || []);
          }
        } catch (error) {
          console.error('Erreur avec incident_id:', error);
        }
      }

      // Retourner un tableau vide si toutes les tentatives échouent
      console.warn('🔍 [DEBUG SERVICE] - Aucun fichier trouvé pour le dossier:', folderId);
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      return [];
    }
  }

  /**
   * Créer un nouveau dossier (avec logs de debug et fallback)
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

      // 🔍 VALIDATION: Ajouter parent_folder_id si fourni
      // Note: On ne vérifie plus l'existence car cela pose problème avec les sous-dossiers
      // Le backend retournera une erreur si le parent n'existe pas
      if (parentFolderId !== undefined && parentFolderId !== null) {
        console.log('🔍 [DEBUG SERVICE] - Ajout du parent_folder_id:', {
          parentFolderId,
          type: typeof parentFolderId
        });
        
        requestData.datas[0].parent_folder_id = parentFolderId;
      } else {
        console.log('🔍 [DEBUG SERVICE] - Création dans le dossier racine (parent_folder_id non défini)');
      }

      if (projectId !== undefined) {
        requestData.datas[0].project_id = projectId;
      }

      // 🔍 LOG: Requête complète envoyée au backend
      console.log('🔍 [DEBUG SERVICE] - Requête complète envoyée au backend:', {
        url: '/api/folders/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData, null, 2),
        parameters: {
          name: name.trim(),
          description: description.trim(),
          parentFolderId,
          projectId,
          userId
        },
        backendExpectedFormat: {
          explanation: "Backend attend selon doc: parent_folder_id (ID du parent) + project_id",
          option1: "parent_folder_id + project_id",
          option2: "parent_folder_name + project_name"
        }
      });

      const response = await securedFetch('/api/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: any = await response.json();

      // 🔍 LOG: Réponse complète du backend
      console.log('🔍 [DEBUG SERVICE] - Réponse complète du backend createFolder:', {
        httpStatus: response.status,
        httpStatusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseBody: data,
        success: data.code === 200,
        hasItems: !!(data.items && data.items.length > 0),
        createdFolder: data.items?.[0],
        fullResponse: JSON.stringify(data, null, 2)
      });

      if (data.code === 200 && data.items && data.items.length > 0) {
        return data.items[0];
      } else {
        // 🔍 Analyser le type d'erreur
        const errorMessage = data.message || '';
        const isPermissionError = errorMessage.includes('Permission denied') || errorMessage.includes('Errno 13');
        const isBadRequest = errorMessage.includes('Dossier parent non trouvé') || errorMessage.includes('parent not found');
        
        console.error('🔍 [DEBUG SERVICE] - Analyse de l\'erreur:', {
          errorMessage,
          isPermissionError,
          isBadRequest,
          shouldTryFallback: !isPermissionError && parentFolderId !== null && parentFolderId !== undefined
        });
        
        // 🔄 FALLBACK: Essayer avec parent_folder_name seulement si ce n'est pas une erreur de permissions
        if (!isPermissionError && parentFolderId !== null && parentFolderId !== undefined) {
          console.warn('🔄 [DEBUG SERVICE] - Tentative de fallback avec parent_folder_name...');
          return await this.createFolderWithParentName(name, description, parentFolderId, projectId, userId);
        }
        
        // ⚠️ Erreur de permissions : ne pas essayer le fallback
        if (isPermissionError) {
          console.error('🚨 [DEBUG SERVICE] - Erreur de permissions détectée, aucun fallback possible');
          throw new Error('Erreur de permissions sur le serveur. Le backend n\'a pas les droits d\'écriture dans le répertoire ./static/files/projects/. Contactez l\'administrateur système.');
        }
        
        console.error('🔍 [DEBUG SERVICE] - Erreur lors de la création du dossier:', data.message);
        return null;
      }
    } catch (error) {
      console.error('🔍 [DEBUG SERVICE] - Exception lors de la création du dossier:', error);
      // Re-lancer les erreurs de permissions pour qu'elles soient gérées par l'interface
      if (error instanceof Error && error.message.includes('permissions')) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Créer un dossier avec parent_folder_name (fallback selon documentation backend)
   */
  private async createFolderWithParentName(
    name: string,
    description: string = '',
    parentFolderId: number,
    projectId?: number,
    userId: number = 1
  ): Promise<ProjectFolder | null> {
    try {
      // D'abord, récupérer le nom du dossier parent
      const parentFolders = await this.getFolders(null, projectId); // Récupérer tous les dossiers pour trouver le parent
      const parentFolder = parentFolders.find(f => f.id === parentFolderId);
      
      if (!parentFolder) {
        console.error('🔍 [DEBUG FALLBACK] - Dossier parent introuvable pour ID:', parentFolderId);
        return null;
      }

      const requestData: any = {
        user: {
          id: userId
        },
        datas: [{
          name: name.trim(),
          description: description.trim(),
          parent_folder_name: parentFolder.name, // Utiliser parent_folder_name au lieu de parent_folder_id
        }]
      };

      if (projectId !== undefined) {
        requestData.datas[0].project_id = projectId;
      }

      // 🔍 LOG: Requête fallback envoyée
      console.log('🔍 [DEBUG FALLBACK] - Requête createFolder avec parent_folder_name:', {
        parentFolderName: parentFolder.name,
        parentFolderId,
        requestData: JSON.stringify(requestData, null, 2)
      });

      const response = await securedFetch('/api/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: any = await response.json();

      // 🔍 LOG: Réponse fallback reçue
      console.log('🔍 [DEBUG FALLBACK] - Réponse createFolder avec parent_folder_name:', {
        responseData: data,
        success: data.code === 200,
        hasItems: !!(data.items && data.items.length > 0),
        createdFolder: data.items?.[0]
      });

      if (data.code === 200 && data.items && data.items.length > 0) {
        return data.items[0];
      } else {
        console.error('🔍 [DEBUG FALLBACK] - Échec du fallback aussi:', data.message);
        return null;
      }
    } catch (error) {
      console.error('🔍 [DEBUG FALLBACK] - Exception lors du fallback:', error);
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

      const response = await securedFetch('/api/folders/update', {
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

      const response = await securedFetch('/api/folders/delete', {
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
    // Clé de cache unique pour éviter les conflits
    const cacheKey = `${folderId}_${projectId || 'null'}`;
    const cached = statsCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_DURATION) {
      console.log('💾 [DEBUG STATS] - Utilisation du cache pour:', { folderId, projectId, stats: cached });
      return cached;
    }

    try {
      // 🔍 LOG: Début du calcul des stats
      console.log('🔍 [DEBUG STATS] - Calcul des statistiques pour le dossier:', {
        folderId,
        projectId,
        cacheKey
      });

      // Récupérer les sous-dossiers
      const folders = await this.getFolders(folderId, projectId);
      const subfolders = folders.length;
      
      console.log('🔍 [DEBUG STATS] - Sous-dossiers trouvés:', {
        count: subfolders,
        folders: folders.map(f => ({ id: f.id, name: f.name, parent_folder_id: f.parent_folder_id }))
      });

      // Récupérer les fichiers
      const files = await this.getFiles(folderId, projectId);
      const filesCount = files.length;
      
      console.log('🔍 [DEBUG STATS] - Fichiers trouvés:', {
        count: filesCount,
        files: files.map(f => ({ 
          id: f.id, 
          name: f.original_name, 
          folder_id: f.folder_id,
          project_id: f.project_id,
          incident_id: f.incident_id
        }))
      });

      const stats: FolderStats = {
        subfolders,
        files: filesCount,
        timestamp: Date.now()
      };

      // Mettre en cache avec la clé unique
      statsCache[cacheKey] = stats;
      
      console.log('🔍 [DEBUG STATS] - Statistiques finales:', { folderId, projectId, stats, cacheKey });
      return stats;

    } catch (error) {
      console.error('❌ [DEBUG STATS] - Erreur lors du calcul des statistiques:', {
        folderId,
        projectId,
        error: error instanceof Error ? error.message : error
      });
      
      // Retourner des stats par défaut sans les mettre en cache en cas d'erreur
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

      const response = await securedFetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.code === 200 || response.ok) {
        // Invalider le cache des stats pour ce dossier
        Object.keys(statsCache).forEach(key => {
          if (key.startsWith(`${folderId}_`)) {
            delete statsCache[key];
          }
        });
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
      const response = await securedFetch(`/api/files/delete`, {
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
      const response = await securedFetch(`/api/files/download/${fileId}`, {
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
      delete statsCache[key];
    });
    console.log('🗑️ [DEBUG CACHE] - Cache des statistiques vidé');
  }

  /**
   * Vider le cache pour un dossier spécifique
   */
  clearFolderStatsCache(folderId: number, projectId?: number): void {
    const cacheKey = `${folderId}_${projectId || 'null'}`;
    delete statsCache[cacheKey];
    console.log('🗑️ [DEBUG CACHE] - Cache vidé pour:', { folderId, projectId, cacheKey });
  }

  /**
   * Récupérer les dossiers d'un partenaire
   */
  async getPartnerFolders(parentFolderId: number | null, partnerId: number): Promise<ProjectFolder[]> {
    try {
      const endpoint = parentFolderId 
        ? `/api/folders?parent_folder_id=${parentFolderId}&partner_id=${partnerId}`
        : `/api/folders?partner_id=${partnerId}`;
        
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
      const response = await securedFetch(`/api/files?folder_id=${folderId}&partner_id=${partnerId}`);
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

      const response = await securedFetch('/api/folders/create', {
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

      const response = await securedFetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.code === 200 || response.ok) {
        // Invalider le cache des stats pour ce dossier
        Object.keys(statsCache).forEach(key => {
          if (key.startsWith(`${folderId}_`)) {
            delete statsCache[key];
          }
        });
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