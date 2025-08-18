"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
  CheckCircle 
} from "lucide-react";
import { API_CONFIG, buildApiUrl, getDefaultHeaders } from "@/lib/api-config";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/UI/Notifications/NotificationSystem";

interface PasswordChangeData {
  email: string;
  current_password: string;
  new_password: string;
}

const ChangerMotDePasseTemporaire: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithUserData } = useAuth();
  const { showNotification } = useNotifications();

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
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.CHANGE_TEMP_PASSWORD), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          email: formData.email,
          current_password: formData.current_password,
          new_password: formData.new_password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        showNotification({
          type: "success",
          title: "Mot de passe mis à jour",
          message: "Votre mot de passe a été changé avec succès. Connexion automatique...",
          duration: 3000,
        });

        // Connexion automatique avec le nouveau token
        if (data.data && data.data.token) {
          await loginWithUserData(data.data);
          
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
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      
      let errorMessage = "Une erreur s'est produite lors du changement de mot de passe";
      
      if (error.message.includes('401')) {
        errorMessage = "Mot de passe actuel incorrect";
        setErrors({ current_password: "Mot de passe incorrect" });
      } else if (error.message.includes('400')) {
        errorMessage = "Données de formulaire invalides";
      }

      showNotification({
        type: "error",
        title: "Erreur",
        message: errorMessage,
        duration: 5000,
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Changement de mot de passe
              </h1>
              <p className="text-gray-600 text-sm">
                Vous devez changer votre mot de passe temporaire pour continuer
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                label="Email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                variant="bordered"
                size="lg"
                className="mb-4"
                isReadOnly={!!searchParams?.get("email")}
              />

              <Input
                type={showCurrentPassword ? "text" : "password"}
                label="Mot de passe actuel"
                placeholder="Entrez votre mot de passe temporaire"
                value={formData.current_password}
                onChange={(e) => handleInputChange("current_password", e.target.value)}
                isInvalid={!!errors.current_password}
                errorMessage={errors.current_password}
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="focus:outline-none"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                className="mb-4"
              />

              <Input
                type={showNewPassword ? "text" : "password"}
                label="Nouveau mot de passe"
                placeholder="Choisissez un nouveau mot de passe"
                value={formData.new_password}
                onChange={(e) => handleInputChange("new_password", e.target.value)}
                isInvalid={!!errors.new_password}
                errorMessage={errors.new_password}
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="focus:outline-none"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                className="mb-4"
              />

              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Confirmer le nouveau mot de passe"
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
                startContent={<CheckCircle className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                }
                variant="bordered"
                size="lg"
                className="mb-6"
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Changement en cours..." : "Changer le mot de passe"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Besoin d'aide ?{" "}
                <Link 
                  href="/connexion" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Retour à la connexion
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ChangerMotDePasseTemporaire;