"use client";

import { useState } from "react";
import Link from "next/link";
import ClickOutside from "@/components/ClickOutside";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Image par défaut si pas d'avatar
  const defaultAvatar = "/images/user.png";
  
  // Extraire prénom et nom depuis le nom complet
  const getNameParts = (fullName: string) => {
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const handleSignOut = () => {
    setIsLoggingOut(true);
    try {
      logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoggingOut(false);
      setDropdownOpen(false);
    }
  };

  // Afficher un loader si les données utilisateur sont en cours de chargement
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/50 px-3 py-2 shadow-lg dark:border-gray-600 dark:bg-gray-800/50">
        <LoadingSpinner size="sm" text="Chargement..." />
      </div>
    );
  }

  const { firstName, lastName } = getNameParts(user.name);
  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/50 px-3 py-2 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-gray-300/50 dark:border-gray-600 dark:bg-gray-800/50 dark:shadow-gray-900/50 dark:hover:bg-gray-800 dark:hover:shadow-gray-800/50"
          href="#"
        >
          <div className="relative">
            {defaultAvatar ? (
              <img
                src={defaultAvatar}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20 transition-all duration-300 hover:ring-blue-500/40"
                onError={(e) => {
                  // Fallback vers avatar avec initiales si l'image ne charge pas
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#06B6D4] to-teal-600 text-white font-bold text-sm ring-2 ring-blue-500/20 transition-all duration-300 hover:ring-blue-500/40">
                {userInitials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
          </div>

          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {firstName ? `${firstName.charAt(0)}. ${lastName}` : user.name}
              </span>
              <motion.svg
                className="fill-current text-gray-500 transition-transform duration-200 dark:text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.6921 7.09327C3.91674 6.83119 4.3113 6.80084 4.57338 7.02548L9.99997 11.6768L15.4266 7.02548C15.6886 6.80084 16.0832 6.83119 16.3078 7.09327C16.5325 7.35535 16.5021 7.74991 16.24 7.97455L10.4067 12.9745C10.1727 13.1752 9.82728 13.1752 9.59322 12.9745L3.75989 7.97455C3.49781 7.74991 3.46746 7.35535 3.6921 7.09327Z"
                  fill=""
                />
              </motion.svg>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.role_id === 1 ? "Administrateur" : (user.role_id === 4 || user.partner_id) ? "Partenaire" : user.role_id === 2 ? "Utilisateur" : "Utilisateur"}
            </p>
          </div>
        </Link>
      </motion.div>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-72 rounded-2xl border border-gray-200 bg-white/95 shadow-2xl shadow-gray-200/50 backdrop-blur-xl dark:border-gray-600 dark:bg-gray-800/95 dark:shadow-gray-900/50"
          >
            {/* Header du dropdown */}
            <div className="border-b border-gray-100 p-4 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {defaultAvatar ? (
                    <img
                      src={defaultAvatar}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/30"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#06B6D4] to-teal-600 text-white font-bold ring-2 ring-blue-500/30">
                      {userInitials}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
                </div>
                <div className="flex-1">
                  <h6 className="font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </h6>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {user.role_id === 1 ? "Administrateur" : (user.role_id === 4 || user.partner_id) ? "Partenaire" : user.role_id === 2 ? "Utilisateur" : "Utilisateur"}
                    </span>
                    {user.is_active && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Actif
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de déconnexion seulement */}
            <div className="p-2">
              <motion.button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isLoggingOut ? { x: 4 } : {}}
                whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 300 }}
              >
{isLoggingOut ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClickOutside>
  );
};

export default DropdownUser;
