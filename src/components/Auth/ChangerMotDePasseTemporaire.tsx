"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Card,
  CardBody,
  Input,
  Button,
  Link,
} from "@nextui-org/react";
import { 
  Eye, 
  EyeOff, 
  Lock,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  Mail
} from "lucide-react";
import { AuthService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import VerificationMFA from "@/components/Auth/VerificationMFA";

interface PasswordChangeData {
  email: string;
  current_password: string;
  new_password: string;
}

const ChangerMotDePasseTemporaire: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithUserData } = useAuth();
  const { showNotification } = useSimpleNotifications();

  const [formData, setFormData] = useState<PasswordChangeData>({
    email: "",
    current_password: "",
    new_password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState("");

  // Récupérer l'email depuis les paramètres URL
  useEffect(() => {
    const email = searchParams?.get("email");
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "L'email est requis";
    }

    if (!formData.current_password) {
      newErrors.current_password = "Le mot de passe actuel est requis";
    }

    if (!formData.new_password) {
      newErrors.new_password = "Le nouveau mot de passe est requis";
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (formData.new_password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.changeTempPassword({
        email: formData.email,
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      if (result.status === 'success') {
        // Vérifier si MFA est requis
        if (result.data?.requires_mfa) {
          setIsLoading(false);
          setPendingIdentifier(formData.email);
          setShowMFA(true);
          
          showNotification(simpleNotificationHelpers.info(
            "Authentification",
            result.data.message || "Code de vérification envoyé par email"
          ));
          return;
        }

        showNotification(simpleNotificationHelpers.success(
          "Succès",
          result.message || "Mot de passe mis à jour avec succès"
        ));

        // Connexion automatique avec le nouveau token
        if (result.data && result.data.token) {
          await loginWithUserData(result.data);
          
          // Redirection vers le tableau de bord
          setTimeout(() => {
            router.push('/tableaudebord');
          }, 1500);
        } else {
          // Si pas de token, rediriger vers la page de connexion
          setTimeout(() => {
            router.push('/connexion');
          }, 2000);
        }
      } else {
        throw new Error(result.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      
      let errorMessage = "Une erreur s'est produite lors du changement de mot de passe";
      
      if (error.message && error.message.includes('incorrect')) {
        errorMessage = "Mot de passe actuel incorrect";
        setErrors({ current_password: "Mot de passe incorrect" });
      } else {
        errorMessage = error.message || errorMessage;
      }

      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        errorMessage
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PasswordChangeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleBackFromMFA = () => {
    setShowMFA(false);
    setPendingIdentifier("");
    setErrors({});
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

  // Si MFA est requis, afficher le composant MFA
  if (showMFA) {
    return (
      <VerificationMFA
        identifier={pendingIdentifier}
        onBack={handleBackFromMFA}
      />
    );
  }

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
              Sécurité <span className="text-blue-200">Avancée</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mb-12 max-w-md text-lg leading-relaxed text-blue-100 lg:text-xl"
              variants={itemVariants}
            >
              Protégez votre compte avec un nouveau mot de passe sécurisé
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
                  Protection Renforcée
                </h3>
                <p className="text-xs text-blue-100">
                  Changement sécurisé de mot de passe
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Lock className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Cryptage Sécurisé
                </h3>
                <p className="text-xs text-blue-100">
                  Vos données sont protégées
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
                  Validation Instantanée
                </h3>
                <p className="text-xs text-blue-100">
                  Accès immédiat après changement
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Zap className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Support 24/7
                </h3>
                <p className="text-xs text-blue-100">
                  Assistance technique permanente
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Password Change Form */}
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
                  Nouveau mot de passe
                </h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-800"></div>
                <p className="mt-4 text-gray-600">
                  Changez votre mot de passe temporaire
                </p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800">
                      Adresse email
                    </label>
                  </div>
                  <Input
                    type="email"
                    variant="bordered"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                    classNames={{
                      input:
                        "text-gray-900 placeholder:text-gray-500 pl-10 text-base dark:text-white dark:placeholder:text-gray-400",
                      inputWrapper:
                        "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                      base: "!text-gray-800 dark:!text-gray-200",
                    }}
                    size="lg"
                    radius="lg"
                    startContent={<Mail className="h-5 w-5 text-gray-500" />}
                    isReadOnly={!!searchParams?.get("email")}
                  />
                </motion.div>

                {/* Current Password Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.6 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800">
                      Mot de passe actuel
                    </label>
                  </div>
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    variant="bordered"
                    placeholder="Entrez votre mot de passe temporaire"
                    value={formData.current_password}
                    onChange={(e) => handleInputChange("current_password", e.target.value)}
                    isInvalid={!!errors.current_password}
                    errorMessage={errors.current_password}
                    classNames={{
                      input:
                        "text-gray-900 placeholder:text-gray-500 pl-10 pr-10 text-base dark:text-white dark:placeholder:text-gray-400",
                      inputWrapper:
                        "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                      base: "!text-gray-800 dark:!text-gray-200",
                    }}
                    size="lg"
                    radius="lg"
                    startContent={<Lock className="h-5 w-5 text-gray-500" />}
                    endContent={
                      <button
                        className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </motion.div>

                {/* New Password Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.7 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800">
                      Nouveau mot de passe
                    </label>
                  </div>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    variant="bordered"
                    placeholder="Choisissez un nouveau mot de passe"
                    value={formData.new_password}
                    onChange={(e) => handleInputChange("new_password", e.target.value)}
                    isInvalid={!!errors.new_password}
                    errorMessage={errors.new_password}
                    classNames={{
                      input:
                        "text-gray-900 placeholder:text-gray-500 pl-10 pr-10 text-base dark:text-white dark:placeholder:text-gray-400",
                      inputWrapper:
                        "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                      base: "!text-gray-800 dark:!text-gray-200",
                    }}
                    size="lg"
                    radius="lg"
                    startContent={<Lock className="h-5 w-5 text-gray-500" />}
                    endContent={
                      <button
                        className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </motion.div>

                {/* Confirm Password Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.8 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800">
                      Confirmer le nouveau mot de passe
                    </label>
                  </div>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    variant="bordered"
                    placeholder="Répétez votre nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    isInvalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword}
                    classNames={{
                      input:
                        "text-gray-900 placeholder:text-gray-500 pl-10 pr-10 text-base dark:text-white dark:placeholder:text-gray-400",
                      inputWrapper:
                        "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                      base: "!text-gray-800 dark:!text-gray-200",
                    }}
                    size="lg"
                    radius="lg"
                    startContent={<CheckCircle className="h-5 w-5 text-gray-500" />}
                    endContent={
                      <button
                        className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    isDisabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-800 py-6 text-lg font-semibold text-white shadow-lg shadow-primary-800/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {!isLoading && (
                      <div className="flex items-center justify-center gap-2">
                        <span>{isLoading ? "Changement en cours..." : "Changer le mot de passe"}</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div
                className="mt-8 border-t border-gray-100 pt-6 text-center"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.0 }}
              >
                <p className="text-sm text-gray-500">
                  Besoin d'aide ?{" "}
                  <Link
                    href="/connexion"
                    className="font-semibold text-primary transition-colors duration-300 hover:text-primary-800 hover:underline"
                  >
                    Retour à la connexion
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChangerMotDePasseTemporaire;