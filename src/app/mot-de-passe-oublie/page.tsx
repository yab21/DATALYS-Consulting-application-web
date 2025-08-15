"use client";

import { useState } from "react";
import { Input } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Shield,
  Key,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthService } from "@/services/auth";
import {
  useNotifications,
  notificationHelpers,
} from "@/components/UI/Notifications/NotificationSystem";

interface ForgotPasswordForm {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

const MotDePasseOublie = () => {
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isVisibleNewPassword, setIsVisibleNewPassword] = useState(false);
  const [isVisibleConfirmPassword, setIsVisibleConfirmPassword] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const router = useRouter();
  const { showNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordForm>();
  const newPassword = watch("newPassword");

  const toggleVisibilityNewPassword = () =>
    setIsVisibleNewPassword(!isVisibleNewPassword);
  const toggleVisibilityConfirmPassword = () =>
    setIsVisibleConfirmPassword(!isVisibleConfirmPassword);

  const onEmailSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await AuthService.resetPasswordRequest(data.email);

      if (result.status === "success") {
        // L'utilisateur recevra un email avec un lien de réinitialisation
        setErrorMessage(""); // Clear any previous error
        showNotification(
          notificationHelpers.success(
            "Email envoyé !",
            "Vérifiez votre boîte mail pour le lien de réinitialisation.",
          ),
        );
      } else {
        setErrorMessage(
          result.message || "Erreur lors de la demande de réinitialisation",
        );
        showNotification(
          notificationHelpers.error(
            "Erreur d'envoi",
            result.message ||
              "Impossible d'envoyer l'email de réinitialisation.",
          ),
        );
      }
    } catch (error) {
      setErrorMessage("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // En réalité, le token viendrait des paramètres URL du lien email
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token") || resetToken;

      if (!token) {
        setErrorMessage(
          "Token de réinitialisation manquant. Veuillez utiliser le lien reçu par email.",
        );
        return;
      }

      const result = await AuthService.resetPassword(token, data.newPassword);

      if (result.status === "success") {
        setStep("success");
        showNotification(
          notificationHelpers.success(
            "Mot de passe mis à jour !",
            "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
          ),
        );

        // Start countdown
        let count = 5;
        setCountdown(count);
        const timer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            router.push("/connexion");
          }
        }, 1000);
      } else {
        setErrorMessage(
          result.message ||
            "Erreur lors de la réinitialisation du mot de passe",
        );
        showNotification(
          notificationHelpers.error(
            "Erreur de réinitialisation",
            result.message || "Impossible de mettre à jour le mot de passe.",
          ),
        );
      }
    } catch (error) {
      setErrorMessage("Erreur de connexion. Veuillez réessayer.");
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
                transition={{ type: "spring", stiffness: 300 }}
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
                transition={{ type: "spring", stiffness: 300 }}
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
                transition={{ type: "spring", stiffness: 300 }}
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
                transition={{ type: "spring", stiffness: 300 }}
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
              className="drop-shadow-lg"
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
            <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-blue-900/10">
              {step === "email" && (
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
                    <h2 className="mb-3 text-3xl font-bold text-gray-900 lg:text-4xl">
                      Mot de passe oublié
                    </h2>
                    <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-800"></div>
                    <p className="mt-4 text-gray-600">
                      Entrez votre adresse email pour recevoir un lien de
                      récupération
                    </p>
                  </motion.div>

                  {/* Error Message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
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
                        <label className="mb-2 block text-base font-semibold text-gray-800">
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
                            "text-gray-900 placeholder:text-gray-500 pl-10 text-base",
                          inputWrapper:
                            "border-gray-300 bg-white hover:border-blue-400 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm",
                          base: "!text-gray-800",
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
              )}

              {step === "reset" && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
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
                      Créez un nouveau mot de passe sécurisé
                    </p>
                  </motion.div>

                  {/* Error Message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
                    >
                      {errorMessage}
                    </motion.div>
                  )}

                  {/* Password Form */}
                  <form
                    onSubmit={handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.5 }}
                    >
                      <div className="mb-2">
                        <label className="mb-2 block text-base font-semibold text-gray-800">
                          Nouveau mot de passe
                        </label>
                      </div>
                      <Input
                        {...register("newPassword", {
                          required: "Nouveau mot de passe requis",
                          minLength: {
                            value: 8,
                            message:
                              "Le mot de passe doit contenir au moins 8 caractères",
                          },
                        })}
                        type={isVisibleNewPassword ? "text" : "password"}
                        variant="bordered"
                        placeholder="••••••••"
                        classNames={{
                          input:
                            "text-gray-900 placeholder:text-gray-500 pl-10 pr-10 text-base",
                          inputWrapper:
                            "border-gray-300 bg-white hover:border-blue-400 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm",
                          base: "!text-gray-800",
                        }}
                        size="lg"
                        radius="lg"
                        isInvalid={!!errors.newPassword}
                        errorMessage={errors.newPassword?.message}
                        startContent={
                          <Lock className="h-5 w-5 text-gray-500" />
                        }
                        endContent={
                          <button
                            className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                            type="button"
                            onClick={toggleVisibilityNewPassword}
                          >
                            {isVisibleNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        }
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.6 }}
                    >
                      <div className="mb-2">
                        <label className="mb-2 block text-base font-semibold text-gray-800">
                          Confirmer le mot de passe
                        </label>
                      </div>
                      <Input
                        {...register("confirmPassword", {
                          required: "Confirmation du mot de passe requise",
                          validate: (value) =>
                            value === newPassword ||
                            "Les mots de passe ne correspondent pas",
                        })}
                        type={isVisibleConfirmPassword ? "text" : "password"}
                        variant="bordered"
                        placeholder="••••••••"
                        classNames={{
                          input:
                            "text-gray-900 placeholder:text-gray-500 pl-10 pr-10 text-base",
                          inputWrapper:
                            "border-gray-300 bg-white hover:border-blue-400 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm",
                          base: "!text-gray-800",
                        }}
                        size="lg"
                        radius="lg"
                        isInvalid={!!errors.confirmPassword}
                        errorMessage={errors.confirmPassword?.message}
                        startContent={
                          <Lock className="h-5 w-5 text-gray-500" />
                        }
                        endContent={
                          <button
                            className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none"
                            type="button"
                            onClick={toggleVisibilityConfirmPassword}
                          >
                            {isVisibleConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        }
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.7 }}
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
                            <Key className="h-5 w-5" />
                          )}
                          <span>
                            {isLoading
                              ? "Mise à jour en cours..."
                              : "Mettre à jour le mot de passe"}
                          </span>
                        </div>
                      </Button>
                    </motion.div>

                    <motion.div
                      className="text-center"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.8 }}
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
              )}

              {step === "success" && (
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
                    className="mb-4 text-3xl font-bold text-gray-900"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Mot de passe mis à jour !
                  </motion.h2>

                  <motion.p
                    className="mb-6 leading-relaxed text-gray-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Votre mot de passe a été mis à jour avec succès.
                    <br />
                    <span className="font-semibold text-primary">
                      Vous pouvez maintenant vous connecter avec votre nouveau
                      mot de passe.
                    </span>
                  </motion.p>

                  {/* Countdown */}
                  {countdown && (
                    <motion.div
                      className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <p className="mb-2 text-sm text-gray-600">
                        Redirection automatique dans
                      </p>
                      <motion.div
                        className="flex items-center justify-center gap-2 text-2xl font-bold text-primary"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Clock className="h-6 w-6" />
                        {countdown}s
                      </motion.div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <Link
                      href="/connexion"
                      className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retourner maintenant
                    </Link>
                  </motion.div>
                </motion.div>
              )}

              {/* Footer */}
              <motion.div
                className="mt-8 border-t border-gray-100 pt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <p className="text-sm text-gray-500">
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
