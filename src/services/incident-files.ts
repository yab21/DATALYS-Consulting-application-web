/**
 * Service de gestion des fichiers d'incidents
 * Basé sur les APIs spécifiques documentées par l'utilisateur
 */

import { SecureStorage } from '@/lib/secure-storage';
import { extractBackendMessage } from '@/lib/error-handler';

// Interfaces TypeScript pour les fichiers d'incidents
export interface IncidentFile {
  id: number;
  incident_id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  uploaded_by: number;
  uploaded_at: string;
  is_active: boolean;
}

// Interface pour les données brutes de l'API
interface RawIncidentFile {
  id: number;
  incident_id: number;
  name: string;
  file_url: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  updated_by: number;
  is_active: boolean;
  is_deleted: boolean;
  is_public: boolean;
}

// Fonction pour mapper les données de l'API vers l'interface attendue
const mapRawFileToIncidentFile = (rawFile: RawIncidentFile): IncidentFile => {
  // Extraire l'extension du fichier pour déterminer le type
  const fileExtension = rawFile.name.split('.').pop()?.toLowerCase() || '';
  const getFileTypeFromExtension = (ext: string): string => {
    const typeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    return typeMap[ext] || 'application/octet-stream';
  };

  return {
    id: rawFile.id,
    incident_id: rawFile.incident_id,
    file_name: rawFile.name,
    file_size: (rawFile as any).file_size || (rawFile as any).size || 0, // Essayer de récupérer la taille
    file_type: getFileTypeFromExtension(fileExtension),
    file_url: rawFile.file_url,
    uploaded_by: rawFile.created_by,
    uploaded_at: rawFile.created_at,
    is_active: rawFile.is_active
  };
};

export interface IncidentFileUploadResponse {
  success: boolean;
  message: string;
  file?: IncidentFile;
  error?: string;
}

export interface IncidentFilesListResponse {
  success: boolean;
  data: {
    files: IncidentFile[];
    total: number;
    current_page: number;
    per_page: number;
    total_pages: number;
  };
  message?: string;
  error?: string;
}

export interface UploadProgressCallback {
  (progress: number, fileName: string): void;
}

class IncidentFilesService {
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
      return data;
    } catch (error) {
      console.error(`Erreur dans makeRequest (${endpoint}):`, error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Upload un fichier à un incident
   * POST /incidents/{incident_id}/upload-file
   */
  async uploadFileToIncident(
    incidentId: number,
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<IncidentFileUploadResponse> {
    try {
      // Préparer les données du formulaire
      const formData = new FormData();
      formData.append('file', file);

      // Créer la requête avec suivi de progression
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<IncidentFileUploadResponse>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress, file.name);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log(`📤 Réponse upload pour ${file.name}:`, response);
            console.log(`📊 Status HTTP: ${xhr.status}`);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              // Adapter la structure de réponse selon le format fourni par l'utilisateur
              const fileData = response.data?.db_record || response.file || response.data;
              console.log(`✅ Upload réussi pour ${file.name}:`, fileData);
              resolve({
                success: true,
                message: response.message || 'Fichier uploadé avec succès',
                file: fileData
              });
            } else {
              console.log(`❌ Upload échoué pour ${file.name}:`, response);
              resolve({
                success: false,
                message: response.message || 'Erreur lors de l\'upload',
                error: response.error
              });
            }
          } catch (error) {
            const message = extractBackendMessage(error);
            reject(new Error(message));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur réseau lors de l\'upload'));
        });

        xhr.open('POST', `${this.baseUrl}/incidents/${incidentId}/upload-file`);
        
        // Ajouter l'en-tête d'authentification
        const token = SecureStorage.getItem('authToken');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });

      return await uploadPromise;
      
    } catch (error) {
      console.error(`Erreur lors de l'upload du fichier ${file.name}:`, error);
      const message = extractBackendMessage(error);
      return {
        success: false,
        message: message,
        error: message
      };
    }
  }

  /**
   * Récupérer la liste des fichiers d'un incident
   * POST /files/getByCriteria (utilise l'API mentionnée par l'utilisateur)
   */
  async getIncidentFiles(
    incidentId: number,
    page: number = 1,
    perPage: number = 20
  ): Promise<IncidentFilesListResponse> {
    try {
      console.log(`🌐 Appel API: POST /files/getByCriteria pour incident ${incidentId}`);

      const response = await this.makeRequest<any>(
        `/files/getByCriteria`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            index: (page - 1) * perPage,
            size: perPage,
            data: {
              incident_id: incidentId,
              is_active: true
            }
          })
        }
      );

      console.log("🔄 Réponse brute de l'API files/getByCriteria:", response);

      // Adapter la réponse de l'API files/getByCriteria
      if (response.code === 200 && response.items) {
        const rawFiles = response.items || [];
        const safeRawFiles = Array.isArray(rawFiles) ? rawFiles : [];
        
        // Mapper les fichiers bruts vers l'interface attendue avec récupération de la taille
        const mappedFiles: IncidentFile[] = await Promise.all(
          safeRawFiles.map(async (rawFile: RawIncidentFile) => {
            const mappedFile = mapRawFileToIncidentFile(rawFile);
            
            // Ne pas récupérer la taille automatiquement pour éviter les erreurs CORS
            // La taille sera récupérée à la demande si nécessaire
            if (mappedFile.file_size === 0) {
              mappedFile.file_size = 0; // Garder 0 si pas disponible
            }
            
            return mappedFile;
          })
        );
        
        const total = response.count || mappedFiles.length;
        
        console.log("🔧 Adaptation de la réponse API files/getByCriteria:", {
          rawFiles: safeRawFiles.length,
          mappedFiles: mappedFiles.length,
          total
        });
        
        return {
          success: true,
          data: {
            files: mappedFiles,
            total: total,
            current_page: page,
            per_page: perPage,
            total_pages: Math.ceil(total / perPage)
          }
        };
      }

      // Fallback si format différent
      return {
        success: true,
        data: {
          files: [],
          total: 0,
          current_page: page,
          per_page: perPage,
          total_pages: 0
        }
      };

    } catch (error) {
      console.error(`Erreur lors de la récupération des fichiers de l'incident ${incidentId}:`, error);
      const message = extractBackendMessage(error);
      return {
        success: false,
        data: {
          files: [],
          total: 0,
          current_page: page,
          per_page: perPage,
          total_pages: 0
        },
        error: message
      };
    }
  }

  /**
   * Télécharger un fichier via l'URL de service
   * GET /files/serve/{file_url}
   */
  async downloadIncidentFile(fileUrl: string, fileName?: string): Promise<void> {
    try {
      // Nettoyer l'URL et s'assurer qu'elle utilise le bon format pour la nouvelle API
      const cleanFileUrl = fileUrl.replace(/^\/+/, '');
      
      // La nouvelle API attend le format: /files/serve/incidents/incident_X/filename
      let finalUrl = cleanFileUrl;
      if (!cleanFileUrl.startsWith('incidents/')) {
        finalUrl = cleanFileUrl;
      }
      
      const downloadUrl = `${this.baseUrl}/files/serve/${finalUrl}`;
      
      console.log('📥 Téléchargement du fichier:', downloadUrl);
      console.log('🔑 Headers d\'authentification:', this.getAuthHeaders());
      
      const response = await fetch(downloadUrl, {
        headers: this.getAuthHeaders(),
      });

      console.log('📊 Statut de la réponse:', response.status);
      console.log('📋 Headers de la réponse:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('📦 Taille du blob téléchargé:', blob.size, 'bytes');
      console.log('🏷️ Type du blob:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Le fichier téléchargé est vide');
      }
      
      const filename = fileName || this.getFilenameFromResponse(response) || `incident_file_${Date.now()}`;
      
      // Créer un lien de téléchargement
      const downloadLink = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer après un délai pour s'assurer que le téléchargement a commencé
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadLink);
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Obtenir l'URL de prévisualisation d'un fichier
   */
  getFilePreviewUrl(fileUrl: string): string {
    const cleanPath = fileUrl.replace(/^\/+/, '');
    
    // S'assurer que l'URL utilise le bon format pour la nouvelle API
    let finalUrl = cleanPath;
    if (!cleanPath.startsWith('incidents/')) {
      finalUrl = cleanPath;
    }
    
    return `${this.baseUrl}/files/serve/${finalUrl}`;
  }

  /**
   * Obtenir l'URL de prévisualisation avec authentification
   */
  getAuthenticatedFileUrl(fileUrl: string): string {
    const token = SecureStorage.getItem('authToken');
    const cleanPath = fileUrl.replace(/^\/+/, '');
    
    // S'assurer que l'URL utilise le bon format pour la nouvelle API
    let finalUrl = cleanPath;
    if (!cleanPath.startsWith('incidents/')) {
      finalUrl = cleanPath;
    }
    
    // S'assurer que l'URL est correctement formée
    const baseUrl = `${this.baseUrl}/files/serve/${finalUrl}`;
    
    console.log('🔗 URL authentifiée générée:', baseUrl);
    console.log('🔑 Token présent:', !!token);
    
    return baseUrl;
  }

  /**
   * Prévisualiser un fichier en ouvrant dans un nouvel onglet (comme les projets)
   */
  async viewIncidentFile(fileUrl: string, fileName?: string): Promise<void> {
    try {
      console.log(`📖 [VIEW INCIDENT FILE] - Ouverture du fichier: ${fileName}`);
      console.log(`📖 [VIEW INCIDENT FILE] - File URL fournie: ${fileUrl}`);
      
      // Nettoyer l'URL et s'assurer qu'elle utilise le bon format pour la nouvelle API
      const cleanFileUrl = fileUrl.replace(/^\/+/, '');
      
      // La nouvelle API attend le format: /files/serve/incidents/incident_X/filename
      let finalUrl = cleanFileUrl;
      if (!cleanFileUrl.startsWith('incidents/')) {
        finalUrl = cleanFileUrl;
      }
      
      const viewUrl = `${this.baseUrl}/files/serve/${finalUrl}`;
      
      console.log(`📖 [VIEW INCIDENT FILE] - URL finale: ${viewUrl}`);
      
      const response = await fetch(viewUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Ouvrir dans un nouvel onglet au lieu d'utiliser iframe (évite CSP)
        window.open(url, '_blank');
        
        // Nettoyer l'URL après un délai pour permettre l'ouverture
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        throw new Error(`Erreur lors de l'ouverture du fichier: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'ouverture du fichier ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Créer un blob URL pour la prévisualisation (conservé pour compatibilité)
   * @deprecated Utiliser viewIncidentFile() à la place
   */
  async createPreviewBlob(fileUrl: string): Promise<string> {
    try {
      // Nettoyer l'URL et s'assurer qu'elle utilise le bon format pour la nouvelle API
      const cleanFileUrl = fileUrl.replace(/^\/+/, '');
      
      // La nouvelle API attend le format: /files/serve/incidents/incident_X/filename
      let finalUrl = cleanFileUrl;
      if (!cleanFileUrl.startsWith('incidents/')) {
        finalUrl = cleanFileUrl;
      }
      
      const previewUrl = `${this.baseUrl}/files/serve/${finalUrl}`;
      
      console.log('🔗 URL de prévisualisation (corrigée):', previewUrl);
      
      const response = await fetch(previewUrl, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      console.log('📄 Blob URL créé pour prévisualisation:', blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('❌ Erreur lors de la création du blob:', error);
      throw error;
    }
  }

  /**
   * Récupérer la taille d'un fichier via une requête HEAD
   */
  async getFileSize(fileUrl: string): Promise<number> {
    try {
      // Nettoyer l'URL et s'assurer qu'elle utilise le bon format pour la nouvelle API
      const cleanFileUrl = fileUrl.replace(/^\/+/, '');
      
      // S'assurer que l'URL utilise le bon format pour la nouvelle API
      let finalUrl = cleanFileUrl;
      if (!cleanFileUrl.startsWith('incidents/')) {
        finalUrl = cleanFileUrl;
      }
      
      const headUrl = `${this.baseUrl}/files/serve/${finalUrl}`;
      
      const response = await fetch(headUrl, {
        method: 'HEAD',
        headers: this.getAuthHeaders()
      });
      
      if (response.ok) {
        const contentLength = response.headers.get('Content-Length');
        return contentLength ? parseInt(contentLength, 10) : 0;
      }
      return 0;
    } catch (error) {
      console.error('Erreur lors de la récupération de la taille du fichier:', error);
      return 0;
    }
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return 'Taille inconnue';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône du type de fichier
   */
  getFileTypeIcon(fileType: string): string {
    const type = (fileType || "").toLowerCase();
    
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return '🗜️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('text')) return '📄';
    
    return '📎';
  }

  /**
   * Vérifier si un fichier peut être prévisualisé
   */
  canPreviewFile(fileType: string): boolean {
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json'
    ];
    
    return previewableTypes.includes((fileType || "").toLowerCase());
  }


  /**
   * Supprimer un fichier d'incident
   * POST /files/delete
   */
  async deleteIncidentFile(fileId: number): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log(`🗑️ Suppression du fichier ID: ${fileId}`);

      const response = await this.makeRequest<any>(
        `/files/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            datas: [
              {
                id: fileId
              }
            ]
          })
        }
      );

      console.log("🔄 Réponse de suppression:", response);

      // Gérer la structure de réponse { code: 200, message: { code: 200, message: "OPERATION SUCCESSFULLY" } }
      if (response.code === 200) {
        return {
          success: true,
          message: response.message?.message || 'Fichier supprimé avec succès'
        };
      }

      // Fallback si format différent
      return {
        success: false,
        message: response.message?.message || 'Erreur lors de la suppression du fichier'
      };

    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du fichier ${fileId}:`, error);
      const message = extractBackendMessage(error);
      return {
        success: false,
        message: 'Erreur lors de la suppression du fichier',
        error: message
      };
    }
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

export const incidentFilesService = new IncidentFilesService();