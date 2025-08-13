"use client";
import React, { useState } from "react";
import {
  doc,
  getFirestore,
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { createNotification } from "@/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";

interface CreateFolderModalProps {
  onFolderCreated: () => void;
  parentFolderId: string | null;
  projectId: string;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  onFolderCreated,
  parentFolderId,
  projectId,
}) => {
  const [folderName, setFolderName] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFolder = async () => {
    try {
      setLoading(true);
      setError(null);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("Utilisateur non connecté");
        return;
      }

      console.log("Création du dossier...", {
        folderName,
        parentFolderId,
        projectId,
        userId: currentUser.uid,
      });

      // Créer le dossier
      const newFolderRef = await addDoc(collection(getFirestore(), "Folders"), {
        name: folderName,
        parentFolderId: parentFolderId,
        projectId: projectId,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
      });

      console.log("Dossier créé avec succès, ID:", newFolderRef.id);

      // Récupérer les informations du projet
      const projectDoc = await getDoc(
        doc(getFirestore(), "projects", projectId),
      );
      const projectData = projectDoc.data();

      if (projectData) {
        console.log("Données du projet récupérées:", projectData);

        // Notifier les administrateurs
        const adminsSnapshot = await getDocs(
          query(
            collection(getFirestore(), "users"),
            where("isAdmin", "==", true),
          ),
        );

        console.log("Nombre d'administrateurs trouvés:", adminsSnapshot.size);

        // Notifier les administrateurs
        for (const adminDoc of adminsSnapshot.docs) {
          try {
            console.log("Envoi de notification à l'admin:", adminDoc.id);
            await createNotification(
              adminDoc.id,
              {
                title: "Nouveau dossier créé",
                body: `avez créé un nouveau dossier "${folderName}" dans le projet "${projectData.intitule}"`,
                link: `/tableaudebord/projet/pageprojet/${projectId}`,
              },
              currentUser.uid,
            );
            console.log(
              "Notification envoyée avec succès à l'admin:",
              adminDoc.id,
            );
          } catch (error) {
            console.error(
              "Erreur lors de l'envoi de la notification à l'admin:",
              adminDoc.id,
              error,
            );
          }
        }

        // Notifier les utilisateurs autorisés
        if (projectData.authorizedUsers) {
          console.log("Utilisateurs autorisés:", projectData.authorizedUsers);

          for (const userId of projectData.authorizedUsers) {
            if (userId !== currentUser.uid) {
              // Ne pas notifier l'utilisateur qui crée le dossier
              try {
                console.log("Envoi de notification à l'utilisateur:", userId);
                await createNotification(
                  userId,
                  {
                    title: "Nouveau dossier disponible",
                    body: `avez créé un nouveau dossier "${folderName}" dans le projet "${projectData.intitule}"`,
                    link: `/tableaudebord/projet/pageprojet/${projectId}`,
                  },
                  currentUser.uid,
                );
                console.log(
                  "Notification envoyée avec succès à l'utilisateur:",
                  userId,
                );
              } catch (error) {
                console.error(
                  "Erreur lors de l'envoi de la notification à l'utilisateur:",
                  userId,
                  error,
                );
              }
            }
          }
        }
      }

      setFolderName("");
      onClose();
      onFolderCreated();
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
      setError("Erreur lors de la création du dossier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="md" onPress={onOpen} isDisabled={loading}>
        Créer un dossier
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Créer un nouveau dossier</ModalHeader>
          <ModalBody>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <input
              type="text"
              placeholder="Nom du dossier"
              className="w-full rounded-md border-[1px] p-2 outline-none"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
              isDisabled={loading}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateFolder}
              isLoading={loading}
            >
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateFolderModal;
