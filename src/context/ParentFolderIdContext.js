"use client"; // Ajoute cette ligne pour définir le fichier comme composant client
import React, { createContext, useState } from "react";

// Création du contexte ParentFolderId
export const ParentFolderIdContext = createContext(null);

// Provider pour ParentFolderId
export const ParentFolderIdProvider = ({ children }) => {
  const [parentFolderId, setParentFolderId] = useState(null); // Définit l'état du dossier parent

  return (
    <ParentFolderIdContext.Provider value={{ parentFolderId, setParentFolderId }}>
      {children}
    </ParentFolderIdContext.Provider>
  );
};
