"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Input,
  Button,
  Link,
} from "@heroui/react";
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  AlertTriangle,
  Key,
  Sun,
  Moon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthService } from "@/services/auth";
import useColorMode from "@/hooks/useColorMode";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { extractBackendMessage } from "@/lib/error-handler";

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ResetMotDePasse: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useSimpleNotifications();
  const [colorMode, setColorMode] = useColorMode() as [string, (value: string) => void];

  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>();

  const newPassword = watch("newPassword");

  // Récupérer le token depuis les paramètres URL
  useEffect(() => {
    console.log('🔍 DEBUG Reset - URL complète:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    console.log('🔍 DEBUG Reset - Search params:', searchParams?.toString());
    
    const urlToken = searchParams?.get("token");
    console.log('🔍 DEBUG Reset - Token reçu:', urlToken ? urlToken.substring(0, 20) + '...' : 'AUCUN TOKEN');
    
    if (urlToken) {
      setToken(urlToken);
      setTokenError("");
      console.log('✅ DEBUG Reset - Token défini avec succès');
    } else {
      console.log('❌ DEBUG Reset - Aucun token trouvé dans l\'URL');
      setTokenError("Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.");
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordForm) => {
    console.log('🔍 DEBUG Reset - Début onSubmit');
    console.log('🔍 DEBUG Reset - Token disponible:', token ? 'OUI (' + token.substring(0, 20) + '...)' : 'NON');
    console.log('🔍 DEBUG Reset - Longueur mot de passe:', data.newPassword?.length);
    
    if (!token) {
      console.log('❌ DEBUG Reset - Token manquant, arrêt du processus');
      setTokenError("Token de réinitialisation manquant.");
      return;
    }

    setIsLoading(true);
    console.log('🔍 DEBUG Reset - Appel API en cours...');

    try {
      const result = await AuthService.resetPassword(token, data.newPassword);
      console.log('🔍 DEBUG Reset - Résultat API:', JSON.stringify(result, null, 2));

      if (result.status === "success") {
        showNotification(
          simpleNotificationHelpers.success(
            "Mot de passe mis à jour !",
            extractBackendMessage(result) || result?.message || "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
          )
        );

        // Redirection vers la page de connexion
        setTimeout(() => {
          router.push("/connexion");
        }, 2000);
      } else {
        showNotification(
          simpleNotificationHelpers.error(
            "Erreur de réinitialisation",
            extractBackendMessage(result) || result.message || "Impossible de mettre à jour le mot de passe."
          )
        );
      }
    } catch (error) {
      console.error('❌ DEBUG Reset - Erreur capturée:', error);
      console.error('❌ DEBUG Reset - Type erreur:', typeof error);
      console.error('❌ DEBUG Reset - Message erreur:', (error as any)?.message);
      console.error('❌ DEBUG Reset - Response erreur:', (error as any)?.response);
      
      showNotification(
        simpleNotificationHelpers.error(
          "Erreur",
          extractBackendMessage(error) || "Une erreur s'est produite lors de la réinitialisation."
        )
      );
    } finally {
      setIsLoading(false);
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
    },
  };

  // Si pas de token, afficher une erreur
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setColorMode(colorMode === "dark" ? "light" : "dark")}
          className="fixed right-4 top-4 z-50 rounded-full bg-white/80 p-2.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl dark:bg-gray-800/80 dark:hover:bg-gray-700"
          aria-label="Toggle dark mode"
        >
          {colorMode === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600" />
          )}
        </button>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-blue-900/10 text-center dark:bg-gray-800 dark:shadow-gray-900/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4 dark:bg-red-900/30">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">
              Lien invalide
            </h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">
              {tokenError}
            </p>
            <Link href="/mot-de-passe-oublie">
              <Button
                color="primary"
                className="bg-gradient-to-r from-primary to-primary-800"
              >
                Demander un nouveau lien
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setColorMode(colorMode === "dark" ? "light" : "dark")}
        className="fixed right-4 top-4 z-50 rounded-full bg-white/80 p-2.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl dark:bg-gray-800/80 dark:hover:bg-gray-700"
        aria-label="Toggle dark mode"
      >
        {colorMode === "dark" ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-600" />
        )}
      </button>

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
              transition={{ type: "spring" as const, stiffness: 300 }}
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
              Nouveau <span className="text-blue-200">Mot de Passe</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mb-12 max-w-md text-lg leading-relaxed text-blue-100 lg:text-xl"
              variants={itemVariants}
            >
              Créez un nouveau mot de passe sécurisé pour protéger votre compte
            </motion.p>

            {/* Feature Cards */}
            <motion.div
              className="grid w-full max-w-lg grid-cols-1 gap-4 lg:grid-cols-2"
              variants={itemVariants}
            >
              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Shield className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Sécurité Maximale
                </h3>
                <p className="text-xs text-blue-100">
                  Protection avancée de votre compte
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Key className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Accès Sécurisé
                </h3>
                <p className="text-xs text-blue-100">
                  Authentification renforcée
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
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
                  Vérification en temps réel
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Zap className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Processus Rapide
                </h3>
                <p className="text-xs text-blue-100">
                  Mise à jour en quelques secondes
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Reset Form */}
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
              className="drop-shadow-lg dark:hidden"
            />
            <Image
              src="/images/logo/logo.png"
              width={120}
              height={90}
              alt="DATALYS"
              className="hidden drop-shadow-lg dark:block"
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
            <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-blue-900/10 dark:bg-gray-800 dark:shadow-gray-900/50">
              {/* Header */}
              <motion.div
                className="mb-8 text-center"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                  Réinitialiser
                </h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-800"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Créez votre nouveau mot de passe
                </p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* New Password Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Nouveau mot de passe
                    </label>
                  </div>
                  <Input
                    {...register("newPassword", {
                      required: "Le nouveau mot de passe est requis",
                      minLength: {
                        value: 8,
                        message: "Le mot de passe doit contenir au moins 8 caractères"
                      }
                    })}
                    type={showNewPassword ? "text" : "password"}
                    variant="bordered"
                    placeholder="Choisissez un nouveau mot de passe"
                    isInvalid={!!errors.newPassword}
                    errorMessage={errors.newPassword?.message}
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
                        className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
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
                  transition={{ delay: 0.6 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Confirmer le nouveau mot de passe
                    </label>
                  </div>
                  <Input
                    {...register("confirmPassword", {
                      required: "La confirmation du mot de passe est requise",
                      validate: (value) =>
                        value === newPassword || "Les mots de passe ne correspondent pas"
                    })}
                    type={showConfirmPassword ? "text" : "password"}
                    variant="bordered"
                    placeholder="Répétez votre nouveau mot de passe"
                    isInvalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword?.message}
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
                        className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
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
                  transition={{ delay: 0.7 }}
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
                        <span>{isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div
                className="mt-8 border-t border-gray-100 pt-6 text-center dark:border-gray-700"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8 }}
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
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

export default ResetMotDePasse;