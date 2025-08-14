"use client";
import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
} from "@nextui-org/react";

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

      console.log("Création du dossier...", {
        folderName,
        parentFolderId,
        projectId,
      });

      // Placeholder: Create folder logic
      // This would be replaced with actual folder creation API call
      console.log(`Creating folder: ${folderName}`);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      <Button 
        size="md" 
        onPress={onOpen} 
        isDisabled={loading}
        className="bg-gradient-to-r from-[#06B6D4] to-teal-600 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-600 hover:to-teal-700 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
        startContent={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
      >
        📁 Créer un dossier
      </Button>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="lg"
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[85vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "z-[9999]",
        }}
      >
        <ModalContent className="border border-gray-200 dark:border-gray-700">
          <ModalHeader className="relative overflow-hidden border-b border-gray-200/50 pb-6 pt-8 dark:border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50 dark:from-cyan-900/20 dark:via-teal-900/20 dark:to-cyan-900/20"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06B6D4] to-teal-600 shadow-xl shadow-cyan-500/25">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  📁 Nouveau Dossier
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Organisez vos fichiers avec un nouveau dossier
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-8 py-6">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-800">
                <Input
                  variant="bordered"
                  size="lg"
                  label="Nom du dossier"
                  placeholder="Ex: Documents, Images, Archives..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  startContent={
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v2z" />
                    </svg>
                  }
                  classNames={{
                    label: "text-gray-900 dark:text-white font-semibold text-base",
                    input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium text-base",
                    inputWrapper:
                      "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-[#06B6D4] dark:hover:border-cyan-500 focus-within:border-[#06B6D4] dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300",
                  }}
                />
              </div>
              <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 p-6">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#06B6D4] mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Conseils</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Utilisez des noms descriptifs et courts</li>
                      <li>• Évitez les caractères spéciaux</li>
                      <li>• Le dossier sera créé dans le répertoire courant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200/50 pt-6 pb-8 dark:border-gray-700/50">
            <div className="flex gap-4 w-full">
              <Button
                variant="bordered"
                onPress={onClose}
                isDisabled={loading}
                className="flex-1 border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white text-gray-700 font-semibold shadow-lg transition-all duration-300 hover:border-gray-400 hover:from-gray-100 hover:to-gray-50 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300"
                startContent={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleCreateFolder}
                isLoading={loading}
                isDisabled={!folderName.trim()}
                className="flex-1 bg-gradient-to-r from-[#06B6D4] to-teal-600 text-white font-bold shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-600 hover:to-teal-700 hover:shadow-cyan-500/40 hover:-translate-y-1"
                startContent={
                  !loading && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )
                }
              >
                {loading ? "Création..." : "🚀 Créer le dossier"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateFolderModal;
