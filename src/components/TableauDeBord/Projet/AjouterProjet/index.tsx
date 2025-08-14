"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  RadioGroup,
  Radio,
  Switch,
  Slider,
} from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";

// Types
interface ProjetForm {
  intitule: string;
  societe: string;
  chefDeProjet: string;
  domaine: string[];
  description: string;
  visibilite: "public" | "prive" | "restreint";
  urgent: boolean;
  budget: number;
  progression: number;
}

// Options prédéfinies
const DOMAINES = [
  { value: "itcloud", label: "IT & Cloud" },
  { value: "security", label: "Sécurité & Réseau" },
  { value: "datacenter", label: "Data Center & Énergie" },
  { value: "consulting", label: "Conseil & Audit" },
  { value: "development", label: "Développement" },
  { value: "maintenance", label: "Maintenance" },
];

const CreerProjet: React.FC = () => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProjetForm>({
    intitule: "",
    societe: "",
    chefDeProjet: "",
    domaine: [],
    description: "",
    visibilite: "prive",
    urgent: false,
    budget: 0,
    progression: 0,
  });

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.intitule.trim()) {
      newErrors.intitule = "L'intitulé du projet est requis";
    } else if (formData.intitule.length < 3) {
      newErrors.intitule = "L'intitulé doit contenir au moins 3 caractères";
    }

    if (!formData.societe.trim()) {
      newErrors.societe = "Le nom de la société est requis";
    }

    if (!formData.chefDeProjet.trim()) {
      newErrors.chefDeProjet = "Le chef de projet est requis";
    }

    if (formData.domaine.length === 0) {
      newErrors.domaine = "Sélectionnez au moins un domaine";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description =
        "La description ne peut pas dépasser 500 caractères";
    }

    if (formData.budget < 0) {
      newErrors.budget = "Le budget doit être positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements du formulaire
  const handleInputChange = (field: keyof ProjetForm, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Supprimer l'erreur si elle existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Gestion des domaines (multiselect)
  const handleDomaineChange = (keys: any) => {
    const selectedKeys = Array.from(keys) as string[];
    handleInputChange("domaine", selectedKeys);
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulation de l'envoi - en production, vous feriez un appel API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newProject = {
        id: `project-${Date.now()}`,
        ...formData,
        statut: "en_cours",
        dateCreation: new Date(),
        dateModification: new Date(),
      };

      console.log("Nouveau projet créé:", newProject);

      // Notification de succès
      addNotification({
        title: "Projet créé avec succès",
        body: `Le projet "${formData.intitule}" a été créé et ajouté à votre tableau de bord`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
        link: "/tableaudebord/projet/gerer",
      });

      // Afficher la modal de confirmation
      onOpen();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retour à la liste
  const handleReturnToList = () => {
    onClose();
    router.push("/tableaudebord/projet/gerer");
  };

  return (
    <>
      <Breadcrumb pageName="Créer un Projet" />

      <div className="mx-auto max-w-6xl space-y-8 p-4">
        {/* En-tête amélioré avec couleurs DATALYS */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 p-1 shadow-2xl shadow-cyan-500/25"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="rounded-3xl bg-white p-10 dark:bg-gray-900/95">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 blur-xl"></div>
                <h1 className="relative mb-4 bg-gradient-to-r from-[#06B6D4] to-teal-600 bg-clip-text text-4xl font-black text-transparent dark:from-cyan-400 dark:to-teal-400">
                  🚀 Nouveau Projet
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Créez et configurez votre nouveau projet DATALYS avec tous les paramètres nécessaires
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Configuration du projet • Étape 1 sur 1
                  </span>
                </div>
              </div>

              <Link href="/tableaudebord/projet/gerer">
                <Button
                  variant="solid"
                  size="lg"
                  className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 shadow-lg transition-all duration-300 hover:from-gray-200 hover:to-gray-300 hover:shadow-xl dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700"
                  startContent={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  }
                >
                  Retour à la liste
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Formulaire amélioré */}
        <motion.div
          className="rounded-3xl border border-gray-200/50 bg-white/80 shadow-2xl shadow-gray-200/20 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/80 dark:shadow-gray-900/40"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-transparent shadow-none">
            <CardBody className="p-10">
              <div className="space-y-12">
                {/* Informations Générales */}
                <div className="relative">
                  <div className="absolute -left-6 top-2 h-12 w-1 rounded-full bg-gradient-to-b from-[#06B6D4] to-teal-600"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06B6D4] to-teal-600 shadow-lg shadow-cyan-500/25">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Informations Générales
                    </h3>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Intitulé du projet *
                      </label>
                      <Input
                        variant="bordered"
                        placeholder="Ex: Migration Cloud AWS"
                        value={formData.intitule}
                        onChange={(e) =>
                          handleInputChange("intitule", e.target.value)
                        }
                        isInvalid={!!errors.intitule}
                        errorMessage={errors.intitule}
                        isRequired
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium",
                          inputWrapper:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-[#06B6D4] dark:hover:border-cyan-500 focus-within:border-[#06B6D4] dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                        }}
                      />
                    </div>

                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                        </svg>
                        Nom de la société *
                      </label>
                      <Input
                        variant="bordered"
                        placeholder="Ex: DATALYS Consulting"
                        value={formData.societe}
                        onChange={(e) =>
                          handleInputChange("societe", e.target.value)
                        }
                        isInvalid={!!errors.societe}
                        errorMessage={errors.societe}
                        isRequired
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium",
                          inputWrapper:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-[#06B6D4] dark:hover:border-cyan-500 focus-within:border-[#06B6D4] dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-8 group">
                    <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                      <svg className="h-4 w-4 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Chef de projet *
                    </label>
                    <Input
                      variant="bordered"
                      placeholder="Ex: Jean Dupont"
                      value={formData.chefDeProjet}
                      onChange={(e) =>
                        handleInputChange("chefDeProjet", e.target.value)
                      }
                      isInvalid={!!errors.chefDeProjet}
                      errorMessage={errors.chefDeProjet}
                      isRequired
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium",
                        inputWrapper:
                          "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-[#06B6D4] dark:hover:border-cyan-500 focus-within:border-[#06B6D4] dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                      }}
                    />
                  </div>

                  <div className="mt-8 group">
                    <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                      <svg className="h-4 w-4 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                      </svg>
                      Domaines du projet *
                    </label>
                    <Select
                      variant="bordered"
                      selectedKeys={formData.domaine}
                      onSelectionChange={handleDomaineChange}
                      isInvalid={!!errors.domaine}
                      errorMessage={errors.domaine}
                      isRequired
                      selectionMode="multiple"
                      size="lg"
                      className="text-base"
                      placeholder="Sélectionnez un ou plusieurs domaines"
                      classNames={{
                        trigger:
                          "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-[#06B6D4] dark:hover:border-cyan-500 focus-within:border-[#06B6D4] dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                        value: "text-gray-900 dark:text-white font-medium",
                      }}
                    >
                      {DOMAINES.map((domaine) => (
                        <SelectItem
                          key={domaine.value}
                          value={domaine.value}
                          className="text-gray-900 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                        >
                          {domaine.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="mt-8 group">
                    <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                      <svg className="h-4 w-4 text-[#06B6D4]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                      </svg>
                      Description du projet
                    </label>
                    <Textarea
                      variant="bordered"
                      placeholder="Description détaillée du projet, objectifs, livrables attendus et contraintes techniques..."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      minRows={4}
                      maxRows={6}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description}
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium leading-relaxed",
                        inputWrapper:
                          "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-[#06B6D4] dark:hover:border-cyan-500 focus-within:border-[#06B6D4] dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                      }}
                    />
                  </div>
                </div>

                {/* Configuration du Projet */}
                <div className="relative">
                  <div className="absolute -left-6 top-2 h-12 w-1 rounded-full bg-gradient-to-b from-teal-500 to-emerald-600"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Configuration du Projet
                    </h3>
                  </div>

                  {/* Visibilité */}
                  <div className="mb-6">
                    <label className="mb-4 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Visibilité *
                    </label>
                    <RadioGroup
                      value={formData.visibilite}
                      onValueChange={(value) =>
                        handleInputChange(
                          "visibilite",
                          value as "public" | "prive" | "restreint",
                        )
                      }
                      className="gap-4"
                    >
                      <Radio
                        value="public"
                        classNames={{
                          label: "text-gray-800 dark:text-gray-200 font-medium",
                          description:
                            "text-gray-600 dark:text-gray-400 text-sm",
                        }}
                        description="Visible par tous les utilisateurs"
                      >
                        Public
                      </Radio>
                      <Radio
                        value="prive"
                        classNames={{
                          label: "text-gray-800 dark:text-gray-200 font-medium",
                          description:
                            "text-gray-600 dark:text-gray-400 text-sm",
                        }}
                        description="Visible uniquement par l'équipe projet"
                      >
                        Privé
                      </Radio>
                      <Radio
                        value="restreint"
                        classNames={{
                          label: "text-gray-800 dark:text-gray-200 font-medium",
                          description:
                            "text-gray-600 dark:text-gray-400 text-sm",
                        }}
                        description="Accès sur invitation uniquement"
                      >
                        Restreint
                      </Radio>
                    </RadioGroup>
                  </div>

                  {/* Projet urgent */}
                  <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-700">
                    <div>
                      <label className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        Projet urgent
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Marquer ce projet comme prioritaire
                      </p>
                    </div>
                    <Switch
                      isSelected={formData.urgent}
                      onValueChange={(checked) =>
                        handleInputChange("urgent", checked)
                      }
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                        Budget estimé (€)
                      </label>
                      <Input
                        variant="bordered"
                        type="number"
                        placeholder="Ex: 50000"
                        value={formData.budget.toString()}
                        onChange={(e) =>
                          handleInputChange(
                            "budget",
                            Number(e.target.value) || 0,
                          )
                        }
                        isInvalid={!!errors.budget}
                        errorMessage={errors.budget}
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                        Progression initiale (%)
                      </label>
                      <div className="space-y-3">
                        <Slider
                          value={formData.progression}
                          onChange={(value) =>
                            handleInputChange(
                              "progression",
                              Array.isArray(value) ? value[0] : value,
                            )
                          }
                          minValue={0}
                          maxValue={100}
                          step={5}
                          className="max-w-md"
                          classNames={{
                            track: "bg-gray-200 dark:bg-gray-600",
                            filler: "bg-blue-500",
                          }}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Progression actuelle du projet: {formData.progression}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions améliorées */}
                <div className="relative mt-12">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-6 text-sm font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Actions</span>
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col gap-6 sm:flex-row">
                  <Button
                    color="primary"
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-[#06B6D4] to-teal-600 text-lg font-bold shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-600 hover:to-teal-700 hover:shadow-cyan-500/40 hover:-translate-y-1 active:scale-95"
                    onPress={handleSubmit}
                    isLoading={isSubmitting}
                    startContent={
                      !isSubmitting && (
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )
                    }
                  >
                    {isSubmitting
                      ? "Création en cours..."
                      : "🚀 Créer le Projet"}
                  </Button>

                  <Link href="/tableaudebord/projet/gerer" className="flex-1">
                    <Button
                      variant="bordered"
                      size="lg"
                      className="w-full border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white text-lg font-semibold text-gray-700 shadow-lg transition-all duration-300 hover:border-gray-400 hover:from-gray-100 hover:to-gray-50 hover:shadow-xl hover:-translate-y-0.5 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:from-gray-700 dark:hover:to-gray-600"
                      isDisabled={isSubmitting}
                      startContent={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    >
                      Annuler
                    </Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Modal de confirmation */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" className="dark">
        <ModalContent className="bg-white dark:bg-gray-800">
          <ModalHeader className="border-b border-gray-200 pb-4 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-green-600 dark:text-green-400"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Projet Créé avec Succès
                </h3>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                Le projet{" "}
                <strong className="text-gray-900 dark:text-white">
                  {formData.intitule}
                </strong>{" "}
                a été créé avec succès dans le système.
              </p>

              <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-700">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {formData.intitule}
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-gray-300">
                    {formData.societe}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Chip
                      size="lg"
                      variant="flat"
                      color="primary"
                      className="text-sm font-semibold"
                    >
                      {formData.visibilite}
                    </Chip>
                    {formData.urgent && (
                      <Chip
                        size="lg"
                        variant="flat"
                        color="warning"
                        className="text-sm font-semibold"
                      >
                        Urgent
                      </Chip>
                    )}
                    {formData.domaine.map((d) => {
                      const domaine = DOMAINES.find((dom) => dom.value === d);
                      return (
                        <Chip
                          key={d}
                          size="sm"
                          variant="flat"
                          color="secondary"
                          className="text-xs font-medium"
                        >
                          {domaine?.label || d}
                        </Chip>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 text-base text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-2">
                    <span className="text-lg">👤</span> {formData.chefDeProjet}
                  </p>
                  {formData.budget > 0 && (
                    <p className="flex items-center gap-2">
                      <span className="text-lg">💰</span>{" "}
                      {formData.budget.toLocaleString("fr-FR")} €
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              color="primary"
              size="lg"
              onPress={handleReturnToList}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold"
              startContent={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
              }
            >
              Voir la Liste des Projets
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreerProjet;
