"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Input,
  Button,
} from "@nextui-org/react";
import { 
  Shield,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { AuthService } from "@/services/auth";
import { MFAVerificationRequest } from "@/lib/api-config";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";

interface VerificationMFAProps {
  identifier: string;
  onBack: () => void;
}

const VerificationMFA: React.FC<VerificationMFAProps> = ({ identifier, onBack }) => {
  const router = useRouter();
  const { loginWithUserData } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const { start, finish } = useTopBarProgress();

  const [mfaCode, setMfaCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


  // Mettre à jour le mfaCode quand les digits changent
  useEffect(() => {
    const code = codeDigits.join("");
    setMfaCode(code);
  }, [codeDigits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullCode = codeDigits.join("");
    if (!fullCode || fullCode.length !== 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    start();
    setIsLoading(true);
    setError("");

    try {
      const request: MFAVerificationRequest = {
        identifier,
        mfa_code: fullCode,
      };

      const result = await AuthService.verifyMFA(request);

      if (result.status === "success" && result.data) {
        // Utiliser loginWithUserData pour finaliser la connexion
        await loginWithUserData(result.data);
        
        showNotification(simpleNotificationHelpers.success(
          "Authentification réussie !",
          `Bienvenue ${result.data.name || "sur DATALYS"} 🎉`
        ));
        
        // Rediriger vers le tableau de bord
        setTimeout(() => {
          setIsLoading(false);
          finish(); // Terminer la progress bar avant la redirection
          router.push("/tableaudebord");
        }, 1000);
      } else {
        finish();
        setIsLoading(false);
        setError(result.message || "Code MFA incorrect");
        setRemainingAttempts(result.remaining_attempts || null);
        
        showNotification(simpleNotificationHelpers.error(
          "Code incorrect",
          result.message || "Vérifiez votre code et réessayez."
        ));
      }
    } catch (error) {
      finish();
      setIsLoading(false);
      console.error("Erreur vérification MFA:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
      showNotification(simpleNotificationHelpers.error(
        "Erreur de connexion",
        "Problème de réseau. Vérifiez votre connexion internet."
      ));
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Nettoyer l'entrée (garder seulement les chiffres)
    const cleanValue = value.replace(/[^0-9]/g, "");
    
    if (cleanValue.length === 0) {
      // Suppression
      const newDigits = [...codeDigits];
      newDigits[index] = "";
      setCodeDigits(newDigits);
      
      // Retourner au champ précédent si on supprime
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (cleanValue.length === 1) {
      // Saisie normale d'un chiffre
      const newDigits = [...codeDigits];
      newDigits[index] = cleanValue;
      setCodeDigits(newDigits);
      
      // Passer au champ suivant
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Collage de plusieurs chiffres
      handlePaste(index, cleanValue);
    }
    
    // Effacer l'erreur si l'utilisateur tape
    if (error) {
      setError("");
    }
  };

  const handlePaste = (startIndex: number, pastedValue: string) => {
    const digits = pastedValue.slice(0, 6).split("");
    const newDigits = [...codeDigits];
    
    digits.forEach((digit, i) => {
      if (startIndex + i < 6) {
        newDigits[startIndex + i] = digit;
      }
    });
    
    setCodeDigits(newDigits);
    
    // Focus sur le dernier champ rempli ou le suivant
    const lastFilledIndex = Math.min(startIndex + digits.length - 1, 5);
    const nextIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : lastFilledIndex;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && codeDigits[index] === "" && index > 0) {
      // Si le champ est vide et qu'on appuie sur Backspace, revenir au champ précédent
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.05)_0%,transparent_50%)]"></div>

      <div className="relative flex min-h-screen">
        {/* Left Panel - Brand Section */}
        <motion.div
          className="relative hidden flex-col items-center justify-center bg-gradient-to-br from-primary via-primary-800 to-primary-800 p-8 lg:flex lg:w-1/2"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Logo */}
            <motion.div
              className="mb-8"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src="/images/logo/logo.png"
                alt="DATALYS Consulting"
                width={140}
                height={100}
                className="drop-shadow-lg"
              />
            </motion.div>

            {/* Main Title */}
            <motion.h1
              className="mb-6 text-4xl font-bold leading-tight text-white lg:text-5xl"
              variants={itemVariants}
            >
              Authentification <span className="text-blue-200">Sécurisée</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mb-12 max-w-md text-lg leading-relaxed text-blue-100 lg:text-xl"
              variants={itemVariants}
            >
              Entrez le code de vérification envoyé à votre adresse email
            </motion.p>

            {/* Feature Cards */}
            <motion.div
              className="grid w-full max-w-lg grid-cols-1 gap-4 lg:grid-cols-2"
              variants={itemVariants}
            >
              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Shield className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Double Authentification
                </h3>
                <p className="text-xs text-blue-100">
                  Protection maximale de votre compte
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <CheckCircle className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Vérification Rapide
                </h3>
                <p className="text-xs text-blue-100">
                  Code valide quelques minutes
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Clock className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Accès Immédiat
                </h3>
                <p className="text-xs text-blue-100">
                  Connexion après vérification
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <AlertTriangle className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Tentatives Limitées
                </h3>
                <p className="text-xs text-blue-100">
                  Sécurité contre les intrusions
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - MFA Form */}
        <motion.div
          className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Mobile Logo */}
          <motion.div
            className="mb-8 flex justify-center lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Image
              src="/images/logo/logo-2.png"
              width={120}
              height={90}
              alt="DATALYS"
              className="drop-shadow-lg"
            />
          </motion.div>

          {/* Form Container */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Form Card */}
            <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-blue-900/10">
              {/* Header */}
              <motion.div
                className="mb-8 text-center"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <h2 className="mb-3 text-3xl font-bold text-gray-900 lg:text-4xl">
                  Code de vérification
                </h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-800"></div>
                <p className="mt-4 text-gray-600">
                  Entrez le code à 6 chiffres envoyé à <br />
                  <span className="font-semibold text-primary">{identifier}</span>
                </p>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="text-red-700 font-medium">{error}</span>
                      {remainingAttempts !== null && (
                        <p className="text-red-600 text-sm mt-1">
                          {remainingAttempts} tentative(s) restante(s)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* MFA Code Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <div className="mb-4">
                    <label className="mb-4 block text-base font-semibold text-gray-800">
                      Code de vérification
                    </label>
                  </div>
                  
                  {/* 6 Individual Cards */}
                  <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]"
                          maxLength={1}
                          value={codeDigits[index]}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData("text");
                            handlePaste(index, pastedData);
                          }}
                          className={`
                            w-12 h-14 sm:w-14 sm:h-16 
                            text-2xl sm:text-3xl font-mono font-bold text-center
                            rounded-xl border-2 
                            transition-all duration-300
                            ${
                              codeDigits[index]
                                ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/20"
                                : "border-gray-300 bg-gray-50 hover:border-gray-400"
                            }
                            focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary
                            ${error ? "border-red-400 bg-red-50" : ""}
                          `}
                        />
                        
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Entrez les 6 chiffres reçus par email
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    isDisabled={isLoading || codeDigits.join("").length !== 6}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-800 py-6 text-lg font-semibold text-white shadow-lg shadow-primary-800/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {!isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Vérifier le code</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    ) : (
                      <span>Vérification en cours...</span>
                    )}
                  </Button>
                </motion.div>

                {/* Back Button */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    isDisabled={isLoading}
                    className="w-full py-4 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                    size="lg"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div
                className="mt-8 border-t border-gray-100 pt-6 text-center"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8 }}
              >
                <p className="text-sm text-gray-500">
                  Vérifiez votre boîte email pour le code de vérification
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerificationMFA;