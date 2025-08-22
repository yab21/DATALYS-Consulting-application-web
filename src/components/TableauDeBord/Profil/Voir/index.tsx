"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import ModifierProfil from "@/components/TableauDeBord/Profil/ModifierProfil";
import { Chip, Avatar, Divider } from "@nextui-org/react";
import { motion } from "framer-motion";
import { User, Mail, Building, Users, Calendar, Shield, Edit3, Settings, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";
import { ProfessionalCard, ProfessionalButton, SectionHeader } from "@/components/UI/Professional";
import Link from "next/link";

const VoirProfil = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, isLoading } = useAuth();

  // Fonction pour extraire prénom et nom
  const getNameParts = (fullName: string) => {
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  if (isLoading || !user) {
    return (
      <>
        <Breadcrumb pageName="Profil" />
        <div className="mx-auto max-w-4xl">
          <LoadingSpinner 
            size="lg" 
            text="Chargement des données utilisateur..." 
          />
        </div>
      </>
    );
  }

  // Extraire prénom et nom depuis le nom complet de l'utilisateur connecté
  const { firstName, lastName } = getNameParts(user.name);

  return (
    <>
      <Breadcrumb pageName="Profil" />
      <div className="mx-auto max-w-4xl">
        {isEditing ? (
          <ModifierProfil
            userData={{
              lastName,
              firstName,
              function: "Consultant", // Valeur par défaut
              company: "DATALYS Consulting",
              department: "IT",
              email: user.email,
              profileImage: "/images/user.png",
              isAdmin: user.role_id === 1,
              createdAt: new Date(user.created_at),
            }}
            onCancel={() => setIsEditing(false)}
            onClose={() => setIsEditing(false)}
            onUpdate={() => {
              // Les données seront mises à jour via le hook useAuth
              setIsEditing(false);
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* Header Section with Profile Picture and Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProfessionalCard>
                <div className="relative overflow-hidden bg-gradient-to-r from-[#4ba9b7] to-[#3a8a95] p-8 rounded-lg">
                  <div className="flex flex-col items-center text-center text-white sm:flex-row sm:text-left">
                    <div className="relative mb-6 sm:mb-0 sm:mr-8">
                      <Avatar
                        src="/images/user.png"
                        alt={`${firstName} ${lastName}`}
                        className="h-32 w-32 border-4 border-white/30 shadow-xl"
                      />
                      <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg">
                        <div className={`h-4 w-4 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-3">
                        <h1 className="text-3xl font-bold font-satoshi">
                          {firstName} {lastName}
                        </h1>
                        <p className="text-lg text-white/90">Consultant DATALYS</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                        <Chip
                          variant="flat"
                          color={user.role_id === 1 ? "warning" : "secondary"}
                          className="bg-white/20 text-white backdrop-blur-sm"
                          startContent={<Shield className="h-4 w-4" />}
                        >
                          {user.role_id === 1 ? "Administrateur" : "Utilisateur"}
                        </Chip>
                        <Chip
                          variant="flat"
                          className="bg-white/20 text-white backdrop-blur-sm"
                          startContent={<Building className="h-4 w-4" />}
                        >
                          DATALYS Consulting
                        </Chip>
                      </div>
                    </div>
                    <ProfessionalButton
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      startContent={<Edit3 className="h-4 w-4" />}
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      Modifier le profil
                    </ProfessionalButton>
                  </div>
                </div>
              </ProfessionalCard>
            </motion.div>

            {/* Detailed Information Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <ProfessionalCard>
                  <SectionHeader
                    title="Informations Personnelles"
                    icon={<User />}
                    variant="compact"
                    color="primary"
                    divider
                  />
                  
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Prénom</p>
                        <p className="font-medium text-gray-900 dark:text-white">{firstName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nom</p>
                        <p className="font-medium text-gray-900 dark:text-white">{lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-[#4ba9b7]" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Adresse email</p>
                          <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ProfessionalCard>
              </motion.div>

              {/* Professional Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ProfessionalCard>
                  <SectionHeader
                    title="Informations Professionnelles"
                    icon={<Building />}
                    variant="compact"
                    color="primary"
                    divider
                  />
                  
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fonction</p>
                        <p className="font-medium text-gray-900 dark:text-white">Consultant</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Entreprise</p>
                        <p className="font-medium text-gray-900 dark:text-white">DATALYS Consulting</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-[#4ba9b7]" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Département</p>
                          <p className="font-medium text-gray-900 dark:text-white">IT</p>
                        </div>
                      </div>
                    </div>
                    <Divider className="my-4" />
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-[#4ba9b7]" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Membre depuis</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(user.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ProfessionalCard>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ProfessionalCard>
                <SectionHeader
                  title="Actions Rapides"
                  icon={<Settings />}
                  variant="compact"
                  color="primary"
                  divider
                />
                
                <div className="flex flex-wrap gap-4 mt-6">
                  <ProfessionalButton
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    startContent={<Edit3 className="h-4 w-4" />}
                  >
                    Modifier le profil
                  </ProfessionalButton>
                  
                  <Link href="/tableaudebord/profil/changermotdepasse">
                    <ProfessionalButton
                      variant="secondary"
                      startContent={<Lock className="h-4 w-4" />}
                    >
                      Changer le mot de passe
                    </ProfessionalButton>
                  </Link>
                </div>
              </ProfessionalCard>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default VoirProfil;