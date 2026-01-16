/**
 * SÉCURISATION IMMÉDIATE DES UPLOADS
 * À appliquer dans TOUS les composants d'upload dès maintenant
 */

// Extensions STRICTEMENT INTERDITES
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.msi', '.dll',
  '.sh', '.bash', '.zsh', '.ps1', '.psm1', '.psd1',
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb',
  '.js', '.vbs', '.jar', '.class', '.app', '.deb', '.rpm'
];

// Types MIME dangereux
const BLOCKED_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-php',
  'text/x-php',
  'application/x-sh',
  'text/x-script',
  'application/javascript',
  'text/javascript',
  'application/x-java-archive'
];

// Limite stricte de taille (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Extensions autorisées SEULEMENT
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.rtf', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
  '.zip', '.rar' // À scanner obligatoirement
];

/**
 * Validation immédiate et stricte des fichiers
 */
export function validateFileImmediately(file: File): { valid: boolean; error?: string } {
  // 1. Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
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
      error: `Extension interdite pour sécurité: ${extension}` 
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: `Extension non autorisée: ${extension}` 
    };
  }

  // 3. Vérifier le type MIME
  if (BLOCKED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier dangereux détecté: ${file.type}` 
    };
  }

  // 4. Vérifier les caractères suspects dans le nom
  if (file.name.includes('..') || file.name.includes('<') || file.name.includes('>')) {
    return { 
      valid: false, 
      error: `Nom de fichier contient des caractères suspects` 
    };
  }

  // 5. Vérifier si le nom est trop long
  if (file.name.length > 255) {
    return { 
      valid: false, 
      error: `Nom de fichier trop long (max: 255 caractères)` 
    };
  }

  return { valid: true };
}

/**
 * Nettoyer le nom de fichier
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

/**
 * Hook React pour validation des uploads
 */
export function useSecureFileUpload() {
  return {
    validateFile: validateFileImmediately,
    sanitizeFileName,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS
  };
}