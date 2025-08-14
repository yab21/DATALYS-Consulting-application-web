"use client";

import React from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  RadioGroup,
  Radio,
  Switch,
  Slider,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  useOptimizedForm,
  useNotifications,
  notificationHelpers
} from "@/components/Optimizations";

// Types
interface ProjectFormData {
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

const CHEFS_DE_PROJET = [
  { value: "marie.martin", label: "Marie Martin" },
  { value: "pierre.durand", label: "Pierre Durand" },
  { value: "sophie.bernard", label: "Sophie Bernard" },
  { value: "jean.dupont", label: "Jean Dupont" },
  { value: "luc.moreau", label: "Luc Moreau" },
];

interface OptimizedProjectFormProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  projectId?: string;
  initialData?: Partial<ProjectFormData>;
}

const OptimizedProjectForm: React.FC<OptimizedProjectFormProps> = ({
  isModal = false,
  isOpen = false,
  onClose,
  onSuccess,
  projectId,
  initialData
}) => {
  const router = useRouter();
  const { showNotification } = useNotifications();

  // Utilisation du hook de formulaire optimisé
  const form = useOptimizedForm<ProjectFormData>({
    initialValues: {
      intitule: "",
      societe: "",
      chefDeProjet: "",
      domaine: [],
      description: "",
      visibilite: "public",
      urgent: false,
      budget: 10000,
      progression: 0,
      ...initialData
    },
    
    // Validation en temps réel
    validate: (values) => {
      const errors: Record<string, string> = {};
      
      if (!values.intitule?.trim()) {
        errors.intitule = "L'intitulé du projet est requis";
      } else if (values.intitule.length < 3) {
        errors.intitule = "L'intitulé doit contenir au moins 3 caractères";
      }
      
      if (!values.societe?.trim()) {
        errors.societe = "Le nom de la société est requis";
      }
      
      if (!values.chefDeProjet) {
        errors.chefDeProjet = "Veuillez sélectionner un chef de projet";
      }
      
      if (!values.domaine || values.domaine.length === 0) {
        errors.domaine = "Veuillez sélectionner au moins un domaine";
      }
      
      if (!values.description?.trim()) {
        errors.description = "La description est requise";
      } else if (values.description.length < 20) {
        errors.description = "La description doit contenir au moins 20 caractères";
      }
      
      if (values.budget < 1000) {
        errors.budget = "Le budget minimum est de 1 000 €";
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    },

    // Soumission du formulaire
    onSubmit: async (data) => {
      try {
        const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
        const method = projectId ? "PUT" : "POST";
        
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        showNotification(notificationHelpers.success(
          projectId ? "Projet modifié" : "Projet créé",
          `Le projet "${data.intitule}" a été ${projectId ? "modifié" : "créé"} avec succès`
        ));

        if (onSuccess) {
          onSuccess();
        } else if (isModal && onClose) {
          onClose();
        } else {
          router.push("/tableaudebord/projet/gerer");
        }
      } catch (error) {
        throw new Error(
          error instanceof Error 
            ? error.message 
            : "Une erreur inattendue s'est produite"
        );
      }
    },

    // Options d'optimisation
    autoSave: true,
    autoSaveDelay: 3000,
    enableDrafts: true,
    draftKey: projectId ? `project-edit-${projectId}` : "project-create",
    debounceDelay: 300,

    // Callback d'auto-sauvegarde personnalisé
    onAutoSave: async (data) => {
      // Sauvegarder en tant que brouillon dans l'API
      try {
        await fetch("/api/projects/draft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, projectId }),
        });
      } catch (error) {
        console.warn("Échec de la sauvegarde automatique:", error);
        // Fallback sur le localStorage (déjà géré par le hook)
      }
    }
  });

  const handleCancel = () => {
    if (form.isDirty) {
      const confirmClose = window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?"
      );
      if (!confirmClose) return;
    }

    if (isModal && onClose) {
      onClose();
    } else {
      router.push("/tableaudebord/projet/gerer");
    }
  };

  const formContent = (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card className="shadow-lg">
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informations générales
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Définissez les caractéristiques principales du projet
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Intitulé du projet"
              placeholder="Ex: Migration Cloud AWS"
              value={form.values.intitule}
              onChange={(e) => form.setValue("intitule", e.target.value)}
              isInvalid={!!form.errors.intitule && form.touched.intitule}
              errorMessage={form.errors.intitule}
              isRequired
              startContent={
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />

            <Input
              label="Nom de la société"
              placeholder="Ex: TechCorp Solutions"
              value={form.values.societe}
              onChange={(e) => form.setValue("societe", e.target.value)}
              isInvalid={!!form.errors.societe && form.touched.societe}
              errorMessage={form.errors.societe}
              isRequired
              startContent={
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />

            <Select
              label="Chef de projet"
              placeholder="Sélectionner un chef de projet"
              selectedKeys={form.values.chefDeProjet ? [form.values.chefDeProjet] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                form.setValue("chefDeProjet", selected);
              }}
              isInvalid={!!form.errors.chefDeProjet && form.touched.chefDeProjet}
              errorMessage={form.errors.chefDeProjet}
              isRequired
            >
              {CHEFS_DE_PROJET.map((chef) => (
                <SelectItem key={chef.value} value={chef.value}>
                  {chef.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Domaines d'expertise"
              placeholder="Sélectionner les domaines"
              selectedKeys={form.values.domaine}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys) as string[];
                form.setValue("domaine", selected);
              }}
              selectionMode="multiple"
              isInvalid={!!form.errors.domaine && form.touched.domaine}
              errorMessage={form.errors.domaine}
              isRequired
            >
              {DOMAINES.map((domaine) => (
                <SelectItem key={domaine.value} value={domaine.value}>
                  {domaine.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description du projet"
            placeholder="Décrivez en détail les objectifs, les enjeux et les spécificités de ce projet..."
            value={form.values.description}
            onChange={(e) => form.setValue("description", e.target.value)}
            isInvalid={!!form.errors.description && form.touched.description}
            errorMessage={form.errors.description}
            minRows={4}
            isRequired
          />
        </CardBody>
      </Card>

      {/* Configuration avancée */}
      <Card className="shadow-lg">
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configuration avancée
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paramètres de visibilité et priorité du projet
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <RadioGroup
                label="Visibilité du projet"
                value={form.values.visibilite}
                onValueChange={(value) => form.setValue("visibilite", value as any)}
                orientation="horizontal"
              >
                <Radio value="public">Public</Radio>
                <Radio value="prive">Privé</Radio>
                <Radio value="restreint">Restreint</Radio>
              </RadioGroup>

              <Switch
                isSelected={form.values.urgent}
                onValueChange={(value) => form.setValue("urgent", value)}
                color="danger"
                startContent={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              >
                Projet urgent
              </Switch>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Budget estimé: <span className="font-bold text-blue-600">{form.values.budget.toLocaleString("fr-FR")} €</span>
                </label>
                <Slider
                  size="lg"
                  step={1000}
                  maxValue={500000}
                  minValue={1000}
                  value={form.values.budget}
                  onChange={(value) => form.setValue("budget", value as number)}
                  className="max-w-md"
                  color="primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Progression initiale: <span className="font-bold text-green-600">{form.values.progression}%</span>
                </label>
                <Slider
                  size="lg"
                  step={5}
                  maxValue={100}
                  minValue={0}
                  value={form.values.progression}
                  onChange={(value) => form.setValue("progression", value as number)}
                  className="max-w-md"
                  color="success"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Indicateurs de statut du formulaire */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          {form.isAutoSaving && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Sauvegarde automatique...</span>
            </div>
          )}
          
          {form.isDirty && !form.isAutoSaving && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Modifications non sauvegardées</span>
            </div>
          )}

          {!form.isDirty && !form.isAutoSaving && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Formulaire à jour</span>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Auto-sauvegarde activée
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-2">
          <Button
            variant="light"
            color="primary"
            size="sm"
            onClick={() => form.saveDraft()}
            isDisabled={!form.isDirty}
          >
            💾 Sauvegarder le brouillon
          </Button>
          
          <Button
            variant="light"
            color="warning"
            size="sm"
            onClick={() => form.loadDraft()}
          >
            📋 Charger le brouillon
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="bordered"
            onClick={handleCancel}
            isDisabled={form.isSubmitting}
          >
            Annuler
          </Button>
          
          <Button
            color="primary"
            onClick={form.handleSubmit}
            isLoading={form.isSubmitting}
            isDisabled={!form.validateForm() || form.isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl"
            startContent={
              !form.isSubmitting && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )
            }
          >
            {form.isSubmitting 
              ? (projectId ? "Modification..." : "Création...") 
              : (projectId ? "Modifier le projet" : "Créer le projet")
            }
          </Button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl">
          <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {projectId ? "Modifier le projet" : "Nouveau Projet"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {projectId 
              ? "Modifiez les informations de votre projet DATALYS" 
              : "Créez un nouveau projet pour votre organisation"
            }
          </p>
        </div>
      </div>
      
      {formContent}
    </motion.div>
  );
};

export default OptimizedProjectForm;