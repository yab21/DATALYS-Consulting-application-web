import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@nextui-org/react";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  currentName: string;
  itemType: 'folder' | 'file';
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  currentName,
  itemType,
}) => {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRename = async () => {
    try {
      setError(null);
      setLoading(true);
      await onRename(newName);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="!text-gray-900 dark:!text-gray-100">Renommer {itemType === 'folder' ? 'le dossier' : 'le fichier'}</ModalHeader>
        <ModalBody>
          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}
          <Input
            label="Nouveau nom"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            variant="bordered"
            classNames={{
              label: "!text-gray-900 dark:!text-gray-100 !font-medium",
              input: "!text-gray-900 dark:!text-gray-100",
              inputWrapper: "!border-gray-300 dark:!border-gray-600"
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Annuler
          </Button>
          <Button 
            color="primary" 
            onPress={handleRename}
            isLoading={loading}
          >
            Renommer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RenameModal; 