"use client";

import { useState } from "react";
import { Input } from "@heroui/react";
import { Button } from "@heroui/button";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  RefreshCw,
  Lock,
  Mail,
  Loader2,
  Key,
  Sun,
  Moon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthService } from "@/services/auth";
import useColorMode from "@/hooks/useColorMode";
import {
  useSimpleNotifications,
  simpleNotificationHelpers,
} from "@/components/UI/Notifications/SimpleNotificationSystem";

interface ForgotPasswordForm {
  email: string;
}

const MotDePasseOublie = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { showNotification } = useSimpleNotifications();
  const [colorMode, setColorMode] = useColorMode() as [string, (value: string) => void];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onEmailSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await AuthService.resetPasswordRequest(data.email);

      if (result.status === "success") {
        setEmailSent(true);
        setErrorMessage("");
        showNotification(
          simpleNotificationHelpers.success(
            "Succès",
            result.message || "Email de récupération envoyé",
          ),
        );
      } else {
        setErrorMessage(
          result.message || "Erreur lors de la demande de réinitialisation",
        );
        showNotification(
          simpleNotificationHelpers.error(
            "Erreur",
            result.message || "Impossible d'envoyer l'email de réinitialisation",
          ),
        );
      }
    } catch (error) {
      setErrorMessage("Erreur de connexion. Veuillez réessayer.");
      showNotification(
        simpleNotificationHelpers.error(
          "Erreur",
          "Une erreur s'est produite. Veuillez réessayer",
        ),
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

  const springTransition = {
    type: "spring",
    stiffness: 100,
    damping: 15,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.08)_0%,transparent_50%)]"></div>

      {/* Dark Mode Toggle */}
      <motion.button
        onClick={() => setColorMode(colorMode === "light" ? "dark" : "light")}
        className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition-colors hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-700"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {colorMode === "dark" ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-600" />
        )}
      </motion.button>

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
              Récupération de{" "}
              <span className="text-blue-200">mot de passe</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mb-12 max-w-md text-lg leading-relaxed text-blue-100 lg:text-xl"
              variants={itemVariants}
            >
              Sécurisez votre compte en créant un nouveau mot de passe fort et
              unique
            </motion.p>

            {/* Security Features */}
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
                  Sécurité Renforcée
                </h3>
                <p className="text-xs text-blue-100">
                  Protection maximale de votre compte
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
                  Procédure de récupération sécurisée
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <RefreshCw className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Processus Simple
                </h3>
                <p className="text-xs text-blue-100">
                  Mise à jour rapide et efficace
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Lock className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Validation Automatique
                </h3>
                <p className="text-xs text-blue-100">
                  Vérification en temps réel
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Form */}
        <motion.div
          className="flex w-full items-center justify-center p-6 lg:w-1/2"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Mobile Logo */}
          <motion.div
            className="absolute left-1/2 top-6 z-20 -translate-x-1/2 transform lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Image
              src="/images/logo/logo-2.png"
              width={100}
              height={100}
              alt="DATALYS"
              className="drop-shadow-lg dark:hidden"
            />
            <Image
              src="/images/logo/logo.png"
              width={100}
              height={100}
              alt="DATALYS"
              className="hidden drop-shadow-lg dark:block"
            />
          </motion.div>

          {/* Form Container */}
          <motion.div
            className="mt-16 w-full max-w-md lg:mt-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Form Card */}
            <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-blue-900/10 dark:bg-gray-800 dark:shadow-gray-900/50">
              {!emailSent ? (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Header */}
                  <motion.div
                    className="mb-8 text-center"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                      Mot de passe oublié
                    </h2>
                    <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-800"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      Entrez votre adresse email pour recevoir un lien de
                      récupération
                    </p>
                  </motion.div>

                  {/* Error Message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    >
                      {errorMessage}
                    </motion.div>
                  )}

                  {/* Email Form */}
                  <form
                    onSubmit={handleSubmit(onEmailSubmit)}
                    className="space-y-6"
                  >
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.5 }}
                    >
                      <div className="mb-2">
                        <label className="mb-2 block text-base font-semibold text-gray-800 dark:text-gray-200">
                          Adresse email
                        </label>
                      </div>
                      <Input
                        {...register("email", {
                          required: "L'adresse email est requise",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Adresse email invalide",
                          },
                        })}
                        type="email"
                        variant="bordered"
                        placeholder="entrer@votre-email.com"
                        classNames={{
                          input:
                            "text-gray-900 placeholder:text-gray-500 pl-10 text-base dark:text-white dark:placeholder:text-gray-400",
                          inputWrapper:
                            "border-gray-300 bg-white hover:border-blue-400 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:focus-within:border-sky-400",
                          base: "!text-gray-800 dark:!text-gray-200",
                        }}
                        size="lg"
                        radius="lg"
                        isInvalid={!!errors.email}
                        errorMessage={errors.email?.message}
                        startContent={
                          <Mail className="h-5 w-5 text-gray-500" />
                        }
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.6 }}
                    >
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-800 py-6 text-lg font-semibold text-white shadow-lg shadow-primary-800/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-800/40 disabled:cursor-not-allowed disabled:opacity-70"
                        size="lg"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Mail className="h-5 w-5" />
                          )}
                          <span>
                            {isLoading
                              ? "Envoi en cours..."
                              : "Envoyer le lien de récupération"}
                          </span>
                        </div>
                      </Button>
                    </motion.div>

                    <motion.div
                      className="text-center"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.7 }}
                    >
                      <Link
                        href="/connexion"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors duration-300 hover:text-primary-800 hover:underline"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à la connexion
                      </Link>
                    </motion.div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  {/* Success Animation */}
                  <motion.div
                    className="mb-8 flex justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.2,
                    }}
                  >
                    <motion.div
                      className="relative rounded-full bg-gradient-to-r from-green-400 to-green-600 p-6"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(34, 197, 94, 0.4)",
                          "0 0 40px rgba(34, 197, 94, 0.6)",
                          "0 0 20px rgba(34, 197, 94, 0.4)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    >
                      <CheckCircle className="h-12 w-12 text-white" />
                    </motion.div>
                  </motion.div>

                  <motion.h2
                    className="mb-4 text-3xl font-bold text-gray-900 dark:text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Email envoyé !
                  </motion.h2>

                  <motion.p
                    className="mb-6 leading-relaxed text-gray-500 dark:text-gray-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Un lien de réinitialisation a été envoyé à votre adresse email.
                    <br />
                    <span className="font-semibold text-primary">
                      Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                    </span>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-4"
                  >
                    <Button
                      onPress={() => setEmailSent(false)}
                      variant="bordered"
                      className="w-full"
                    >
                      Renvoyer l'email
                    </Button>
                    <Link
                      href="/connexion"
                      className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour à la connexion
                    </Link>
                  </motion.div>
                </motion.div>
              )}



              {/* Footer */}
              <motion.div
                className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  All Rights Reserved by{" "}
                  <Link
                    href="https://www.datalysconsulting.com/"
                    className="font-semibold text-primary transition-colors duration-300 hover:text-primary-800 hover:underline"
                    target="_blank"
                  >
                    DATALYS Consulting
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

export default MotDePasseOublie;
