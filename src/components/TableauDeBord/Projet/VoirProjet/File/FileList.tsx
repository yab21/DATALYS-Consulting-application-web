import React, { useState, useEffect } from "react";
import FileItem from "@/components/TableauDeBord/Projet/VoirProjet/File/FileItem";

interface FileListProps {
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    modifiedAt: number;
    imageUrl: string;
    projectId: string;
    isPrivate?: boolean;
  }>;
  onFileDeleted: () => void;
}

const FileList: React.FC<FileListProps> = ({ files, onFileDeleted }) => {
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder: Check user admin status
    // This would be replaced with actual authentication logic
    setUserId("temp-user-id"); // Temporary placeholder
    setIsUserAdmin(true); // Temporary - set to true for demo
  }, []);

  // Filtrer les fichiers en fonction des autorisations
  const filteredFiles = files.filter((file) => {
    // Les administrateurs peuvent voir tous les fichiers
    if (isUserAdmin) return true;

    // Les utilisateurs non-admin ne peuvent pas voir les fichiers privés
    if (file.isPrivate) return false;

    return true;
  });

  return (
    <div>
      {/* En-tête du tableau */}
      <div className="mb-2 grid grid-cols-4 overflow-x-scroll rounded-md p-3 text-xs font-normal scrollbar-hide md:text-base">
        <div className="text-dark dark:text-white">Nom du fichier</div>
        <div className="text-dark dark:text-white">Date d'ajout</div>
        <div className="text-dark dark:text-white">Taille</div>
        <div className="text-dark dark:text-white">Action</div>
      </div>

      {/* Liste des fichiers */}
      {filteredFiles.length > 0 ? (
        filteredFiles.map((file) => (
          <FileItem key={file.id} file={file} onFileDeleted={onFileDeleted} />
        ))
      ) : (
        <div className="p-4 text-center text-gray-500">
          Aucun fichier disponible
        </div>
      )}
    </div>
  );
};

export default FileList;
