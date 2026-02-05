"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Divider,
} from "@heroui/react";
import { Save, Mail, User, Edit, Eye, EyeOff } from "lucide-react";
import { UsersService } from "@/services/users";
import { useAuth } from "@/hooks/useAuth";
import { extractBackendMessage } from "@/lib/error-handler";

interface UserData {
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface ModifierProfilProps {
  userData: UserData;
  onClose: () => void;
  onUpdate: () => void;
  onCancel?: () => void;
}

interface EditFormData {
  name: string;
  email: string;
  password?: string;
}

const ModifierProfil: React.FC<ModifierProfilProps> = ({
  userData,
  onClose,
  onUpdate,
}) => {
  const { user: currentUser, updateUser } = useAuth();
  
  // États pour le formulaire de modification
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    password: ''
  });
  
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Initialiser le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name,
        email: userData.email,
        password: ''
      });
    }
  }, [userData]);

  // Gestion des changements dans le formulaire
  const handleEditFormChange = (field: keyof EditFormData, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur modifie le formulaire
    if (error) setError(null);
  };

  // Fonction pour modifier le profil
  const handleEditSubmit = async () => {
    if (!currentUser) return;

    setEditLoading(true);
    setError(null);
    
    try {
      const updateData: any = {
        id: currentUser.id,
        name: editForm.name,
        email: editForm.email,
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const result = await UsersService.updateUser(updateData);
      
      if (result.code === 200 || result.status === 'success') {
        // Mettre à jour les données utilisateur localement
        const updatedData: any = {
          name: editForm.name,
          email: editForm.email,
        };
        
        // Ajouter le mot de passe si modifié
        if (editForm.password && editForm.password.trim()) {
          updatedData.password = editForm.password;
        }
        
        updateUser(updatedData);
        
        // Appeler onUpdate pour que le composant parent se rafraîchisse
        onUpdate();
        onClose();
      } else {
        const errorMessage = extractBackendMessage(result) || result.message || 'Erreur lors de la modification';
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = extractBackendMessage(error) || 'Une erreur est survenue lors de la modification du profil';
      setError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Validation du formulaire
  const isFormValid = () => {
    return editForm.name.trim() && editForm.email.trim();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
      isDismissable={!editLoading}
      classNames={{
        base: "bg-white dark:bg-gray-900 max-h-[90vh]",
        wrapper: "z-[100000]",
        backdrop: "z-[99998] bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-4">
          <h3 className="text-xl font-bold">Modifier le profil</h3>
        </ModalHeader>
        
        <ModalBody className="px-6 py-4">
          <div className="space-y-4">
            {/* Affichage des erreurs */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Informations personnelles */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Informations personnelles</h4>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Nom complet"
                  placeholder="Votre nom complet"
                  value={editForm.name}
                  onValueChange={(value) => handleEditFormChange('name', value)}
                  isRequired
                  startContent={<User className="h-4 w-4 text-gray-400" />}
                />

                <Input
                  label="Email"
                  placeholder="votre@email.com"
                  type="email"
                  value={editForm.email}
                  onValueChange={(value) => handleEditFormChange('email', value)}
                  isRequired
                  startContent={<Mail className="h-4 w-4 text-gray-400" />}
                />
              </div>
              
              <div className="mt-4">
                <Input
                  label="Nouveau mot de passe"
                  placeholder="Laisser vide pour conserver l'ancien mot de passe"
                  type={isPasswordVisible ? "text" : "password"}
                  value={editForm.password || ''}
                  onValueChange={(value) => handleEditFormChange('password', value)}
                  description="Optionnel - Laisser vide pour ne pas modifier le mot de passe"
                  endContent={
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="focus:outline-none"
                      aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  }
                />
              </div>
            </div>

            <Divider />

            {/* Informations de rôle (lecture seule) */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Rôle et permissions</h4>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-[#4ba9b7]" />
                  <span className="font-medium text-gray-900">Administrateur</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Accès complet aux fonctionnalités d'administration
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            variant="flat" 
            onPress={onClose}
            isDisabled={editLoading}
          >
            Annuler
          </Button>
          <Button 
            color="primary" 
            onPress={handleEditSubmit}
            isLoading={editLoading}
            isDisabled={!isFormValid()}
            startContent={!editLoading ? <Save className="h-4 w-4" /> : undefined}
          >
            {editLoading ? 'Modification...' : 'Modifier'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModifierProfil;