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
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import {
  User,
  Mail,
  Lock,
  Shield,
  Users,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { UsersService, CreateUserData } from "@/services/users";
import { extractBackendMessage } from "@/lib/error-handler";

// Types pour le formulaire
interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role_name: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role_name?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const { user } = useAuth();
  const { showNotification } = useSimpleNotifications();

  // États du formulaire
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});


  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.role_name) {
      newErrors.role_name = "Le rôle est requis";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      showNotification({
        type: "error",
        title: "Erreur",
        message: "Utilisateur non connecté"
      });
      return;
    }

    try {
      setLoading(true);

      const userData: CreateUserData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role_name: formData.role_name,
        is_active: true,
      };

      const result = await UsersService.createUser(userData, user.id);

      showNotification({
        type: "success",
        title: "Succès",
        message: extractBackendMessage(result) || result?.message || "Opération réussie"
      });

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role_name: "",
      });
      setErrors({});

      // Fermer le modal et rafraîchir la liste
      onClose();
      onUserCreated();

    } catch (error: any) {
      const errorMessage = extractBackendMessage(error);

      showNotification({
        type: "error",
        title: "Erreur",
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des champs
  const handleInputChange = (field: keyof UserFormData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Rôles disponibles
  const availableRoles = [
    { key: "admin", label: "Administrateur", icon: <Shield className="w-4 h-4" /> },
    { key: "partner", label: "Partenaire", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Créer un Nouvel Utilisateur</h3>
              </div>
            </ModalHeader>
            
            <ModalBody>
              <div className="space-y-6">
                {/* Section Informations Personnelles */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-[#4ba9b7]" />
                    <h4 className="text-lg font-semibold text-gray-800">Informations Personnelles</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nom complet"
                      placeholder="Nom de l'utilisateur"
                     
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      startContent={<User className="w-4 h-4 text-gray-400" />}
                      isRequired
                      isInvalid={!!errors.name}
                      errorMessage={errors.name}
                    />
                    
                    <Input
                      label="Adresse email"
                      placeholder="email@exemple.com"
                      type="email"
                     
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      startContent={<Mail className="w-4 h-4 text-gray-400" />}
                      isRequired
                      isInvalid={!!errors.email}
                      errorMessage={errors.email}
                    />
                  </div>
                </div>

                <Divider />

                {/* Section Sécurité */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-[#4ba9b7]" />
                    <h4 className="text-lg font-semibold text-gray-800">Sécurité</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Mot de passe"
                      placeholder="Mot de passe sécurisé"
                      type={showPassword ? "text" : "password"}
                     
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      startContent={<Lock className="w-4 h-4 text-gray-400" />}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      }
                      isRequired
                      isInvalid={!!errors.password}
                      errorMessage={errors.password}
                    />
                    
                    <Input
                      label="Confirmer le mot de passe"
                      placeholder="Répéter le mot de passe"
                      type={showConfirmPassword ? "text" : "password"}
                     
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      startContent={<Lock className="w-4 h-4 text-gray-400" />}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      }
                      isRequired
                      isInvalid={!!errors.confirmPassword}
                      errorMessage={errors.confirmPassword}
                    />
                  </div>
                </div>

                <Divider />

                {/* Section Rôle et Permissions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-[#4ba9b7]" />
                    <h4 className="text-lg font-semibold text-gray-800">Rôle et Permissions</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Rôle utilisateur"
                      placeholder="Sélectionner un rôle"
                      selectedKeys={formData.role_name ? [formData.role_name] : []}
                      onSelectionChange={(keys) => {
                        const role = Array.from(keys)[0] as string;
                        handleInputChange("role_name", role);
                      }}
                      isRequired
                      isInvalid={!!errors.role_name}
                      errorMessage={errors.role_name}
                    >
                      {availableRoles.map((role) => (
                        <SelectItem key={role.key} startContent={role.icon}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </Select>
                    
                  </div>
                </div>
              </div>
            </ModalBody>
            
            <ModalFooter>
              <Button 
                variant="light" 
                onPress={onClose}
                isDisabled={loading}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={loading}
                isDisabled={loading}
                startContent={!loading && <UserPlus className="w-4 h-4" />}
              >
                {loading ? "Création..." : "Créer l'utilisateur"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateUserModal;