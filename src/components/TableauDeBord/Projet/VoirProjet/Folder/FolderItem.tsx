import Image from "next/image";
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  CardFooter,
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
  ModalFooter
} from "@heroui/react";
import RenameModal from "../Common/RenameModal";
import MoveModal from "../Common/MoveModal";

interface FolderItemProps {
  folder: {
    name: string;
    id: string;
    projectId: string;
    isPrivate?: boolean;
  };
  onClick: () => void;
  onFolderUpdated: () => void;
}

function FolderItem({ folder, onClick, onFolderUpdated }: FolderItemProps) {
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

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
      console.log(`Deleting folder ${folder.name} recursively`);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));

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
      <Card
        isPressable
        onPress={onClick}
        className="relavtive m-2 h-[200px] w-[200px] bg-white dark:bg-dark-2"
      >
        <CardBody className="flex items-center justify-center">
          <Image src="/images/folder.png" alt="folder" width={100} height={100} />
        </CardBody>
        <CardFooter className="justify-center">
          <p className="text-center text-small text-dark dark:text-white">
            {folder.name}
            {folder.isPrivate && " 🔒"}
          </p>
        </CardFooter>
        {isUserAdmin && (
          <Dropdown className="relative">
            <DropdownTrigger className="absolute right-0 top-0">
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
              <DropdownItem key="renommer" onPress={() => setShowRenameModal(true)}>
                Renommer
              </DropdownItem>
              <DropdownItem key="deplacer" onPress={() => setShowMoveModal(true)}>
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
      </Card>

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
            <p>Êtes-vous sûr de vouloir supprimer le dossier "{folder.name}" ?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={handleDelete}>
              Supprimer
            </Button>
            <Button color="primary" variant="light" onPress={onDeleteModalClose}>
              Annuler
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default FolderItem;
