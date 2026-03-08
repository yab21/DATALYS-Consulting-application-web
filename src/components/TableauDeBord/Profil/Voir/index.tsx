"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import ModifierProfil from "@/components/TableauDeBord/Profil/ModifierProfil";
import { Avatar } from "@heroui/react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Shield, Edit3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useAuthContext } from "@/context/AuthContext";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";

const VoirProfil = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, isLoading } = useAuth();
  const { isPartner } = useAuthContext();

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

  return (
    <>
      <Breadcrumb pageName="Profil" />
      <div className="mx-auto max-w-4xl">
        {isEditing ? (
          <ModifierProfil
            userData={{
              name: user.name,
              email: user.email,
              isAdmin: user.role_id === 1,
              createdAt: new Date(user.created_at),
            }}
            onCancel={() => setIsEditing(false)}
            onClose={() => setIsEditing(false)}
            onUpdate={() => {
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
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="relative bg-gradient-to-r from-[#4ba9b7] to-[#3a8a95] px-8 py-12">
                  <div className="flex flex-col items-center text-center text-white sm:flex-row sm:text-left">
                    <div className="relative mb-6 sm:mb-0 sm:mr-8">
                      <div className="relative">
                        <Avatar
                          name={user.name.charAt(0).toUpperCase()}
                          className="h-36 w-36 border-4 border-white/30 shadow-2xl text-4xl"
                        />
                        <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg">
                          <div className={`h-5 w-5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <h1 className="text-4xl font-bold font-satoshi mb-4">
                          {user.name}
                        </h1>
                        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {user.role_id === 1 ? "Administrateur" : "Utilisateur"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!isPartner() && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg hover:bg-white/30 transition-colors font-medium"
                      >
                        <Edit3 className="h-4 w-4" />
                        Modifier le profil
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.role_id === 1 ? "Admin" : "User"}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Niveau d'accès</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#4ba9b7]">
                        {user.is_active ? "Actif" : "Inactif"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Statut du compte</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Jours d'ancienneté</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Informations Personnelles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#4ba9b7]/10 rounded-lg">
                    <User className="h-5 w-5 text-[#4ba9b7]" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informations Personnelles</h2>
                </div>

                <div className="space-y-4">
                  <div className="group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Nom</label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#4ba9b7]" />
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Adresse email</label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#4ba9b7]" />
                        <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Membre depuis</label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#4ba9b7]" />
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
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </>
  );
};

export default VoirProfil;
