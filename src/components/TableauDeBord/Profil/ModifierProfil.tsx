"use client";

import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@nextui-org/react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

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

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

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
        const storage = getStorage();
        const storageRef = ref(storage, `profileImages/${userId}`);
        await uploadBytes(storageRef, newProfileImage);
        const profileImageUrl = await getDownloadURL(storageRef);
        updatedData.profileImage = profileImageUrl;
      }

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        ...updatedData,
        isAdmin: userData.isAdmin,
        createdAt: userData.createdAt,
      });

      console.log("Profil mis à jour avec succès");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la mise à jour du profil",
      );
    }
  };

  return (
    <Modal
      isOpen={true}
      onOpenChange={onClose}
      placement="top-center"
      size="2xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-17 md:pb-0">
              Modifier le Profil
            </ModalHeader>
            <ModalBody>
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nom"
                  label="Nom"
                  variant="bordered"
                  className="w-full"
                />
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Prénom"
                  label="Prénom"
                  variant="bordered"
                  className="w-full"
                />
                <Input
                  type="text"
                  name="function"
                  value={formData.function}
                  onChange={handleChange}
                  placeholder="Fonction"
                  label="Fonction"
                  variant="bordered"
                  className="w-full"
                />
                <Input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Société"
                  label="Société"
                  variant="bordered"
                  className="w-full"
                />
                <Input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Département"
                  label="Département"
                  variant="bordered"
                  className="w-full"
                />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  label="Email"
                  variant="bordered"
                  className="w-full"
                />
                <div className="mb-4">
                  <div className="flex items-center justify-center">
                    <img
                      src={formData.profileImage || "/images/user.png"}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Annuler
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModifierProfil;
