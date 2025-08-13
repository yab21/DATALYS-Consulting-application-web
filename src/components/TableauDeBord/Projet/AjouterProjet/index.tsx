"use client";

import React from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import FormBuilder, { FormSection } from "@/components/UI/FormBuilder/FormBuilder";
import { useNotifications } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import { z } from "zod";

const CreerProjet = () => {
  const { addNotification } = useNotifications();
  const router = useRouter();

  // Définition des sections du formulaire
  const formSections: FormSection[] = [
    {
      title: "Informations Générales",
      description: "Détails de base du projet",
      fields: [
        {
          name: "intitule",
          label: "Intitulé du projet",
          type: "text",
          placeholder: "Ex: Migration vers le Cloud",
          required: true,
          validation: z.string().min(3, "Minimum 3 caractères").max(100, "Maximum 100 caractères"),
        },
        {
          name: "societe",
          label: "Nom de la société",
          type: "text",
          placeholder: "Ex: DATALYS Consulting",
          required: true,
          validation: z.string().min(2, "Minimum 2 caractères"),
        },
        {
          name: "chefDeProjet",
          label: "Chef de projet",
          type: "text",
          placeholder: "Ex: Jean Dupont",
          required: true,
          validation: z.string().min(2, "Minimum 2 caractères"),
        },
        {
          name: "domaine",
          label: "Domaine du projet",
          type: "multiselect",
          required: true,
          options: [
            { value: "itcloud", label: "IT & Cloud" },
            { value: "security", label: "Sécurité & Réseau" },
            { value: "datacenter", label: "Data Center & Énergie" },
            { value: "consulting", label: "Conseil & Audit" },
            { value: "development", label: "Développement" },
            { value: "maintenance", label: "Maintenance" },
          ],
          validation: z.array(z.string()).min(1, "Sélectionnez au moins un domaine"),
        },
      ],
    },
    {
      title: "Configuration du Projet",
      description: "Paramètres avancés",
      fields: [
        {
          name: "description",
          label: "Description du projet",
          type: "textarea",
          placeholder: "Décrivez les objectifs et le contexte du projet...",
          required: false,
          validation: z.string().max(500, "Maximum 500 caractères").optional(),
        },
        {
          name: "visibilite",
          label: "Visibilité",
          type: "radio",
          required: true,
          defaultValue: "prive",
          options: [
            { value: "public", label: "Public", description: "Visible par tous les utilisateurs" },
            { value: "prive", label: "Privé", description: "Visible uniquement par l'équipe projet" },
            { value: "restreint", label: "Restreint", description: "Accès sur invitation uniquement" },
          ],
        },
        {
          name: "urgent",
          label: "Projet urgent",
          type: "switch",
          description: "Marquer ce projet comme prioritaire",
          defaultValue: false,
        },
        {
          name: "budget",
          label: "Budget estimé (€)",
          type: "number",
          placeholder: "Ex: 50000",
          min: 0,
          max: 10000000,
          validation: z.number().min(0, "Le budget doit être positif").optional(),
        },
        {
          name: "progression",
          label: "Progression initiale (%)",
          type: "slider",
          min: 0,
          max: 100,
          step: 5,
          defaultValue: 0,
          description: "Progression actuelle du projet",
        },
      ],
    },
  ];

  // Schéma de validation global
  const validationSchema = z.object({
    intitule: z.string().min(3).max(100),
    societe: z.string().min(2),
    chefDeProjet: z.string().min(2),
    domaine: z.array(z.string()).min(1),
    description: z.string().max(500).optional(),
    visibilite: z.enum(["public", "prive", "restreint"]),
    urgent: z.boolean().optional(),
    budget: z.number().min(0).optional(),
    progression: z.number().min(0).max(100).optional(),
  });

  // Gestionnaire de soumission
  const handleSubmit = async (data: any) => {
    try {
      // Validation avec Zod
      const validatedData = validationSchema.parse(data);
      
      // Simulation de création du projet
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newProject = {
        id: `project-${Date.now()}`,
        ...validatedData,
        statut: "en_cours",
        dateCreation: new Date(),
        dateModification: new Date(),
      };

      console.log("Projet créé:", newProject);

      // Notification de succès
      addNotification({
        title: "Projet créé avec succès",
        body: `Le projet "${validatedData.intitule}" a été créé et ajouté à votre tableau de bord`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
        link: "/tableaudebord/projet/gerer",
      });

      // Redirection
      router.push("/tableaudebord/projet/gerer");
      
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      
      addNotification({
        title: "Erreur de création",
        body: "Une erreur est survenue lors de la création du projet. Veuillez réessayer.",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    }
  };

  // Gestionnaire d'annulation
  const handleCancel = () => {
    router.push("/tableaudebord/projet/gerer");
  };

  return (
    <>
      <Breadcrumb pageName="Créer un projet" />
      <div className="mt-5">
        <FormBuilder
          sections={formSections}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          validationSchema={validationSchema}
          submitLabel="Créer le projet"
          cancelLabel="Annuler"
          showProgress={true}
        />
      </div>
    </>
  );
};

export default CreerProjet;