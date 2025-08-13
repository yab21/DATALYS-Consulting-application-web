"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/react";
import { useNotifications } from "@/context/NotificationContext";

const AjouterProjet = () => {
  const [formData, setFormData] = useState({
    nom: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { addNotification } = useNotifications();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.nom.trim()) {
      setError("Le nom du dossier est requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulation de création (remplace Firebase)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newFolder = {
        id: `folder-${Date.now()}`,
        nom: formData.nom,
        createdAt: new Date(),
      };

      console.log("Dossier créé :", newFolder);
      
      addNotification({
        title: "Dossier créé avec succès",
        body: `Le dossier "${formData.nom}" a été créé`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      // Reset form
      setFormData({ nom: "" });
      
    } catch (error: any) {
      console.error("Erreur lors de la création du dossier :", error);
      setError("Erreur lors de la création du dossier. Veuillez réessayer.");
      
      addNotification({
        title: "Erreur de création",
        body: "Une erreur est survenue lors de la création du dossier",
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
      <Breadcrumb pageName="Créer un projet" />
      <div className="mx-auto mt-5 max-w-4xl space-y-6 p-4">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-xl shadow-gray-200/50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80 dark:shadow-gray-900/50">
          <div className="w-full max-w-full p-2">
            <h3 className="pt-2 text-[22px] font-medium text-dark dark:text-white">
              Créer un dossier
            </h3>
          </div>
          <div className="mt-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 gap-2 px-2 py-6 md:py-4">
              <Input
                type="text"
                label="Nom du dossier"
                variant="bordered"
                placeholder="Entrer le nom du dossier"
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
                {loading ? "Création..." : "Créer"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AjouterProjet;
