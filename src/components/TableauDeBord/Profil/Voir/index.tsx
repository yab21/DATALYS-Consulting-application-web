"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import ModifierProfil from "@/components/TableauDeBord/Profil/ModifierProfil";
import { Button, Card, CardBody, Chip, Avatar, Divider } from "@nextui-org/react";
import { motion } from "framer-motion";
import { User, Mail, Building, Users, Calendar, Shield, Edit3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";

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
              className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-xl shadow-gray-200/50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80 dark:shadow-gray-900/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-sky-500 to-blue-600 p-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex flex-col items-center text-center text-white sm:flex-row sm:text-left">
                  <div className="relative mb-6 sm:mb-0 sm:mr-8">
                    <Avatar
                      src="/images/user.png"
                      alt={`${firstName} ${lastName}`}
                      className="h-32 w-32 border-4 border-white/30 shadow-xl backdrop-blur-sm"
                    />
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg">
                      <div className={`h-4 w-4 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-3">
                      <h1 className="text-3xl font-bold">
                        {firstName} {lastName}
                      </h1>
                      <p className="text-lg text-white/90">Consultant</p>
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
                  <Button
                    color="default"
                    variant="flat"
                    className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                    onClick={() => setIsEditing(true)}
                    startContent={<Edit3 className="h-4 w-4" />}
                  >
                    Modifier le profil
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Detailed Information Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
                  <CardBody className="p-6">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                        <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Informations personnelles
                      </h3>
                    </div>
                    <div className="space-y-4">
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
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Adresse email</p>
                            <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              {/* Professional Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
                  <CardBody className="p-6">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Informations professionnelles
                      </h3>
                    </div>
                    <div className="space-y-4">
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
                          <Users className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Département</p>
                            <p className="font-medium text-gray-900 dark:text-white">IT</p>
                          </div>
                        </div>
                      </div>
                      <Divider className="my-4" />
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
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
                  </CardBody>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border border-gray-200 shadow-lg dark:border-gray-700">
                <CardBody className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Actions rapides
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      color="primary"
                      variant="flat"
                      onClick={() => setIsEditing(true)}
                      startContent={<Edit3 className="h-4 w-4" />}
                    >
                      Modifier le profil
                    </Button>
                    <Button
                      color="secondary"
                      variant="flat"
                      startContent={<Shield className="h-4 w-4" />}
                    >
                      Changer le mot de passe
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default VoirProfil;