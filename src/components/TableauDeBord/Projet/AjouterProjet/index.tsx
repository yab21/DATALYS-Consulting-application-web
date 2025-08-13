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
      newErrors.description = "La description ne peut pas dépasser 500 caractères";
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
        {/* En-tête */}
        <motion.div
          className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-xl shadow-gray-200/50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80 dark:shadow-gray-900/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
                Nouveau Projet
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Remplissez les informations ci-dessous pour créer un nouveau projet
              </p>
            </div>

            <Link href="/tableaudebord/projet/gerer">
              <Button
                variant="flat"
                color="default"
                size="lg"
                className="bg-gray-50 text-base font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Retour à la liste
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-xl shadow-gray-200/50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80 dark:shadow-gray-900/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-transparent shadow-none">
            <CardBody className="p-8">
              <div className="space-y-8">
                {/* Informations Générales */}
                <div>
                  <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                    Informations Générales
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                        Intitulé du projet *
                      </label>
                      <Input
                        variant="bordered"
                        placeholder="Ex: Migration vers le Cloud"
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
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                        inputWrapper:
                          "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400",
                      }}
                    />
                  </div>

                  <div className="mt-6">
                    <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Domaine du projet *
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
                      placeholder="Sélectionnez les domaines"
                      classNames={{
                        trigger:
                          "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        value: "text-gray-900 dark:text-white font-medium",
                      }}
                    >
                      {DOMAINES.map((domaine) => (
                        <SelectItem
                          key={domaine.value}
                          value={domaine.value}
                          className="text-gray-900 dark:text-white"
                        >
                          {domaine.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="mt-6">
                    <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Description du projet
                    </label>
                    <Textarea
                      variant="bordered"
                      placeholder="Décrivez les objectifs et le contexte du projet..."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      minRows={3}
                      maxRows={5}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description}
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800",
                        inputWrapper:
                          "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200",
                      }}
                    />
                  </div>
                </div>

                {/* Configuration du Projet */}
                <div>
                  <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                    Configuration du Projet
                  </h3>

                  {/* Visibilité */}
                  <div className="mb-6">
                    <label className="mb-4 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Visibilité *
                    </label>
                    <RadioGroup
                      value={formData.visibilite}
                      onValueChange={(value) => handleInputChange("visibilite", value as "public" | "prive" | "restreint")}
                      className="gap-4"
                    >
                      <Radio 
                        value="public"
                        classNames={{
                          label: "text-gray-800 dark:text-gray-200 font-medium",
                          description: "text-gray-600 dark:text-gray-400 text-sm"
                        }}
                        description="Visible par tous les utilisateurs"
                      >
                        Public
                      </Radio>
                      <Radio 
                        value="prive"
                        classNames={{
                          label: "text-gray-800 dark:text-gray-200 font-medium",
                          description: "text-gray-600 dark:text-gray-400 text-sm"
                        }}
                        description="Visible uniquement par l'équipe projet"
                      >
                        Privé
                      </Radio>
                      <Radio 
                        value="restreint"
                        classNames={{
                          label: "text-gray-800 dark:text-gray-200 font-medium",
                          description: "text-gray-600 dark:text-gray-400 text-sm"
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
                      onValueChange={(checked) => handleInputChange("urgent", checked)}
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
                          handleInputChange("budget", Number(e.target.value) || 0)
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
                          onChange={(value) => handleInputChange("progression", Array.isArray(value) ? value[0] : value)}
                          minValue={0}
                          maxValue={100}
                          step={5}
                          className="max-w-md"
                          classNames={{
                            track: "bg-gray-200 dark:bg-gray-600",
                            filler: "bg-blue-500"
                          }}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Progression actuelle du projet: {formData.progression}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4 border-t border-gray-200 pt-8 dark:border-gray-700 sm:flex-row">
                  <Button
                    color="primary"
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700"
                    onPress={handleSubmit}
                    isLoading={isSubmitting}
                    startContent={
                      !isSubmitting && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                      )
                    }
                  >
                    {isSubmitting ? "Création en cours..." : "Créer le Projet"}
                  </Button>

                  <Link href="/tableaudebord/projet/gerer" className="flex-1">
                    <Button
                      variant="flat"
                      size="lg"
                      className="w-full bg-gray-50 text-base font-medium text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      isDisabled={isSubmitting}
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
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {formData.societe}
                  </p>
                  <div className="mt-3 flex gap-3 flex-wrap">
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
                      const domaine = DOMAINES.find(dom => dom.value === d);
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
                      <span className="text-lg">💰</span> {formData.budget.toLocaleString('fr-FR')} €
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