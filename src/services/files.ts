/**
 * Service de gestion des fichiers avec support des dossiers
 * Basé sur les APIs documentées dans le guide d'intégration
 */

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
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
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
   * Récupérer les fichiers d'un projet ou d'un dossier
   */
  async getFilesByLocation(
    projectId: number,
    folderId: number | null,
    userId: number,
    searchTerm?: string,
    mimeTypeFilter?: string
  ): Promise<ProjectFile[]> {
    const requestData: FileListRequest = {
      user: { id: userId },
      index: 0,
      size: 100,
      data: {
        project_id: projectId,
        folder_id: folderId,
        is_active: true,
        ...(searchTerm && { name: searchTerm }),
        ...(mimeTypeFilter && { mime_type: mimeTypeFilter })
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
              reject(new Error('Erreur lors du parsing de la réponse'));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Erreur réseau lors de l\'upload'));
          });

          xhr.open('POST', `${this.baseUrl}/files/upload`);
          
          // Ajouter l'en-tête d'authentification
          const token = localStorage.getItem('authToken');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          
          xhr.send(formData);
        });

        const uploadedFile = await uploadPromise;
        uploadedFiles.push(uploadedFile);
        
      } catch (error) {
        console.error(`Erreur lors de l'upload de ${file.name}:`, error);
        throw error;
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
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'URL de prévisualisation d'un fichier - Fonctionnalité retirée
   */
  getFilePreviewUrl(file: ProjectFile): string {
    // Fonctionnalité /files/serve retirée de l'application
    throw new Error('Fonctionnalité de prévisualisation non disponible');
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