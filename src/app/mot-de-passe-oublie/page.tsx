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
} from "lucide-react";
import { useForm } from "react-hook-form";

interface ForgotPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const MotDePasseOublie = () => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isVisibleNewPassword, setIsVisibleNewPassword] = useState(false);
  const [isVisibleConfirmPassword, setIsVisibleConfirmPassword] =
    useState(false);
  const router = useRouter();

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

  const onSubmit = async (data: ForgotPasswordForm) => {
    // Simulate password update
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStep("success");

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
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
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
      },
    },
  };

  const floatingIcons = [
    { Icon: Shield, delay: 0, position: { left: "15%", top: "20%" } },
    { Icon: Key, delay: 0.8, position: { right: "20%", top: "30%" } },
    { Icon: RefreshCw, delay: 1.2, position: { left: "10%", bottom: "25%" } },
  ];

  return (
    <div className="mot-de-passe-oublie relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-secondary-900">
      {/* Animated Background Particles */}
      <div className="floating-particles absolute inset-0 z-0"></div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, position }, index) => (
        <motion.div
          key={index}
          className="absolute hidden text-white/10 lg:block"
          style={position}
          animate={{
            y: [-15, 15, -15],
            rotate: [0, 180, 360],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 6,
            delay: delay,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Icon size={35} />
        </motion.div>
      ))}

      <div className="relative z-10 flex min-h-screen">
        {/* Left Panel - Hero Section */}
        <motion.div
          className="relative hidden flex-col items-center justify-center p-6 lg:flex lg:w-1/2"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Enterprise Space Card with Background Image */}
          <motion.div
            className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-3xl text-center"
            variants={itemVariants}
          >
            {/* Animated Background Image */}
            <motion.div
              className="absolute inset-0 z-0"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Image
                src="/images/slider/new/reseau&securite1.jpg"
                alt="Espace Entreprise"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-primary-900/70 to-secondary-900/80"></div>
            </motion.div>

            {/* Content Overlay */}
            <motion.div
              className="relative z-10 flex h-full flex-col justify-center p-8"
              variants={itemVariants}
            >
              {/* Logo */}
              <motion.div
                className="mb-6 flex justify-center"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src="/images/logo/logo.png"
                  alt="DATALYS Consulting"
                  width={140}
                  height={90}
                  className="drop-shadow-2xl"
                />
              </motion.div>

              {/* Message d'interpellation */}
              <motion.div
                className="mb-6 rounded-2xl border border-white/20 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-secondary-500/20 p-4 backdrop-blur-sm"
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex-shrink-0 rounded-full border border-primary-400/30 bg-primary-500/30 p-3">
                    <Key className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <p className="mb-2 text-base font-bold text-white/90">
                      🔐 Sécurité renforcée
                    </p>
                    <p className="text-base leading-relaxed text-white/70">
                      Cette page vous permet de mettre à jour votre mot de passe
                      directement. Assurez-vous de choisir un mot de passe fort
                      et unique pour sécuriser votre compte.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Reset Form */}
        <motion.div
          className="relative flex w-full items-center justify-center p-6 lg:w-1/2"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Mobile Logo */}
          <motion.div
            className="absolute left-1/2 top-8 z-20 -translate-x-1/2 transform lg:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Image
              src="/images/logo/logo-2.png"
              width={120}
              height={120}
              alt="DATALYS"
              className="drop-shadow-xl"
            />
          </motion.div>

          {/* Reset Card */}
          <motion.div
            className="flex h-full w-full items-center justify-center lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Glass Card */}
            <div className="via-white/8 hover:shadow-3xl relative flex h-full w-full flex-col justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-white/30 hover:shadow-black/30">
              {/* Animated border glow */}
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-primary-400/20 via-secondary-400/20 to-accent-400/20 opacity-0 transition-opacity duration-500 hover:opacity-100"></div>

              {/* Subtle inner glow */}
              <div className="absolute inset-1 rounded-3xl bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5"></div>

              <div>
                {step === "form" ? (
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
                      <h2 className="mb-3 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-3xl font-bold text-transparent text-white lg:text-4xl">
                        Mise à jour du mot de passe
                      </h2>
                      <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 shadow-lg shadow-primary-400/25"></div>
                      <p className="mt-4 text-sm font-medium text-white/60">
                        Entrez votre nouveau mot de passe
                      </p>
                    </motion.div>

                    {/* Form */}
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="flex flex-col items-center space-y-7"
                    >
                      {/* New Password Input */}
                      <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.6 }}
                        className="w-full max-w-sm"
                      >
                        <div className="input-focus-effect group relative">
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
                            label="Nouveau mot de passe"
                            variant="bordered"
                            placeholder="••••••••"
                            classNames={{
                              input:
                                "text-white placeholder:text-white/50 pl-10 pr-10",
                              inputWrapper:
                                "border-white/20 bg-white/5 backdrop-blur-md hover:border-primary-400 focus-within:border-primary-400 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-400/20",
                              label:
                                "!text-white !font-semibold text-base [&]:text-white [&]:font-semibold",
                              base: "!text-white",
                            }}
                            size="lg"
                            radius="lg"
                            isInvalid={!!errors.newPassword}
                            errorMessage={errors.newPassword?.message}
                            startContent={
                              <Lock className="h-5 w-5 flex-shrink-0 text-white/60 transition-colors duration-300 group-hover:text-primary-400" />
                            }
                            endContent={
                              <motion.button
                                className="text-white/60 transition-colors hover:text-primary-400 focus:outline-none"
                                type="button"
                                onClick={toggleVisibilityNewPassword}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {isVisibleNewPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </motion.button>
                            }
                          />
                        </div>
                      </motion.div>

                      {/* Confirm Password Input */}
                      <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.7 }}
                        className="w-full max-w-sm"
                      >
                        <div className="input-focus-effect group relative">
                          <Input
                            {...register("confirmPassword", {
                              required: "Confirmation du mot de passe requise",
                              validate: (value) =>
                                value === newPassword ||
                                "Les mots de passe ne correspondent pas",
                            })}
                            type={
                              isVisibleConfirmPassword ? "text" : "password"
                            }
                            label="Confirmer le mot de passe"
                            variant="bordered"
                            placeholder="••••••••"
                            classNames={{
                              input:
                                "text-white placeholder:text-white/50 pl-10 pr-10",
                              inputWrapper:
                                "border-white/20 bg-white/5 backdrop-blur-md hover:border-primary-400 focus-within:border-primary-400 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-400/20",
                              label:
                                "!text-white !font-semibold text-base [&]:text-white [&]:font-semibold",
                              base: "!text-white",
                            }}
                            size="lg"
                            radius="lg"
                            isInvalid={!!errors.confirmPassword}
                            errorMessage={errors.confirmPassword?.message}
                            startContent={
                              <Lock className="h-5 w-5 flex-shrink-0 text-white/60 transition-colors duration-300 group-hover:text-primary-400" />
                            }
                            endContent={
                              <motion.button
                                className="text-white/60 transition-colors hover:text-primary-400 focus:outline-none"
                                type="button"
                                onClick={toggleVisibilityConfirmPassword}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {isVisibleConfirmPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </motion.button>
                            }
                          />
                        </div>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.8 }}
                        className="w-full max-w-sm"
                      >
                        <Button
                          type="submit"
                          className="w-full rounded-2xl border-0 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 py-5 text-lg font-bold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-primary-600 hover:via-primary-700 hover:to-secondary-600 hover:shadow-2xl hover:shadow-primary-500/40"
                          size="lg"
                        >
                          <div className="flex items-center justify-center gap-3">
                            <Key className="h-5 w-5" />
                            <span>Mettre à jour le mot de passe</span>
                          </div>
                        </Button>
                      </motion.div>

                      {/* Back to Login */}
                      <motion.div
                        className="text-center"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.9 }}
                      >
                        <Link
                          href="/connexion"
                          className="group inline-flex items-center gap-2 font-medium text-white/70 transition-all duration-300 hover:text-white hover:underline hover:shadow-sm hover:shadow-white/25"
                        >
                          <motion.div
                            whileHover={{ x: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </motion.div>
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
                      className="mb-4 text-3xl font-bold text-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Mot de passe mis à jour !
                    </motion.h2>

                    <motion.p
                      className="mb-6 leading-relaxed text-white/80"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      Votre mot de passe a été mis à jour avec succès.
                      <br />
                      <span className="font-semibold text-accent-400">
                        Vous pouvez maintenant vous connecter avec votre nouveau
                        mot de passe.
                      </span>
                    </motion.p>

                    {/* Countdown */}
                    {countdown && (
                      <motion.div
                        className="glassmorphism-dark mb-6 rounded-xl p-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <p className="mb-2 text-sm text-white/80">
                          Redirection automatique dans
                        </p>
                        <motion.div
                          className="flex items-center justify-center gap-2 text-2xl font-bold text-accent-400"
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
                        className="inline-flex items-center gap-2 font-medium text-white/70 transition-colors hover:text-white"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retourner maintenant
                      </Link>
                    </motion.div>
                  </motion.div>
                )}

                {/* Footer */}
                <motion.div
                  className="mt-10 border-t border-white/10 pt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <p className="text-sm text-white/60">
                    All Rights Reserved by{" "}
                    <Link
                      href="https://www.datalysconsulting.com/"
                      className="font-semibold text-accent-400 transition-all duration-300 hover:text-accent-300 hover:underline hover:shadow-sm hover:shadow-accent-400/25"
                      target="_blank"
                    >
                      DATALYS Consulting
                    </Link>
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MotDePasseOublie;
