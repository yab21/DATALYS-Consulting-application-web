import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (newParentId: string) => Promise<void>;
  currentParentId: string;
  projectId: string;
  itemType: 'folder' | 'file';
  currentItemId: string;
  itemName: string;
}

interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
}

const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  onMove,
  currentParentId,
  projectId,
  itemType,
  currentItemId,
  itemName
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(currentParentId);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        // Données de démonstration pour remplacer Firebase
        const mockFolders: Folder[] = [
          { id: projectId, name: "Root", parentFolderId: null },
          { id: "folder1", name: "Documents", parentFolderId: projectId },
          { id: "folder2", name: "Images", parentFolderId: projectId },
          { id: "folder3", name: "Archives", parentFolderId: projectId },
          { id: "subfolder1", name: "Contrats", parentFolderId: "folder1" },
          { id: "subfolder2", name: "Rapports", parentFolderId: "folder1" },
        ];

        // Exclure le dossier actuel et ses sous-dossiers si c'est un dossier qu'on déplace
        const getSubFolderIds = (folderId: string, accumulator = new Set<string>()): Set<string> => {
          accumulator.add(folderId);
          mockFolders
            .filter(folder => folder.parentFolderId === folderId)
            .forEach(subFolder => getSubFolderIds(subFolder.id, accumulator));
          return accumulator;
        };

        const excludedIds = currentItemId ? getSubFolderIds(currentItemId) : new Set<string>();
        const availableFolders = mockFolders.filter(folder => !excludedIds.has(folder.id));

        setFolders(availableFolders);
        
        if (currentParentId && availableFolders.some(f => f.id === currentParentId)) {
          setSelectedFolder(currentParentId);
        } else {
          setSelectedFolder(projectId);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des dossiers:", error);
        setError("Erreur lors de la récupération des dossiers");
      }
    };

    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen, projectId, currentItemId, currentParentId]);

  const handleMove = async () => {
    try {
      setError(null);
      setLoading(true);
      await onMove(selectedFolder);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (keys: any) => {
    const selected = Array.from(keys as Set<string>)[0];
    if (selected) {
      setSelectedFolder(selected);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="!text-gray-900 dark:!text-gray-100">
              Déplacer {itemType === 'folder' ? 'le dossier' : 'le fichier'} {itemName}
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="text-red-500 mb-4">
                  {error}
                </div>
              )}
              <Select
                label="Sélectionner le dossier de destination"
                selectedKeys={new Set([selectedFolder])}
                onSelectionChange={handleSelectionChange}
                className="w-full"
                classNames={{
                  label: "!text-gray-900 dark:!text-gray-100 !font-medium",
                  value: "!text-gray-900 dark:!text-gray-100",
                  trigger: "!border-gray-300 dark:!border-gray-600"
                }}
              >
                {folders.map((folder) => (
                  <SelectItem key={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Annuler
              </Button>
              <Button 
                color="primary" 
                onPress={handleMove}
                isLoading={loading}
              >
                Déplacer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MoveModal;