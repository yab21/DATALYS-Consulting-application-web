import { useCallback } from 'react';

/**
 * Hook pour sécuriser les uploads de fichiers
 */
export function useSecureUpload() {
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Configuration sécurisée
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_EXTENSIONS = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
      '.txt', '.rtf', '.csv',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp'
    ];
    const BLOCKED_EXTENSIONS = [
      '.exe', '.bat', '.cmd', '.com', '.scr', '.msi', '.dll',
      '.sh', '.bash', '.zsh', '.ps1', '.psm1', '.psd1',
      '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb',
      '.js', '.vbs', '.jar', '.class', '.app', '.deb', '.rpm'
    ];
    const BLOCKED_MIME_TYPES = [
      'application/x-executable',
      'application/x-msdownload', 
      'application/x-msdos-program',
      'application/x-php',
      'text/x-php',
      'application/x-sh',
      'text/x-script',
      'application/javascript',
      'text/javascript'
    ];

    // 1. Vérifier la taille
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)`
      };
    }

    // 2. Vérifier l'extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (BLOCKED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `🚫 Extension dangereuse interdite: ${extension}`
      };
    }

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Extension non autorisée: ${extension}. Extensions autorisées: ${ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // 3. Vérifier le type MIME
    if (BLOCKED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `🚫 Type de fichier dangereux détecté: ${file.type}`
      };
    }

    // 4. Vérifier les caractères suspects dans le nom
    if (file.name.includes('..') || file.name.includes('<') || file.name.includes('>')) {
      return {
        valid: false,
        error: `Nom de fichier contient des caractères suspects`
      };
    }

    // 5. Vérifier la longueur du nom
    if (file.name.length > 255) {
      return {
        valid: false,
        error: `Nom de fichier trop long (max: 255 caractères)`
      };
    }

    return { valid: true };
  }, []);

  const handleFileChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (file: File) => void,
    onError?: (error: string) => void
  ) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    const validation = validateFile(file);
    
    if (!validation.valid) {
      // Nettoyer l'input
      event.target.value = '';
      
      // Afficher l'erreur
      if (onError) {
        onError(validation.error!);
      } else {
        alert(validation.error);
      }
      return;
    }

    // Fichier valide
    onSuccess(file);
  }, [validateFile]);

  return {
    validateFile,
    handleFileChange,
    ALLOWED_EXTENSIONS: [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
      '.txt', '.rtf', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.bmp'
    ],
    MAX_SIZE: 5 * 1024 * 1024,
    ACCEPT_ATTRIBUTE: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.jpg,.jpeg,.png,.gif,.bmp'
  };
}