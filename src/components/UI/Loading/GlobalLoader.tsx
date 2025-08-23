"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";
import Image from "next/image";

interface GlobalLoaderProps {
  className?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ className }) => {
  const { loading } = useGlobalLoading();

  if (!loading.isLoading) return null;

  return (
    <AnimatePresence>
      {loading.isLoading && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
          style={{
            background:
              "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Conteneur principal */}
          <motion.div
            className="flex flex-col items-center space-y-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1.0],
            }}
          >
            {/* Logo DATALYS avec effet skeleton synchronisé */}
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Conteneur du logo avec effet skeleton */}
              <motion.div
                className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-xl"
                animate={{
                  boxShadow: [
                    "0 10px 30px rgba(75, 169, 183, 0.15)",
                    "0 20px 40px rgba(75, 169, 183, 0.25)",
                    "0 10px 30px rgba(75, 169, 183, 0.15)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/logo/logo-2.png"
                  alt="DATALYS Consulting"
                  width={160}
                  height={100}
                  className="drop-shadow-sm"
                  priority
                />

                {/* Effet skeleton overlay synchronisé */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(75, 169, 183, 0.1) 50%, transparent 100%)",
                  }}
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Texte avec effet skeleton synchronisé */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Message principal */}
              <motion.div
                className="relative overflow-hidden rounded-lg bg-white/50 px-6 py-3 backdrop-blur-sm"
                animate={{
                  backgroundColor: [
                    "rgba(255, 255, 255, 0.5)",
                    "rgba(255, 255, 255, 0.7)",
                    "rgba(255, 255, 255, 0.5)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {loading.message || "Chargement..."}
                </h2>

                {/* Effet skeleton text synchronisé */}
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(75, 169, 183, 0.15) 50%, transparent 100%)",
                  }}
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Sous-message */}
              <motion.div
                className="relative overflow-hidden rounded-lg bg-white/30 px-4 py-2 backdrop-blur-sm"
                animate={{
                  backgroundColor: [
                    "rgba(255, 255, 255, 0.3)",
                    "rgba(255, 255, 255, 0.5)",
                    "rgba(255, 255, 255, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              >
                <p className="text-sm text-gray-600">
                  {loading.type === "auth" &&
                    "Vérification des identifiants..."}
                  {loading.type === "navigation" && "Chargement de la page..."}
                  {loading.type === "data" && "Récupération des données..."}
                  {loading.type === "form" && "Sauvegarde en cours..."}
                  {loading.type === "logout" && "Déconnexion en cours..."}
                  {loading.type === "general" && "Veuillez patienter..."}
                </p>

                {/* Effet skeleton sous-texte synchronisé */}
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(75, 169, 183, 0.1) 50%, transparent 100%)",
                  }}
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Points d'animation minimalistes */}
            <motion.div
              className="flex space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-[#4ba9b7]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Effet de fond subtil */}
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-[#4ba9b7]/20"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${20 + i * 20}%`,
                }}
                animate={{
                  y: [-5, -15, -5],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1.5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
