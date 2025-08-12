"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { Button } from "@nextui-org/button";
import { Input, Checkbox } from "@nextui-org/react";
import { useRouter } from "next/navigation";

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

  const handleSubmit = () => {
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

    setLoading(true);

    // Simulate password change
    setTimeout(() => {
      alert("Mot de passe changé avec succès ! (Simulation)");
      setLoading(false);
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Navigate back to profile
      router.push("/tableaudebord/profil/voir");
    }, 1500);
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
      <div className="mx-auto mt-5 w-full max-w-2xl rounded-[10px]">
        <div className="mt-8 rounded-[20px] bg-white p-8 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-[28px] font-bold text-dark dark:text-white">
              Changer le mot de passe
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Entrez votre mot de passe actuel et choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-8">
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
                      <svg
                        className="text-2xl text-default-400"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="text-2xl text-default-400"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 19.5c-4.73 0-8.76-2.93-10.5-7 1.74-4.07 5.77-7 10.5-7s8.76 2.93 10.5 7c-1.74 4.07-5.77 7-10.5 7zm0-14c-3.86 0-7.21 2.08-9 5 1.79 2.92 5.14 5 9 5s7.21-2.08 9-5c-1.79-2.92-5.14-5-9-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"
                          fill="currentColor"
                        />
                        <path
                          d="M2 4L22 20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
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
                      <svg
                        className="text-2xl text-default-400"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="text-2xl text-default-400"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 19.5c-4.73 0-8.76-2.93-10.5-7 1.74-4.07 5.77-7 10.5-7s8.76 2.93 10.5 7c-1.74 4.07-5.77 7-10.5 7zm0-14c-3.86 0-7.21 2.08-9 5 1.79 2.92 5.14 5 9 5s7.21-2.08 9-5c-1.79-2.92-5.14-5-9-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"
                          fill="currentColor"
                        />
                        <path
                          d="M2 4L22 20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
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
                      <svg
                        className="text-2xl text-default-400"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="text-2xl text-default-400"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 19.5c-4.73 0-8.76-2.93-10.5-7 1.74-4.07 5.77-7 10.5-7s8.76 2.93 10.5 7c-1.74 4.07-5.77 7-10.5 7zm0-14c-3.86 0-7.21 2.08-9 5 1.79 2.92 5.14 5 9 5s7.21-2.08 9-5c-1.79-2.92-5.14-5-9-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"
                          fill="currentColor"
                        />
                        <path
                          d="M2 4L22 20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                }
              />

              <div className="mt-4">
                <Checkbox
                  isSelected={keepOtherSessionsActive}
                  onChange={(checked) => setKeepOtherSessionsActive(checked)}
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

              <div className="mt-8 flex gap-4">
                <Button
                  color="primary"
                  className="h-12 flex-1 text-base font-medium"
                  variant="solid"
                  size="lg"
                  onClick={handleSubmit}
                  isDisabled={loading}
                >
                  {loading ? "Changement en cours..." : "Changer le mot de passe"}
                </Button>
                <Button
                  color="default"
                  className="h-12 flex-1 text-base font-medium"
                  variant="bordered"
                  size="lg"
                  onClick={() => router.push("/tableaudebord/profil/voir")}
                  isDisabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white">
              Exigences du mot de passe :
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Au moins 8 caractères</li>
              <li>• Une majuscule (A-Z)</li>
              <li>• Une minuscule (a-z)</li>
              <li>• Un chiffre (0-9)</li>
              <li>• Un caractère spécial (!@#$%^&*)</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangerMotDePasse;