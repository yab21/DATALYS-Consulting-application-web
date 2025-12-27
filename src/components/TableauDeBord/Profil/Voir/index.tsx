"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import ModifierProfil from "@/components/TableauDeBord/Profil/ModifierProfil";
import { Chip, Avatar, Divider } from "@heroui/react";
import { motion } from "framer-motion";
import { User, Mail, Building, Users, Calendar, Shield, Edit3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useAuthContext } from "@/context/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";
import { ProfessionalCard, ProfessionalButton, SectionHeader } from "@/components/UI/Professional";

const VoirProfil = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, isLoading } = useAuth();
  const { isPartner } = useAuthContext();

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
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="relative bg-gradient-to-r from-[#4ba9b7] to-[#3a8a95] px-8 py-12">
                  <div className="flex flex-col items-center text-center text-white sm:flex-row sm:text-left">
                    <div className="relative mb-6 sm:mb-0 sm:mr-8">
                      <div className="relative">
                        <Avatar
                          src="/images/user.png"
                          alt={`${firstName} ${lastName}`}
                          className="h-36 w-36 border-4 border-white/30 shadow-2xl"
                        />
                        <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg">
                          <div className={`h-5 w-5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <h1 className="text-4xl font-bold font-satoshi mb-2">
                          {firstName} {lastName}
                        </h1>
                        <p className="text-xl text-white/90 mb-4">Consultant DATALYS</p>
                        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {user.role_id === 1 ? "Administrateur" : "Utilisateur"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Building className="h-4 w-4" />
                            <span className="text-sm font-medium">DATALYS Consulting</span>
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
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{user.role_id === 1 ? "Admin" : "User"}</div>
                      <div className="text-sm text-gray-500">Niveau d'accès</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#4ba9b7]">
                        {user.is_active ? "Actif" : "Inactif"}
                      </div>
                      <div className="text-sm text-gray-500">Statut du compte</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-sm text-gray-500">Jours d'ancienneté</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Informations détaillées */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Informations Personnelles */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#4ba9b7]/10 rounded-lg">
                      <User className="h-5 w-5 text-[#4ba9b7]" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Informations Personnelles</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Prénom</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <p className="font-medium text-gray-900">{firstName}</p>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Nom de famille</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <p className="font-medium text-gray-900">{lastName}</p>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Adresse email</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#4ba9b7]" />
                          <p className="font-medium text-gray-900">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Informations Professionnelles */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#4ba9b7]/10 rounded-lg">
                      <Building className="h-5 w-5 text-[#4ba9b7]" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Informations Professionnelles</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Fonction</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <p className="font-medium text-gray-900">Consultant</p>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Entreprise</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <p className="font-medium text-gray-900">DATALYS Consulting</p>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Département</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#4ba9b7]" />
                          <p className="font-medium text-gray-900">IT</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Membre depuis</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#4ba9b7]" />
                          <p className="font-medium text-gray-900">
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

          </div>
        )}
      </div>
    </>
  );
};

export default VoirProfil;