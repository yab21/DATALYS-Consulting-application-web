"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input, Checkbox } from "@heroui/react";
import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import VerificationMFA from "@/components/Auth/VerificationMFA";
import { resetInterceptorState } from "@/lib/api-interceptor";

interface LoginForm {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

const Connexion: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMFA, setShowMFA] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const { start, finish } = useTopBarProgress();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  // Afficher un message si l'utilisateur a été redirigé suite à une expiration de session
  useEffect(() => {
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      // Réinitialiser l'état de l'intercepteur
      resetInterceptorState();

      // Afficher la notification
      showNotification(simpleNotificationHelpers.warning(
        "Session expirée",
        "Votre session a expiré. Veuillez vous reconnecter."
      ));

      // Nettoyer l'URL sans recharger la page
      const url = new URL(window.location.href);
      url.searchParams.delete('expired');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams, showNotification]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (data: LoginForm) => {
    start();
    setIsLoading(true);
    setError("");

    try {
      // D'abord, utiliser AuthService pour vérifier la première connexion
      const result = await AuthService.login({
        identifier: data.identifier,
        password: data.password,
      });

      if (result.status === "success") {
        // Vérifier si MFA est requis
        if (result.data?.requires_mfa) {
          finish();
          setIsLoading(false);
          setPendingIdentifier(data.identifier);
          setShowMFA(true);
          
          showNotification(simpleNotificationHelpers.info(
            "Authentification",
            result.data.message
          ));
          return;
        }
        
        // Vérifier si l'utilisateur doit changer son mot de passe
        if (result.data?.requires_password_change) {
          showNotification(simpleNotificationHelpers.warning(
            "Mot de passe",
            result.message || "Changement de mot de passe requis"
          ));
          
          // Rediriger vers la page de changement de mot de passe
          setTimeout(() => {
            setIsLoading(false);
            finish(); // Terminer la progress bar avant la redirection
            router.push(`/changer-mot-de-passe-temporaire?email=${encodeURIComponent(data.identifier)}`);
          }, 1500);
          return;
        }

        // Connexion normale : utiliser le contexte d'authentification
        await login(data.identifier, data.password);
        
        if (data.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
        
        showNotification(simpleNotificationHelpers.success(
          "Succès",
          result.message || "Connexion réussie"
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
        setError(result.message || "Erreur lors de la connexion");
        showNotification(simpleNotificationHelpers.error(
          "Erreur",
          result.message || "Vérifiez vos identifiants et réessayez"
        ));
      }
    } catch (error) {
      finish();
      setIsLoading(false);
      console.error("Erreur de connexion:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        "Problème de réseau. Vérifiez votre connexion internet"
      ));
    }
  };

  const handleBackFromMFA = () => {
    setShowMFA(false);
    setPendingIdentifier("");
    setError("");
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
              Espace <span className="text-blue-200">Entreprise</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mb-12 max-w-md text-lg leading-relaxed text-blue-100 lg:text-xl"
              variants={itemVariants}
            >
              Transformez votre espace de travail numérique avec nos solutions
              innovantes et sécurisées
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
                  Sécurité Avancée
                </h3>
                <p className="text-xs text-blue-100">
                  Protection des données et accès sécurisé
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <TrendingUp className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Performance
                </h3>
                <p className="text-xs text-blue-100">
                  Optimisation et efficacité maximale
                </p>
              </motion.div>

              <motion.div
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring" as const, stiffness: 300 }}
              >
                <div className="mb-3 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-800/20">
                    <Users className="h-5 w-5 text-blue-200" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  Collaboration
                </h3>
                <p className="text-xs text-blue-100">
                  Travail d'équipe simplifié
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
                  Support 24/7
                </h3>
                <p className="text-xs text-blue-100">
                  Assistance technique permanente
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Login Form */}
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

          {/* Login Form Container */}
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
                  Connexion
                </h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-800"></div>
                <p className="mt-4 text-gray-600">
                  Accédez à votre espace entreprise
                </p>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="rounded-lg bg-red-50 p-4 border border-red-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 font-medium">{error}</span>
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800">
                      Identifiant
                    </label>
                  </div>
                  <Input
                    {...register("identifier", {
                      required: "L'identifiant est requis",
                      pattern: {
                        value: /^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|[A-Z0-9]+)$/i,
                        message: "Format d'identifiant invalide (email ou code client)"
                      }
                    })}
                    id="login-identifier"
                    type="text"
                    variant="bordered"
                    placeholder="email@exemple.com ou DTLS9UG6X8"
                    isInvalid={!!errors.identifier}
                    errorMessage={errors.identifier?.message}
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
                  />
                </motion.div>

                {/* Password Input */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.6 }}
                >
                  <div className="mb-2">
                    <label className="mb-2 block text-base font-semibold text-gray-800">
                      Mot de passe
                    </label>
                  </div>
                  <Input
                    {...register("password", {
                      required: "Le mot de passe est requis",
                      minLength: {
                        value: 6,
                        message: "Le mot de passe doit contenir au moins 6 caractères"
                      }
                    })}
                    id="login-password"
                    type={isVisible ? "text" : "password"}
                    variant="bordered"
                    placeholder="••••••••"
                    isInvalid={!!errors.password}
                    errorMessage={errors.password?.message}
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
                        onClick={toggleVisibility}
                      >
                        {isVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                </motion.div>

                {/* Remember Me & Forgot Password */}
                <motion.div
                  className="flex items-center justify-between"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.7 }}
                >
                  <Checkbox
                    {...register("rememberMe")}
                    id="login-remember-me"
                    classNames={{
                      base: "text-gray-800",
                      wrapper:
                        "before:border-gray-400 after:bg-primary hover:before:border-primary transition-colors duration-300",
                      label:
                        "text-gray-800 text-sm font-medium hover:text-gray-900 transition-colors duration-300",
                    }}
                  >
                    Se souvenir de moi
                  </Checkbox>
                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-sm font-semibold text-primary transition-colors duration-300 hover:text-primary-800 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </motion.div>

                {/* Login Button */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    isDisabled={isLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-800 py-6 text-lg font-semibold text-white shadow-lg shadow-primary-800/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-800/40 disabled:opacity-70 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {!isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Se connecter</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    ) : (
                      <span>Connexion en cours...</span>
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
                transition={{ delay: 0.9 }}
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

export default Connexion;
