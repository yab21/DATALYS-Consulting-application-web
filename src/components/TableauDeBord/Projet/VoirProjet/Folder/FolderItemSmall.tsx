"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
  DropdownItem,
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import RenameModal from "../Common/RenameModal";
import MoveModal from "../Common/MoveModal";

interface FolderItemSmallProps {
  folder: {
    name: string;
    id: string;
    projectId: string;
    isPrivate?: boolean;
  };
  onClick: () => void;
  onFolderUpdated: () => void;
}

function FolderItemSmall({
  folder,
  onClick,
  onFolderUpdated,
}: FolderItemSmallProps) {
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  useEffect(() => {
    // Placeholder: Check user admin status
    // This would be replaced with actual authentication logic
    setIsUserAdmin(true); // Temporary - set to true for demo
  }, []);

  const handleRename = async (newName: string) => {
    try {
      // Placeholder: Rename folder logic
      console.log(`Renaming folder ${folder.name} to ${newName}`);
      onFolderUpdated();
    } catch (error) {
      console.error("Erreur lors du renommage du dossier:", error);
      throw new Error("Erreur lors du renommage du dossier");
    }
  };

  const handleMove = async (newParentId: string) => {
    try {
      // Placeholder: Move folder logic
      console.log(`Moving folder ${folder.name} to parent ${newParentId}`);
      onFolderUpdated();
    } catch (error) {
      console.error("Erreur lors du déplacement du dossier:", error);
      throw new Error("Erreur lors du déplacement du dossier");
    }
  };

  const handleDelete = async () => {
    try {
      // Placeholder: Delete folder logic
      console.log(`Deleting folder ${folder.name}`);
      onFolderUpdated();
      onDeleteModalClose();
    } catch (error) {
      console.error("Erreur lors de la suppression du dossier:", error);
      throw new Error("Erreur lors de la suppression du dossier");
    }
  };

  const togglePrivate = async () => {
    try {
      // Placeholder: Toggle private status logic
      console.log(`Toggling private status for folder ${folder.name}`);
      onFolderUpdated();
    } catch (error) {
      console.error("Erreur lors du changement de statut privé:", error);
      throw new Error("Erreur lors du changement de statut privé");
    }
  };

  return (
    <>
      <div
        className="flex cursor-pointer justify-between rounded-md p-2 hover:bg-gray-2 dark:hover:bg-dark-2"
        onClick={onClick}
      >
        <div className="flex items-center gap-1">
          <Image src="/images/folder.png" alt="folder" width={20} height={20} />
          <h1 className="text-dark dark:text-white">
            {folder.name}
            {folder.isPrivate && " 🔒"}
          </h1>
        </div>
        {isUserAdmin && (
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                radius="full"
                className="-p-3 flex items-center bg-white dark:bg-dark-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"
                  />
                </svg>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Folder Actions"
              className="bg-white text-dark dark:bg-dark-2 dark:text-white"
            >
              <DropdownItem
                key="renommer"
                onPress={() => setShowRenameModal(true)}
              >
                Renommer
              </DropdownItem>
              <DropdownItem
                key="deplacer"
                onPress={() => setShowMoveModal(true)}
              >
                Déplacer
              </DropdownItem>
              <DropdownItem key="supprimer" onPress={onDeleteModalOpen}>
                Supprimer
              </DropdownItem>
              <DropdownItem key="prive" onPress={togglePrivate}>
                {folder.isPrivate ? "Rendre public" : "Rendre privé"}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </div>

      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={handleRename}
        currentName={folder.name}
        itemType="folder"
      />

      <MoveModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={handleMove}
        currentParentId={folder.projectId}
        projectId={folder.projectId}
        itemType="folder"
        currentItemId={folder.id}
        itemName={folder.name}
      />

      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalBody>
            <p>
              Êtes-vous sûr de vouloir supprimer le dossier "{folder.name}" ?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={handleDelete}>
              Supprimer
            </Button>
            <Button
              color="primary"
              variant="light"
              onPress={onDeleteModalClose}
            >
              Annuler
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default FolderItemSmall;
