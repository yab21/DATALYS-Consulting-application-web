import { API_CONFIG } from "@/lib/api-config";

// Types pour le système de gestion des fichiers
export interface FileItem {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  project_id?: number;
  folder_id?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_by_role: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  download_count: number;
  last_accessed?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parent_id?: string;
  project_id?: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  files_count: number;
  subfolders_count: number;
  total_size: number;
  is_shared: boolean;
}

export interface UploadFileRequest {
  file: File;
  project_id?: number;
  folder_id?: string;
  is_public?: boolean;
  description?: string;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: string;
  project_id?: number;
  is_shared?: boolean;
}

export interface FileFilters {
  project_id?: number;
  folder_id?: string;
  file_type?: string;
  uploaded_by?: string;
  date_from?: string;
  date_to?: string;
  is_public?: boolean;
  search?: string;
}

export interface FilesResponse {
  items: FileItem[];
  count: number;
  message: string;
  code: number;
}

export interface FoldersResponse {
  items: FolderItem[];
  count: number;
  message: string;
  code: number;
}

export interface UploadResponse {
  file: FileItem;
  code: number;
  message: string;
}

export interface FileStats {
  total_files: number;
  total_size: number;
  total_folders: number;
  recent_uploads: number;
  public_files: number;
  private_files: number;
  avg_file_size: number;
  storage_used_percentage: number;
}

class FilesService {
  private baseUrl = API_CONFIG.BASE_URL;
  
  // Récupérer le token d'authentification
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  // Helper pour gérer les uploads avec FormData
  private getUploadHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`
      // Ne pas définir Content-Type pour les uploads, le navigateur le fait automatiquement
    };
  }

  /**
   * Uploader un fichier
   */
  async uploadFile(data: UploadFileRequest): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      
      if (data.project_id) formData.append('project_id', data.project_id.toString());
      if (data.folder_id) formData.append('folder_id', data.folder_id);
      if (data.is_public !== undefined) formData.append('is_public', data.is_public.toString());
      if (data.description) formData.append('description', data.description);

      const response = await fetch(`${this.baseUrl}/files/upload`, {
        method: 'POST',
        headers: this.getUploadHeaders(),
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload du fichier');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur upload fichier:', error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des fichiers avec filtres
   */
  async getFiles(
    index: number = 0,
    size: number = 20,
    filters: FileFilters = {}
  ): Promise<FilesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/files/list`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          index,
          size,
          data: filters
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des fichiers');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération fichiers:', error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des dossiers
   */
  async getFolders(
    index: number = 0,
    size: number = 50,
    filters: { parent_id?: string; project_id?: number; search?: string } = {}
  ): Promise<FoldersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/folders/list`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          index,
          size,
          data: filters
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des dossiers');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération dossiers:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau dossier
   */
  async createFolder(data: CreateFolderRequest): Promise<{ folder: FolderItem; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/folders/create`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du dossier');
      }

      const result = await response.json();
      return {
        folder: result.items[0],
        code: result.code
      };
    } catch (error) {
      console.error('Erreur création dossier:', error);
      throw error;
    }
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/files/download/${fileId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du téléchargement');
      }

      return await response.blob();
    } catch (error) {
      console.error('Erreur téléchargement fichier:', error);
      throw error;
    }
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/delete/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur suppression fichier:', error);
      throw error;
    }
  }

  /**
   * Supprimer un dossier
   */
  async deleteFolder(folderId: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/folders/delete/${folderId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du dossier');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur suppression dossier:', error);
      throw error;
    }
  }

  /**
   * Renommer un fichier
   */
  async renameFile(fileId: string, newName: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/rename/${fileId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du renommage');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur renommage fichier:', error);
      throw error;
    }
  }

  /**
   * Renommer un dossier
   */
  async renameFolder(folderId: string, newName: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/folders/rename/${folderId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du renommage du dossier');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur renommage dossier:', error);
      throw error;
    }
  }

  /**
   * Déplacer un fichier vers un autre dossier
   */
  async moveFile(fileId: string, targetFolderId?: string): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/move/${fileId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder_id: targetFolderId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du déplacement');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur déplacement fichier:', error);
      throw error;
    }
  }

  /**
   * Partager/départager un fichier
   */
  async toggleFileSharing(fileId: string, isPublic: boolean): Promise<{ success: boolean; code: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/share/${fileId}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_public: isPublic })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du partage');
      }

      const result = await response.json();
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Erreur partage fichier:', error);
      throw error;
    }
  }

  /**
   * Recherche unifiée dans les fichiers et dossiers
   */
  async searchFiles(
    query: string,
    index: number = 0,
    size: number = 20,
    filters: FileFilters = {}
  ): Promise<FilesResponse> {
    try {
      const searchFilters = {
        ...filters,
        search: query
      };

      const response = await fetch(`${this.baseUrl}/files/search`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          index,
          size,
          data: searchFilters
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la recherche');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur recherche fichiers:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques de stockage
   */
  async getStorageStats(): Promise<FileStats> {
    try {
      const response = await fetch(`${this.baseUrl}/files/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        // Si l'API n'existe pas encore, retourner des stats par défaut
        return {
          total_files: 0,
          total_size: 0,
          total_folders: 0,
          recent_uploads: 0,
          public_files: 0,
          private_files: 0,
          avg_file_size: 0,
          storage_used_percentage: 0
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats stockage:', error);
      // Retourner des stats par défaut en cas d'erreur
      return {
        total_files: 0,
        total_size: 0,
        total_folders: 0,
        recent_uploads: 0,
        public_files: 0,
        private_files: 0,
        avg_file_size: 0,
        storage_used_percentage: 0
      };
    }
  }

  /**
   * Récupérer les fichiers récents
   */
  async getRecentFiles(limit: number = 10): Promise<FilesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/files/recent`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des fichiers récents');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération fichiers récents:', error);
      throw error;
    }
  }

  /**
   * Obtenir un lien de partage public pour un fichier
   */
  async getShareLink(fileId: string): Promise<{ shareLink: string; expiresAt?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/share-link/${fileId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la génération du lien');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur génération lien partage:', error);
      throw error;
    }
  }

  /**
   * Helper pour formater la taille des fichiers
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Helper pour déterminer le type de fichier par son extension
   */
  getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const spreadsheetTypes = ['xls', 'xlsx', 'csv'];
    const presentationTypes = ['ppt', 'pptx'];
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (documentTypes.includes(extension)) return 'document';
    if (spreadsheetTypes.includes(extension)) return 'spreadsheet';
    if (presentationTypes.includes(extension)) return 'presentation';
    if (videoTypes.includes(extension)) return 'video';
    if (audioTypes.includes(extension)) return 'audio';
    if (archiveTypes.includes(extension)) return 'archive';
    
    return 'other';
  }

  /**
   * Helper pour obtenir l'icône correspondant au type de fichier
   */
  getFileIcon(fileName: string): string {
    const fileType = this.getFileType(fileName);
    
    const icons = {
      image: '🖼️',
      document: '📄',
      spreadsheet: '📊',
      presentation: '📑',
      video: '🎥',
      audio: '🎵',
      archive: '📦',
      other: '📁'
    };
    
    return icons[fileType as keyof typeof icons] || '📁';
  }
}

// Instance singleton du service
export const filesService = new FilesService();
export default filesService;