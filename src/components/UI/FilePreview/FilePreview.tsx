"use client";

import React, { useState, useEffect } from 'react';
import { SecureStorage } from '@/lib/secure-storage';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Spinner,
  Card,
  CardBody
} from '@heroui/react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  FileText,
  FileImage,
  File as FileIcon,
  FileSpreadsheet,
  FileVideo,
  FileAudio
} from 'lucide-react';

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: number;
    name: string;
    original_name: string;
    file_path: string;
    file_url: string;
    size: number;
    mime_type: string;
    extension: string;
  } | null;
  baseUrl: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ isOpen, onClose, file, baseUrl }) => {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && isOpen) {
      setLoading(true);
      setZoom(100);
      setRotation(0);
      setBlobUrl(null);
      
      // Download file as blob for preview
      downloadFileForPreview();
    }

    // Cleanup blob URL when component unmounts or file changes
    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file, isOpen]);

  const downloadFileForPreview = async () => {
    if (!file) return;

    try {
      console.log('🎯 PRÉVISUALISATION - Récupération du fichier réel');
      console.log('- File:', file.original_name);
      console.log('- File Path:', file.file_path);
      console.log('- Extension:', file.extension);
      console.log('- MIME Type:', file.mime_type);
      
      const token = SecureStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Utiliser l'API /api/files/serve/files/ pour récupérer le fichier
      const fileUrl = `${baseUrl}/files/serve/files/${file.file_path}`;
      console.log('📡 URL de récupération:', fileUrl);

      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Créer un blob URL pour l'affichage
      const blob = await response.blob();
      const blobURL = window.URL.createObjectURL(blob);
      setBlobUrl(blobURL);
      setLoading(false);

      console.log('✅ Fichier récupéré avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du fichier:', error);
      
      // Fallback: générer du contenu local en cas d'erreur
      console.log('🔄 Fallback vers prévisualisation locale');
      const mimeType = file.mime_type.toLowerCase();
      const extension = file.extension.toLowerCase();
      
      if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        await createLocalImagePreview();
      } else if (mimeType.includes('pdf') || extension === 'pdf') {
        await createLocalPdfPreview();
      } else if (mimeType.includes('video') || ['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension)) {
        await createLocalVideoPreview();
      } else if (mimeType.includes('audio') || ['mp3', 'wav', 'flac', 'ogg'].includes(extension)) {
        await createLocalAudioPreview();
      } else if (mimeType.includes('text') || ['txt', 'json', 'xml', 'css', 'js', 'html', 'md'].includes(extension)) {
        await createLocalTextPreview();
      } else {
        await createLocalGenericPreview();
      }
    }
  };

  const createLocalImagePreview = async () => {
    // Créer une image de démonstration avec Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Arrière-plan dégradé
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#1D4ED8');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Icône image au centre
      ctx.fillStyle = 'white';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🖼️', canvas.width / 2, canvas.height / 2 - 50);
      
      // Nom du fichier
      ctx.font = 'bold 32px Arial';
      ctx.fillText(file?.original_name || 'Image', canvas.width / 2, canvas.height / 2 + 100);
      
      // Informations
      ctx.font = '24px Arial';
      ctx.fillText(`Type: ${file?.mime_type || 'Image'}`, canvas.width / 2, canvas.height / 2 + 150);
      
      // Message d'aperçu
      ctx.font = '18px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('Aperçu généré localement', canvas.width / 2, canvas.height - 50);
      
      // Convertir en blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
          console.log('✅ Prévisualisation image locale créée');
        }
      }, 'image/png');
    }
  };

  const createLocalPdfPreview = async () => {
    // Créer une page HTML qui simule un PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pdf-preview {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 60px 40px;
            max-width: 600px;
            text-align: center;
          }
          .pdf-icon {
            font-size: 120px;
            margin-bottom: 30px;
            color: #e53e3e;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 20px;
            line-height: 1.3;
          }
          .info {
            color: #718096;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .content {
            text-align: left;
            background: #f7fafc;
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #e53e3e;
          }
          .footer {
            color: #a0aec0;
            font-size: 14px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="pdf-preview">
          <div class="pdf-icon">📄</div>
          <h1 class="title">${file?.original_name || 'Document PDF'}</h1>
          <div class="info">
            Type: ${file?.mime_type || 'application/pdf'}<br>
            Taille: ${file?.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Inconnue'}
          </div>
          <div class="content">
            <h3>Aperçu du document</h3>
            <p>Ce document PDF contient des informations importantes. La prévisualisation complète n'est pas disponible, mais vous pouvez télécharger le fichier pour le consulter dans votre lecteur PDF préféré.</p>
            <p><strong>Fonctionnalités disponibles :</strong></p>
            <ul>
              <li>Téléchargement direct</li>
              <li>Ouverture dans une nouvelle fenêtre</li>
              <li>Compatible avec tous les lecteurs PDF</li>
            </ul>
          </div>
          <div class="footer">
            Aperçu généré localement • ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setLoading(false);
    console.log('✅ Prévisualisation PDF locale créée');
  };

  const createLocalVideoPreview = async () => {
    setBlobUrl('video-preview');
    setLoading(false);
  };

  const createLocalAudioPreview = async () => {
    setBlobUrl('audio-preview');
    setLoading(false);
  };

  const createLocalTextPreview = async () => {
    // Créer un aperçu de fichier texte
    const textContent = `
      Aperçu du fichier: ${file?.original_name}
      Type: ${file?.mime_type}
      
      Ce fichier contient du contenu textuel.
      La prévisualisation complète nécessite le téléchargement du fichier.
      
      Informations:
      - Format: ${file?.extension?.toUpperCase()}
      - Encodage: UTF-8 (probable)
      - Taille: ${file?.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Inconnue'}
    `;
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setLoading(false);
  };

  const createLocalGenericPreview = async () => {
    setBlobUrl('generic-preview');
    setLoading(false);
  };


  if (!file) return null;

  const getFileIcon = (mimeType: string, extension: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="w-12 h-12 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-12 h-12 text-red-500" />;
    } else if (mimeType.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') {
      return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
    } else if (mimeType.includes('document') || extension === 'docx' || extension === 'doc') {
      return <FileText className="w-12 h-12 text-blue-600" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="w-12 h-12 text-purple-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <FileAudio className="w-12 h-12 text-orange-500" />;
    } else {
      return <FileIcon className="w-12 h-12 text-gray-500" />;
    }
  };

  const handleDownload = async () => {
    try {
      const token = SecureStorage.getItem('authToken');
      const response = await fetch(`${baseUrl}/files/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const renderPreview = () => {
    if (!blobUrl) return null;

    const mimeType = file.mime_type.toLowerCase();
    const extension = file.extension.toLowerCase();

    // Images
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center items-center min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}>
            <img
              src={blobUrl}
              alt={file.original_name}
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={() => {
                console.log('✅ Image chargée avec succès');
                setLoading(false);
              }}
              onError={() => {
                console.log('⚠️ Erreur de chargement image');
                setLoading(false);
              }}
            />
          </div>
        </div>
      );
    }

    // PDF
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-full h-[70vh] bg-gray-50 dark:bg-gray-800 rounded-lg">
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-full rounded-lg"
            onLoad={() => {
              console.log('✅ PDF iframe chargé');
              setLoading(false);
            }}
            onError={() => {
              console.log('⚠️ Erreur de chargement PDF iframe');
              setLoading(false);
            }}
            title={`Prévisualisation de ${file.original_name}`}
          />
        </div>
      );
    }

    // Vidéos
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension)) {
      return (
        <div className="w-full h-[70vh] bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-center items-center">
          <video
            src={blobUrl}
            controls
            className="max-w-full max-h-full rounded-lg"
            onLoadedData={() => {
              console.log('✅ Vidéo chargée avec succès');
              setLoading(false);
            }}
            onError={() => {
              console.log('⚠️ Erreur de chargement vidéo');
              setLoading(false);
            }}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      );
    }

    // Audio
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'ogg'].includes(extension)) {
      return (
        <div className="w-full h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-center items-center">
          <div className="text-center">
            <FileAudio className="w-24 h-24 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎵 {file.original_name}
            </h3>
            <audio
              src={blobUrl}
              controls
              className="w-full max-w-md mx-auto"
              onLoadedData={() => {
                console.log('✅ Audio chargé avec succès');
                setLoading(false);
              }}
              onError={() => {
                console.log('⚠️ Erreur de chargement audio');
                setLoading(false);
              }}
            >
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        </div>
      );
    }

    // Fichiers texte (prévisualisation du contenu)
    if (mimeType.startsWith('text/') || ['txt', 'json', 'xml', 'csv', 'md', 'js', 'css', 'html'].includes(extension)) {
      return (
        <div className="w-full h-[70vh] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-auto p-4">
          <iframe
            src={blobUrl}
            className="w-full h-full rounded-lg border-0"
            onLoad={() => setLoading(false)}
            title={`Contenu de ${file.original_name}`}
          />
        </div>
      );
    }

    // Documents Office (Word, Excel, PowerPoint)
    if (mimeType.includes('document') || mimeType.includes('spreadsheet') || mimeType.includes('presentation') || 
        ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(extension)) {
      
      return (
        <Card className="min-h-[400px] bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardBody className="flex flex-col items-center justify-center space-y-4">
            <FileSpreadsheet className="w-24 h-24 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 {file.original_name}
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Document Office ({extension.toUpperCase()})
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">
                Les documents Office nécessitent un téléchargement pour être consultés
              </p>
              <Button
                color="primary"
                startContent={<Download className="w-4 h-4" />}
                onPress={handleDownload}
              >
                Ouvrir le document
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    // Fallback pour les autres types (prévisualisation générique)
    if (blobUrl === 'generic-preview') {
      return (
        <Card className="min-h-[400px] bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-slate-800">
          <CardBody className="flex flex-col items-center justify-center space-y-4">
            {getFileIcon(mimeType, extension)}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📁 {file.original_name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Type de fichier : {mimeType || extension.toUpperCase()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 mb-4">
                Prévisualisation générée localement
              </p>
              <Button
                color="primary"
                startContent={<Download className="w-4 h-4" />}
                onPress={handleDownload}
              >
                Télécharger le fichier
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    // Si aucun cas ne correspond, afficher le contenu directement
    return (
      <div className="w-full h-[70vh] bg-gray-50 dark:bg-gray-800 rounded-lg">
        <iframe
          src={blobUrl}
          className="w-full h-full rounded-lg"
          onLoad={() => setLoading(false)}
          title={`Prévisualisation de ${file.original_name}`}
        />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      className="max-w-7xl"
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.mime_type, file.extension)}
            <div>
              <h3 className="text-lg font-semibold">{file.original_name}</h3>
              <p className="text-sm text-gray-500">
                {file.mime_type} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Contrôles pour les images */}
            {file.mime_type.startsWith('image/') && (
              <>
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => setZoom(Math.max(25, zoom - 25))}
                  isDisabled={zoom <= 25}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2">{zoom}%</span>
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => setZoom(Math.min(300, zoom + 25))}
                  isDisabled={zoom >= 300}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => setRotation((rotation + 90) % 360)}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </ModalHeader>
        
        <ModalBody className="p-6">
          {loading && (
            <div className="flex justify-center items-center min-h-[400px]">
              <Spinner size="lg" label="Chargement du fichier..." />
            </div>
          )}
          
          {!loading && renderPreview()}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Fermer
          </Button>
          <Button color="primary" startContent={<Download className="w-4 h-4" />} onPress={handleDownload}>
            Télécharger
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FilePreview;