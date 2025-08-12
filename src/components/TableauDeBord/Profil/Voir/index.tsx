"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import ModifierProfil from "@/components/TableauDeBord/Profil/ModifierProfil";
import { Button } from "@nextui-org/react";

interface UserData {
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

const VoirProfil = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mock user data for demonstration
  const mockUserData: UserData = {
    lastName: "Doe",
    firstName: "John",
    function: "Développeur",
    company: "DATALYS Consulting",
    department: "IT",
    email: "john.doe@datalysconsulting.com",
    profileImage: "/images/user.png",
    isAdmin: true,
    createdAt: new Date("2024-01-01"),
  };

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUserData(mockUserData);
    }, 500);
  }, []);

  if (!userData) {
    return <div>Chargement des données utilisateur...</div>;
  }

  return (
    <>
      <Breadcrumb pageName="Profil" />
      <div className="mx-auto max-w-4xl">
        {isEditing ? (
          <ModifierProfil
            userData={userData}
            onCancel={() => setIsEditing(false)}
            onSave={(updatedData) => {
              setUserData(updatedData);
              setIsEditing(false);
            }}
          />
        ) : (
          <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium text-dark dark:text-white">
                Informations du profil
              </h3>
              <Button
                color="primary"
                variant="flat"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prénom
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.firstName}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.lastName}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.email}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rôle
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.isAdmin ? "Administrateur" : "Utilisateur"}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fonction
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.function}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entreprise
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.company}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Département
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.department}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de création
                  </label>
                  <p className="text-base text-dark dark:text-white">
                    {userData.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="h-32 w-32 rounded-full">
                <img
                  src={userData.profileImage}
                  alt="Photo de profil"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VoirProfil;