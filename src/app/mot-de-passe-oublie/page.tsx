"use client";

import React, { useState } from "react";
import { Input } from "@nextui-org/react";
import { Button } from "@nextui-org/button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle,
  Clock,
  Shield,
  Key,
  RefreshCw
} from "lucide-react";
import { useForm } from "react-hook-form";

interface ForgotPasswordForm {
  email: string;
}

const MotDePasseOublie = () => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [countdown, setCountdown] = useState<number | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (_data: ForgotPasswordForm) => {
    // Simulate sending password reset email
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStep('success');
    
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const floatingIcons = [
    { Icon: Shield, delay: 0, position: { left: '15%', top: '20%' } },
    { Icon: Key, delay: 0.8, position: { right: '20%', top: '30%' } },
    { Icon: RefreshCw, delay: 1.2, position: { left: '10%', bottom: '25%' } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-secondary-900 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="floating-particles absolute inset-0 z-0"></div>
      
      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, position }, index) => (
        <motion.div
          key={index}
          className="absolute text-white/10 hidden lg:block"
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

      <div className="flex min-h-screen relative z-10">
        {/* Left Panel - Hero Section */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative p-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Glassmorphism Card */}
          <motion.div 
            className="glassmorphism rounded-3xl p-8 w-full h-full flex flex-col justify-center text-center relative"
            variants={itemVariants}
          >
            <motion.div variants={itemVariants}>
              {/* Logo */}
              <motion.div
                className="mb-6 flex justify-center"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src="/images/logo/logo.png"
                  alt="DATALYS Consulting"
                  width={180}
                  height={120}
                  className="drop-shadow-xl"
                />
              </motion.div>

              {/* Icon */}
              <motion.div
                className="flex justify-center mb-4"
                variants={itemVariants}
              >
                <div className="p-4 rounded-full glassmorphism-dark">
                  <Key className="w-8 h-8 text-accent-400" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-3xl font-bold mb-4 gradient-text leading-tight"
                variants={itemVariants}
              >
                Réinitialisation
                <br />
                Sécurisée
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-white/80 text-base mb-6 leading-relaxed"
                variants={itemVariants}
              >
                Un processus simple et sécurisé pour récupérer l'accès à votre compte.
                <span className="text-accent-400 font-semibold"> Protection maximale garantie.</span>
              </motion.p>

              {/* Security Features */}
              <motion.div 
                className="flex flex-wrap gap-2 justify-center"
                variants={itemVariants}
              >
                {[
                  { icon: Shield, text: "Sécurisé" },
                  { icon: Clock, text: "Rapide" },
                  { icon: CheckCircle, text: "Fiable" }
                ].map(({ icon: FeatureIcon, text }) => (
                  <div
                    key={text}
                    className="glassmorphism-dark px-3 py-1 rounded-full text-xs text-white/90 font-medium flex items-center gap-1"
                  >
                    <FeatureIcon className="w-3 h-3 text-accent-400" />
                    {text}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Reset Form */}
        <motion.div 
          className="w-full lg:w-1/2 flex items-center justify-center relative p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2 z-20"
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
            className="w-full h-full flex items-center justify-center mt-20 lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Glass Card */}
            <div className="glassmorphism rounded-3xl p-8 w-full h-full flex flex-col justify-center relative">
              
              <div>
                {step === 'form' ? (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Header */}
                    <motion.div 
                      className="text-center mb-6"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                        Mot de passe oublié
                      </h2>
                      <p className="text-white/70 text-sm">
                        Entrez votre email pour réinitialiser votre mot de passe
                      </p>
                      <div className="w-16 h-0.5 bg-gradient-to-r from-accent-400 to-secondary-400 rounded-full mx-auto mt-3"></div>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center space-y-6">
                      {/* Email Input */}
                      <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.6 }}
                        className="w-full max-w-sm"
                      >
                        <div className="input-focus-effect relative">
                          <Input
                            {...register("email", { 
                              required: "Email requis",
                              pattern: {
                                value: /^\S+@\S+$/i,
                                message: "Email invalide"
                              }
                            })}
                            type="email"
                            label="Adresse email"
                            variant="bordered"
                            placeholder="entrer@votre-email.com"
                            classNames={{
                              input: "text-white placeholder:text-white/50 pl-10",
                              inputWrapper: "border-white/20 bg-white/5 backdrop-blur-md hover:border-accent-400 focus-within:border-accent-400",
                              label: "text-white/90 font-medium"
                            }}
                            size="lg"
                            radius="lg"
                            isInvalid={!!errors.email}
                            errorMessage={errors.email?.message}
                            startContent={
                              <Mail className="h-5 w-5 flex-shrink-0 text-white/60" />
                            }
                          />
                        </div>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.div
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.7 }}
                        className="w-full max-w-sm"
                      >
                        <Button
                          type="submit"
                          className="w-full btn-3d bg-gradient-to-r from-accent-500 to-secondary-500 text-white font-semibold py-4 text-lg rounded-xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300"
                          size="lg"
                        >
                          <div className="flex items-center justify-center gap-3">
                            <Mail className="w-5 h-5" />
                            <span>Envoyer le lien</span>
                          </div>
                        </Button>
                      </motion.div>

                      {/* Back to Login */}
                      <motion.div
                        className="text-center"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.8 }}
                      >
                        <Link
                          href="/connexion"
                          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium group"
                        >
                          <motion.div
                            whileHover={{ x: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <ArrowLeft className="w-4 h-4" />
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
                        delay: 0.2 
                      }}
                    >
                      <motion.div
                        className="p-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 relative"
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(34, 197, 94, 0.4)",
                            "0 0 40px rgba(34, 197, 94, 0.6)",
                            "0 0 20px rgba(34, 197, 94, 0.4)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <CheckCircle className="w-12 h-12 text-white" />
                      </motion.div>
                    </motion.div>

                    <motion.h2
                      className="text-3xl font-bold text-white mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Email envoyé !
                    </motion.h2>

                    <motion.p
                      className="text-white/80 mb-6 leading-relaxed"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      Un lien de réinitialisation a été envoyé à votre adresse email.
                      <br />
                      <span className="text-accent-400 font-semibold">
                        Vérifiez aussi vos spams !
                      </span>
                    </motion.p>

                    {/* Countdown */}
                    {countdown && (
                      <motion.div
                        className="glassmorphism-dark rounded-xl p-4 mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <p className="text-white/80 text-sm mb-2">
                          Redirection automatique dans
                        </p>
                        <motion.div
                          className="text-2xl font-bold text-accent-400 flex items-center justify-center gap-2"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Clock className="w-6 h-6" />
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
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Retourner maintenant
                      </Link>
                    </motion.div>
                  </motion.div>
                )}

                {/* Footer */}
                <motion.div
                  className="text-center mt-8 pt-6 border-t border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <p className="text-white/60 text-sm">
                    All Rights Reserved by{" "}
                    <Link
                      href="https://www.datalysconsulting.com/"
                      className="text-accent-400 hover:text-accent-300 font-semibold transition-colors"
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