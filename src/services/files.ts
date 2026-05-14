/**
 * Service de gestion des fichiers avec support des dossiers
 * Basé sur les APIs documentées dans le guide d'intégration
 */

import { SecureStorage } from '@/lib/secure-storage';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';

// Interfaces TypeScript
export interface ProjectFile {
  id: number;
  name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  size: number;
  mime_type: string;
  extension: string;
  folder_id: number | null;
  project_id: number;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  description?: string;
  tags?: string[];
  version?: number;
  checksum?: string;
}

export interface FileUploadRequest {
  user: { id: number };
  datas: Array<{
    project_id: number;
    folder_id?: number | null;
    description?: string;
    tags?: string[];
  }>;
}

export interface FileListRequest {
  user: { id: number };
  index: number;
  size: number;
  data: {
    project_id?: number;
    folder_id?: number | null;
    is_active?: boolean;
    name?: string;
    mime_type?: string;
  };
}

export interface UploadProgressCallback {
  (progress: number, fileName: string): void;
}

class FilesService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  private getAuthHeaders(): HeadersInit {
    const token = SecureStorage.getItem('authToken');
    return {
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
      
      // L'API files utilise le format {code: 200, items: [...]} 
      if (data.code !== 200) {
        const errorMessage = data.message?.message || data.message || 'Erreur lors de la requête';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      // Améliorer le logging d'erreur pour debug
      console.error(`Erreur dans makeRequest (${endpoint}):`, error);
      console.error('Type d\'erreur:', typeof error);
      console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les fichiers selon des critères
   */
  async getFilesByCriteria(
    index: number = 0,
    size: number = 100,
    criteria: {
      project_id?: number;
      folder_id?: number | null;
      is_active?: boolean;
      name?: string;
      mime_type?: string;
    } = {}
  ): Promise<ProjectFile[]> {
    const requestData = {
      index,
      size,
      data: {
        is_active: true,
        ...criteria
      }
    };

    const response = await this.makeRequest<any>('/files/getByCriteria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    return response.items || response.data || [];
  }

  /**
   * Récupérer les fichiers d'un projet ou d'un dossier
   */
  async getFilesByLocation(
    projectId: number,
    folderId: number | null,
    userId: number,
    searchTerm?: string,
    mimeTypeFilter?: string
  ): Promise<ProjectFile[]> {
    const criteria: any = {
      ...(projectId && { project_id: projectId }),
      ...(folderId !== null && { folder_id: folderId }),
      ...(searchTerm && { name: searchTerm }),
      ...(mimeTypeFilter && { mime_type: mimeTypeFilter })
    };

    console.log('🔍 Critères de recherche fichiers:', criteria);
    
    return this.getFilesByCriteria(0, 100, criteria);
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(fileId: number, userId: number): Promise<boolean> {
    const requestData = {
      user: { id: userId },
      datas: [{ id: fileId }]
    };

    await this.makeRequest('/files/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    return true;
  }

  /**
   * Mettre à jour les métadonnées d'un fichier
   */
  async updateFile(
    fileId: number,
    updates: Partial<Pick<ProjectFile, 'name' | 'description' | 'folder_id'>>,
    userId: number,
    tags?: string[]
  ): Promise<ProjectFile> {
    const requestData = {
      user: { id: userId },
      datas: [{
        id: fileId,
        ...updates,
        ...(tags && { tags })
      }]
    };

    const response = await this.makeRequest<any>('/files/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Aucune donnée retournée lors de la mise à jour');
    }

    return response.data[0];
  }

  /**
   * Upload un ou plusieurs fichiers
   */
  async uploadFiles(
    files: File[],
    projectId: number,
    userId: number,
    folderId: number | null = null,
    description?: string,
    onProgress?: UploadProgressCallback
  ): Promise<ProjectFile[]> {
    const uploadedFiles: ProjectFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Préparer les données du formulaire
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId.toString());
        if (folderId !== null) {
          formData.append('folder_id', folderId.toString());
        }
        if (description) {
          formData.append('description', description);
        }

        // Créer la requête avec suivi de progression
        const xhr = new XMLHttpRequest();
        
        const uploadPromise = new Promise<ProjectFile>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(progress, file.name);
            }
          });

          xhr.addEventListener('load', () => {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.status === 'success' && response.data) {
                resolve(response.data);
              } else {
                reject(new Error(response.message || 'Erreur lors de l\'upload'));
              }
            } catch (error) {
              if (isTokenExpiredError(error)) { reject(error); return; }
              const message = extractBackendMessage(error);
              reject(new Error(message));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Erreur réseau lors de l\'upload'));
          });

          xhr.open('POST', `${this.baseUrl}/files/upload`);
          
          // Ajouter l'en-tête d'authentification
          const token = SecureStorage.getItem('authToken');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.send(formData);
        });

        const uploadedFile = await uploadPromise;
        uploadedFiles.push(uploadedFile);
        
      } catch (error) {
        if (isTokenExpiredError(error)) throw error;
        console.error(`Erreur lors de l'upload de ${file.name}:`, error);
        const message = extractBackendMessage(error);
        throw new Error(message);
      }
    }

    return uploadedFiles;
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(fileId: number): Promise<void> {
    const url = `${this.baseUrl}/files/download/${fileId}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || `file_${fileId}`;
      
      // Créer un lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors du téléchargement:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Supprimer des fichiers (nouvelle API)
   */
  async deleteFiles(fileIds: number[]): Promise<boolean> {
    const requestData = {
      datas: fileIds.map(id => ({ id }))
    };

    await this.makeRequest('/files/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    return true;
  }

  /**
   * Mettre à jour des fichiers (nouvelle API)
   */
  async updateFiles(
    updates: Array<{
      id: number;
      name?: string;
      is_public?: boolean;
      is_active?: boolean;
    }>,
    userId: number
  ): Promise<ProjectFile[]> {
    const requestData = {
      user: { id: userId },
      datas: updates
    };

    const response = await this.makeRequest<any>('/files/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    return response.items || response.data || [];
  }

  /**
   * Obtenir l'URL de prévisualisation d'un fichier pour le serveur de fichiers
   */
  getFileServeUrl(filePath: string): string {
    // Nettoyer le chemin en supprimant les slashes de début
    const cleanPath = filePath.replace(/^\/+/, '');
    return `${this.baseUrl}/files/serve/${cleanPath}`;
  }

  /**
   * Obtenir l'URL de prévisualisation d'un fichier avec authentification
   */
  getAuthenticatedFileUrl(filePath: string): string {
    const token = SecureStorage.getItem('authToken');
    const cleanPath = filePath.replace(/^\/+/, '');
    const baseUrl = `${this.baseUrl}/files/serve/${cleanPath}`;
    
    // Ajouter le token en tant que paramètre de requête si disponible
    if (token) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}token=${token}`;
    }
    
    return baseUrl;
  }

  /**
   * Obtenir l'URL de base de l'API
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Extraire le nom de fichier depuis la réponse HTTP
   */
  private getFilenameFromResponse(response: Response): string | null {
    const contentDisposition = response.headers.get('Content-Disposition');
    if (!contentDisposition) return null;

    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (!filenameMatch) return null;

    return filenameMatch[1].replace(/['"]/g, '');
  }
}

export const filesService = new FilesService();