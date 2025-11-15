// Utilitaire pour nettoyer complètement les logs en production
export const cleanConsoleMethods = () => {
  if (process.env.NODE_ENV === 'production') {
    // Supprimer toutes les méthodes de console sauf error et warn
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Vider toutes les autres méthodes
    Object.keys(console).forEach((key) => {
      if (key !== 'error' && key !== 'warn') {
        (console as any)[key] = () => {};
      }
    });
    
    // Restaurer error et warn mais les filtrer
    console.error = (...args: any[]) => {
      // Ne garder que les erreurs critiques
      const message = args.join(' ');
      if (message.includes('Script error') || 
          message.includes('Network Error') ||
          message.includes('ChunkLoadError')) {
        originalError(...args);
      }
    };
    
    console.warn = (...args: any[]) => {
      // Filtrer les warnings non critiques
      const message = args.join(' ');
      if (!message.includes('React DevTools') && 
          !message.includes('findDOMNode')) {
        originalWarn(...args);
      }
    };
  }
};

// Auto-exécution en production
if (typeof window !== 'undefined') {
  cleanConsoleMethods();
}