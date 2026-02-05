"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { Button } from "@heroui/button";
import { Input } from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import { domaines } from "./domaineData";
import { Eye, EyeOff } from "lucide-react";
import { useSimpleNotifications } from "@/context/NotificationContext";

const ModifierCompte = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    utilisateur: "",
    email: "",
    motdepasse: "",
    cmotdepasse: "",
    domaine: [] as string[], // Utiliser un tableau de chaînes de caractères pour les domaines
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const { addNotification } = useSimpleNotifications();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selected: any) => {
    // Convertir les éléments sélectionnés en tableau
    const selectedArray = selected instanceof Set ? Array.from(selected) : Array.from(selected);
    setFormData({ ...formData, domaine: selectedArray });
  };

  const handleSubmit = async () => {
    setError(null);

    // Vérifier que tous les champs sont remplis
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.utilisateur ||
      !formData.email ||
      !formData.motdepasse ||
      !formData.cmotdepasse ||
      formData.domaine.length === 0
    ) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    // Vérifier que les mots de passe correspondent
    if (formData.motdepasse !== formData.cmotdepasse) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // Simulation de modification de profil (remplace Firebase)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedProfile = {
        id: `user-${Date.now()}`,
        nom: formData.nom,
        prenom: formData.prenom,
        utilisateur: formData.utilisateur,
        email: formData.email,
        domaine: formData.domaine,
        updatedAt: new Date(),
      };

      console.log("Profil mis à jour :", updatedProfile);
      
      addNotification({
        title: "Profil mis à jour",
        body: "Votre profil a été modifié avec succès",
        type: "success",
        priority: "medium",
        category: "user",
        read: false,
      });

      // Reset password fields for security
      setFormData(prev => ({
        ...prev,
        motdepasse: "",
        cmotdepasse: "",
      }));
      
    } catch (error: any) {
      console.error("Erreur lors de la modification du profil :", error);
      setError("Erreur lors de la modification du profil. Veuillez réessayer.");
      
      addNotification({
        title: "Erreur de modification",
        body: "Une erreur est survenue lors de la modification du profil",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Modifier votre compte" />
      <div className="mt-5 w-full max-w-full rounded-[10px]">
        <div className="mt-8 rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="w-full max-w-full p-2">
            <h3 className="pt-2 text-[22px] font-medium text-dark dark:text-white">
              Modifier votre compte
            </h3>
          </div>
          <div className="mt-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 gap-2 px-2 py-6 md:grid-cols-2 md:gap-4 md:py-4">
              <Input
                type="text"
                label="Nom"
                variant="bordered"
                placeholder="Entrer votre nom"
                className="text-sm font-medium md:text-base"
                name="nom"
                size="lg"
                onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Prénom"
                variant="bordered"
                placeholder="Entrer votre prénom"
                className="text-sm font-medium md:text-base"
                name="prenom"
                size="lg"
                onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Nom d'utilisateur"
                variant="bordered"
                placeholder="Entrer votre nom d'utilisateur"
                className="text-sm font-medium md:text-base"
                name="utilisateur"
                size="lg"
                onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Fonction"
                variant="bordered"
                placeholder="Entrer votre fonction"
                className="text-sm font-medium md:text-base"
                name="role"
                size="lg"
                // onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Société"
                variant="bordered"
                placeholder="Entrer le nom de la société"
                className="text-sm font-medium md:text-base"
                name="company"
                size="lg"
                // onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Département de la société"
                variant="bordered"
                placeholder="Entrer le département"
                className="text-sm font-medium md:text-base"
                name="department"
                size="lg"
                // onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Nom du projet"
                variant="bordered"
                placeholder="Entrer le nom du projet"
                className="text-sm font-medium md:text-base"
                name="projectName"
                size="lg"
                // onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type="text"
                label="Adresse e-mail"
                variant="bordered"
                placeholder="Entrer votre adresse e-mail"
                className="text-sm font-medium md:text-base"
                name="email"
                size="lg"
                onChange={handleChange}
                required
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type={isPasswordVisible ? "text" : "password"}
                label="Mot de passe"
                variant="bordered"
                placeholder="Entrer votre mot de passe"
                className="text-sm font-medium md:text-base"
                name="motdepasse"
                size="lg"
                onChange={handleChange}
                required
                endContent={
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="focus:outline-none"
                    aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Input
                type={isConfirmPasswordVisible ? "text" : "password"}
                label="Confirmer le mot de passe"
                variant="bordered"
                placeholder="Veuillez confirmer votre mot de passe"
                className="text-sm font-medium md:text-base"
                name="cmotdepasse"
                size="lg"
                onChange={handleChange}
                required
                endContent={
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    className="focus:outline-none"
                    aria-label={isConfirmPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
                classNames={{
                  input:
                    "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                  inputWrapper:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              />
              <Select
                label="Domaine du projet"
                variant="bordered"
                placeholder="Choisir le domaine de projet"
                selectionMode="single"
                className="text-sm font-medium md:text-base"
                size="lg"
                onSelectionChange={handleSelectChange}
                classNames={{
                  trigger:
                    "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                  value: "text-gray-900 dark:text-white font-medium",
                  label: "text-gray-800 dark:text-gray-200 font-semibold",
                }}
              >
                {domaines.map((domaine) => (
                  <SelectItem key={domaine.key}>
                    {domaine.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-center px-2 py-2">
              <Button
                color="primary"
                className="w-64 flex-none"
                variant="solid"
                size="md"
                onClick={handleSubmit}
                isDisabled={loading}
              >
                {loading ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModifierCompte;
