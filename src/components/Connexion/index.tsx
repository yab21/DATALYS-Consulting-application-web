"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input, Checkbox } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Database,
  BarChart3,
  Brain,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Connexion: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const { register } = useForm<LoginForm>();

  const toggleVisibility = () => setIsVisible(!isVisible);

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
    { Icon: Database, delay: 0 },
    { Icon: BarChart3, delay: 0.5 },
    { Icon: Brain, delay: 1 },
    { Icon: Zap, delay: 1.5 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-secondary-900">
      {/* Animated Background Particles */}
      <div className="floating-particles absolute inset-0 z-0"></div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay }, index) => (
        <motion.div
          key={index}
          className="absolute text-white/10"
          style={{
            left: `${20 + index * 20}%`,
            top: `${30 + index * 10}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4,
            delay: delay,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Icon size={40} />
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

              {/* Main Title */}
              <motion.h1
                className="mb-4 text-4xl font-bold leading-tight text-white"
                variants={itemVariants}
              >
                Espace <span className="text-accent-300">Entreprise</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="mb-8 text-lg leading-relaxed text-white/90"
                variants={itemVariants}
              >
                Transformez votre espace de travail numérique avec nos solutions
                innovantes
              </motion.p>

              {/* Feature Grid */}
              <motion.div
                className="grid grid-cols-2 gap-3 text-left"
                variants={itemVariants}
              >
                <motion.div
                  className="glassmorphism-dark rounded-xl p-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-400">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Pro activité
                    </h3>
                  </div>
                  <p className="text-xs text-white/80">
                    Anticipation et résolution proactive
                  </p>
                </motion.div>

                <motion.div
                  className="glassmorphism-dark rounded-xl p-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-400">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Efficacité
                    </h3>
                  </div>
                  <p className="text-xs text-white/80">
                    Performance maximale optimisée
                  </p>
                </motion.div>

                <motion.div
                  className="glassmorphism-dark rounded-xl p-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-400">
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Gestion Simplifiée
                    </h3>
                  </div>
                  <p className="text-xs text-white/80">
                    Interface intuitive et efficace
                  </p>
                </motion.div>

                <motion.div
                  className="glassmorphism-dark rounded-xl p-3"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-400">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Support 24/7
                    </h3>
                  </div>
                  <p className="text-xs text-white/80">
                    Assistance technique permanente
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Login Form */}
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

          {/* Login Card */}
          <motion.div
            className="mt-20 flex h-full w-full items-center justify-center lg:mt-0"
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
                {/* Header */}
                <motion.div
                  className="mb-8 text-center"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="mb-3 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-3xl font-bold text-transparent text-white lg:text-4xl">
                    Connexion
                  </h2>
                  <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 shadow-lg shadow-primary-400/25"></div>
                  <p className="mt-4 text-sm font-medium text-white/60">
                    Accédez à votre espace entreprise
                  </p>
                </motion.div>

                {/* Form */}
                <div className="flex flex-col items-center space-y-7">
                  {/* Email Input */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-sm"
                  >
                    <div className="input-focus-effect group relative">
                      <Input
                        {...register("email")}
                        type="email"
                        label="Adresse email"
                        variant="bordered"
                        placeholder="entrer@votre-email.com"
                        classNames={{
                          input: "text-white placeholder:text-white/50 pl-10",
                          inputWrapper:
                            "border-white/20 bg-white/5 backdrop-blur-md hover:border-primary-400 focus-within:border-primary-400 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-400/20",
                          label: "text-white/90 font-medium",
                        }}
                        size="lg"
                        radius="xl"
                        startContent={
                          <Mail className="h-5 w-5 flex-shrink-0 text-white/60 transition-colors duration-300 group-hover:text-primary-400" />
                        }
                      />
                    </div>
                  </motion.div>

                  {/* Password Input */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.7 }}
                    className="w-full max-w-sm"
                  >
                    <div className="input-focus-effect group relative">
                      <Input
                        {...register("password")}
                        type={isVisible ? "text" : "password"}
                        label="Mot de passe"
                        variant="bordered"
                        placeholder="••••••••"
                        classNames={{
                          input:
                            "text-white placeholder:text-white/50 pl-10 pr-10",
                          inputWrapper:
                            "border-white/20 bg-white/5 backdrop-blur-md hover:border-primary-400 focus-within:border-primary-400 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary-400/20",
                          label: "text-white/90 font-medium",
                        }}
                        size="lg"
                        radius="xl"
                        startContent={
                          <Lock className="h-5 w-5 flex-shrink-0 text-white/60 transition-colors duration-300 group-hover:text-primary-400" />
                        }
                        endContent={
                          <motion.button
                            className="text-white/60 transition-colors hover:text-primary-400 focus:outline-none"
                            type="button"
                            onClick={toggleVisibility}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {isVisible ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </motion.button>
                        }
                      />
                    </div>
                  </motion.div>

                  {/* Remember Me & Forgot Password */}
                  <motion.div
                    className="flex w-full max-w-sm items-center justify-between text-sm"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.8 }}
                  >
                    <Checkbox
                      {...register("rememberMe")}
                      classNames={{
                        base: "text-white/80",
                        wrapper:
                          "before:border-white/30 after:bg-primary-500 hover:before:border-primary-400 transition-colors duration-300",
                        label:
                          "text-white/80 text-sm hover:text-white/90 transition-colors duration-300",
                      }}
                    >
                      Se souvenir de moi
                    </Checkbox>
                    <Link
                      href="/mot-de-passe-oublie"
                      className="font-medium text-accent-400 transition-all duration-300 hover:text-accent-300 hover:underline hover:shadow-sm hover:shadow-accent-400/25"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </motion.div>

                  {/* Login Button */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.9 }}
                    className="w-full max-w-sm"
                  >
                    <Link href="/tableaudebord">
                      <Button
                        className="w-full rounded-2xl border-0 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 py-5 text-lg font-bold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-primary-600 hover:via-primary-700 hover:to-secondary-600 hover:shadow-2xl hover:shadow-primary-500/40"
                        size="lg"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <span>Se connecter</span>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <ArrowRight className="h-5 w-5" />
                          </motion.div>
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                  className="mt-10 border-t border-white/10 pt-6 text-center"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 1 }}
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

export default Connexion;
