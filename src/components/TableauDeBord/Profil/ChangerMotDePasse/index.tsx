"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { Input, Checkbox } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { Lock, Eye, EyeOff, ArrowLeft, Save, Shield } from "lucide-react";
import { ProfessionalCard, ProfessionalButton, SectionHeader } from "@/components/UI/Professional";
import Link from "next/link";
import { UsersService, ChangePasswordData } from "@/services/users";
import { useAuth } from "@/context/AuthContext";

const ChangerMotDePasse = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [keepOtherSessionsActive, setKeepOtherSessionsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const router = useRouter();
  const { showNotification } = useSimpleNotifications();
  const { user } = useAuth();

  // Validation du mot de passe
  const validatePassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      setError(`Le mot de passe doit contenir au moins ${minLength} caractères`);
      return false;
    }
    if (!hasUpperCase) {
      setError("Le mot de passe doit contenir au moins une majuscule");
      return false;
    }
    if (!hasLowerCase) {
      setError("Le mot de passe doit contenir au moins une minuscule");
      return false;
    }
    if (!hasNumbers) {
      setError("Le mot de passe doit contenir au moins un chiffre");
      return false;
    }
    if (!hasSpecialChar) {
      setError("Le mot de passe doit contenir au moins un caractère spécial");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation des champs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    // Vérification de la correspondance des mots de passe
    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    // Validation du nouveau mot de passe
    if (!validatePassword(newPassword)) {
      return; // L'erreur est déjà définie dans validatePassword
    }

    // Vérifier que le nouveau mot de passe est différent de l'actuel
    if (currentPassword === newPassword) {
      setError("Le nouveau mot de passe doit être différent du mot de passe actuel");
      return;
    }

    // Vérifier que l'utilisateur est connecté
    if (!user || !user.id) {
      setError("Erreur : utilisateur non connecté");
      return;
    }

    setLoading(true);

    try {
      const passwordData: ChangePasswordData = {
        id: user.id,
        current_password: currentPassword,
        new_password: newPassword
      };

      console.log("🔐 Tentative de changement de mot de passe pour l'utilisateur:", user.id);
      
      const response = await UsersService.changePassword(passwordData);
      
      console.log("📡 Réponse API changement mot de passe:", response);
      
      // Vérifier le succès de la réponse
      if (response && (response.code === 200 || response.status === 'success')) {
        showNotification(simpleNotificationHelpers.success(
          "Succès",
          response?.message || "Mot de passe modifié avec succès"
        ));
        
        // Reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Si l'option est cochée, maintenir les autres sessions
        if (!keepOtherSessionsActive) {
          // Dans ce cas, on pourrait implémenter une déconnexion de toutes les autres sessions
          console.log("💡 Option: Déconnexion des autres sessions (non implémentée)");
        }
        
        // Navigate back to profile
        setTimeout(() => {
          router.push("/tableaudebord/profil/voir");
        }, 1500);
        
      } else {
        throw new Error(response?.message || "Erreur lors du changement de mot de passe");
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du changement de mot de passe:", error);
      
      let errorMessage = "Une erreur s'est produite lors du changement de mot de passe";
      
      if (error instanceof Error) {
        // Essayer d'extraire le message du backend d'abord
        try {
          const errorResponse = JSON.parse(error.message);
          errorMessage = errorResponse.message || errorMessage;
        } catch {
          // Si pas de JSON, utiliser la logique existante
          if (error.message.includes("mot de passe actuel")) {
            errorMessage = "Le mot de passe actuel est incorrect";
          } else if (error.message.includes("non connecté")) {
            errorMessage = "Vous devez être connecté pour changer votre mot de passe";
          } else if (error.message.includes("propre mot de passe")) {
            errorMessage = "Vous ne pouvez changer que votre propre mot de passe";
          } else {
            errorMessage = error.message;
          }
        }
      }
      
      setError(errorMessage);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        errorMessage
      ));
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrentPasswordVisibility = () => 
    setIsCurrentPasswordVisible(!isCurrentPasswordVisible);
  const toggleNewPasswordVisibility = () => 
    setIsNewPasswordVisible(!isNewPasswordVisible);
  const toggleConfirmPasswordVisibility = () => 
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

  return (
    <>
      <Breadcrumb pageName="Changer mot de passe" />
      <div className="mx-auto mt-5 w-full max-w-4xl">
        <div className="space-y-6">
          <SectionHeader
            title="Changer le Mot de Passe"
            subtitle="Mettez à jour votre mot de passe pour renforcer la sécurité de votre compte"
            icon={<Lock />}
            actions={
              <Link href="/tableaudebord/profil/voir">
                <ProfessionalButton
                  variant="outline"
                  startContent={<ArrowLeft className="h-4 w-4" />}
                >
                  Retour au profil
                </ProfessionalButton>
              </Link>
            }
          />

          <ProfessionalCard>
            <div className="space-y-8">
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}
              <Input
                type={isCurrentPasswordVisible ? "text" : "password"}
                label="Mot de passe actuel"
                variant="bordered"
                color="primary"
                placeholder="Entrer votre mot de passe actuel"
                className="text-base"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                labelPlacement="outside"
                size="lg"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleCurrentPasswordVisibility}
                  >
                    {isCurrentPasswordVisible ? (
                      <Eye className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                }
              />

              <Input
                type={isNewPasswordVisible ? "text" : "password"}
                label="Nouveau mot de passe"
                variant="bordered"
                color="primary"
                placeholder="Entrer le nouveau mot de passe"
                className="text-base"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                labelPlacement="outside"
                size="lg"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleNewPasswordVisibility}
                  >
                    {isNewPasswordVisible ? (
                      <Eye className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                }
              />

              <Input
                type={isConfirmPasswordVisible ? "text" : "password"}
                label="Confirmer le nouveau mot de passe"
                variant="bordered"
                color="primary"
                placeholder="Confirmer le nouveau mot de passe"
                className="text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                labelPlacement="outside"
                size="lg"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {isConfirmPasswordVisible ? (
                      <Eye className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                }
              />

              <div className="mt-4">
                <Checkbox
                  isSelected={keepOtherSessionsActive}
                  onValueChange={(checked) => setKeepOtherSessionsActive(checked)}
                  color="primary"
                  size="sm"
                  className="text-base"
                >
                  Maintenir les autres sessions actives
                </Checkbox>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Si décoché, vous serez déconnecté de tous les autres appareils
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                  <Link href="/tableaudebord/profil/voir">
                    <ProfessionalButton
                      variant="outline"
                      size="lg"
                      startContent={<ArrowLeft className="h-4 w-4" />}
                      isDisabled={loading}
                    >
                      Annuler
                    </ProfessionalButton>
                  </Link>
                  
                  <ProfessionalButton
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={loading}
                    startContent={!loading && <Save className="h-4 w-4" />}
                    isDisabled={!currentPassword || !newPassword || !confirmPassword}
                  >
                    {loading ? "Changement en cours..." : "Changer le Mot de Passe"}
                  </ProfessionalButton>
                </div>
              </div>
            </div>
          </ProfessionalCard>
          
          <ProfessionalCard>
            <SectionHeader
              title="Exigences de Sécurité"
              icon={<Shield />}
              variant="compact"
              color="primary"
              divider
            />
            
            <div className="mt-6">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ba9b7]"></div>
                  Au moins 8 caractères
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ba9b7]"></div>
                  Une majuscule (A-Z)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ba9b7]"></div>
                  Une minuscule (a-z)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ba9b7]"></div>
                  Un chiffre (0-9)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ba9b7]"></div>
                  Un caractère spécial (!@#$%^&*)
                </li>
              </ul>
            </div>
          </ProfessionalCard>
        </div>
      </div>
    </>
  );
};

export default ChangerMotDePasse;