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
  Avatar,
} from "@nextui-org/react";
import { useNotifications } from "@/context/NotificationContext";
import { User, Mail, Building, Users, Upload, X } from "lucide-react";

interface UserData {
  uid?: string;
  lastName: string;
  firstName: string;
  function: string;
  company: string;
  department: string;
  email: string;
  profileImage: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface ModifierProfilProps {
  userData: UserData;
  onClose: () => void;
  onUpdate: () => void;
  onCancel?: () => void;
}

const ModifierProfil: React.FC<ModifierProfilProps> = ({
  userData,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<Partial<UserData>>({
    lastName: userData.lastName || "",
    firstName: userData.firstName || "",
    function: userData.function || "",
    company: userData.company || "",
    department: userData.department || "",
    email: userData.email || "",
    profileImage: userData.profileImage || "",
  });

  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Simulation d'utilisateur connecté (remplace Firebase Auth)
    const mockUserId = userData.uid || `user-${Date.now()}`;
    setUserId(mockUserId);
  }, [userData.uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("FormData before update:", formData);
      console.log("User ID:", userId);

      if (!userId) {
        throw new Error("ID utilisateur manquant");
      }

      let updatedData = { ...formData };

      if (newProfileImage) {
        // Simulation d'upload d'image (remplace Firebase Storage)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockImageUrl = `/images/profiles/${userId}-${newProfileImage.name}`;
        updatedData.profileImage = mockImageUrl;
      }

      // Simulation de mise à jour du profil (remplace Firestore)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const finalUpdatedData = {
        ...updatedData,
        isAdmin: userData.isAdmin,
        createdAt: userData.createdAt,
        updatedAt: new Date(),
      };

      console.log("Profil mis à jour avec succès:", finalUpdatedData);
      
      addNotification({
        title: "Profil mis à jour",
        body: "Votre profil a été modifié avec succès",
        type: "success",
        priority: "medium",
        category: "user",
        read: false,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Une erreur est survenue lors de la mise à jour du profil";
      
      setError(errorMessage);
      
      addNotification({
        title: "Erreur de mise à jour",
        body: errorMessage,
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    }
  };

  return (
    <Modal
      isOpen={true}
      onOpenChange={onClose}
      placement="center"
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white dark:bg-gray-900 max-h-[90vh] mt-8",
        backdrop: "bg-black/50 backdrop-blur-sm",
        wrapper: "z-[9999]",
      }}
    >
      <ModalContent className="bg-white dark:bg-gray-900">
        {(onClose) => (
          <>
            <ModalHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                  <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Modifier le Profil
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mettez à jour vos informations personnelles et professionnelles
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-6">
              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span className="font-medium">Erreur:</span>
                  </div>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-8">
                {/* Photo de profil */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                  <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                    Photo de profil
                  </h4>
                  <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                    <Avatar
                      src={newProfileImage ? URL.createObjectURL(newProfileImage) : formData.profileImage || "/images/user.png"}
                      alt="Photo de profil"
                      className="h-24 w-24 border-4 border-gray-200 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      <label className="block">
                        <div className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-sky-400 hover:bg-sky-50 dark:border-gray-600 dark:hover:border-sky-500 dark:hover:bg-sky-900/10">
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cliquez pour changer la photo
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG ou GIF (max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informations personnelles */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                  <div className="mb-4 flex items-center gap-3">
                    <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      Informations personnelles
                    </h4>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Prénom *
                      </label>
                      <Input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Entrez votre prénom"
                        variant="bordered"
                        size="lg"
                        classNames={{
                          input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Nom *
                      </label>
                      <Input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Entrez votre nom"
                        variant="bordered"
                        size="lg"
                        classNames={{
                          input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-3 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Adresse email *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="exemple@email.com"
                        variant="bordered"
                        size="lg"
                        startContent={<Mail className="h-4 w-4 text-gray-400" />}
                        classNames={{
                          input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                  <div className="mb-4 flex items-center gap-3">
                    <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      Informations professionnelles
                    </h4>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Fonction
                      </label>
                      <Input
                        type="text"
                        name="function"
                        value={formData.function}
                        onChange={handleChange}
                        placeholder="Ex: Développeur Full Stack"
                        variant="bordered"
                        size="lg"
                        classNames={{
                          input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Entreprise
                      </label>
                      <Input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Ex: DATALYS Consulting"
                        variant="bordered"
                        size="lg"
                        startContent={<Building className="h-4 w-4 text-gray-400" />}
                        classNames={{
                          input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-3 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Département
                      </label>
                      <Input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Ex: Département IT"
                        variant="bordered"
                        size="lg"
                        startContent={<Users className="h-4 w-4 text-gray-400" />}
                        classNames={{
                          input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Button
                variant="flat"
                onPress={onClose}
                size="lg"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                size="lg"
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-lg"
              >
                Enregistrer les modifications
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModifierProfil;
