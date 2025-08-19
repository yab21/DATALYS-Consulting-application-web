"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, notificationHelpers } from "@/components/UI/Notifications/NotificationSystem";
import { projectsService, CreateProjectFormData } from "@/services/projects";

// Interface pour le formulaire
interface ProjectFormData {
  title: string;
  partner_name: string;
  is_active: boolean;
}

interface OptimizedProjectFormProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  projectId?: number;
  initialData?: Partial<ProjectFormData>;
}

const OptimizedProjectForm: React.FC<OptimizedProjectFormProps> = ({
  isModal = false,
  onClose,
  onSuccess,
  projectId,
  initialData
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  // États
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    partner_name: "",
    is_active: true,
    ...initialData
  });
  
  const [partnerNames, setPartnerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les noms des partenaires
  useEffect(() => {
    loadPartnerNames();
  }, []);

  const loadPartnerNames = async () => {
    try {
      setLoadingPartners(true);
      const names = await projectsService.getPartnerNames();
      console.log("👥 Partenaires chargés:", names);
      setPartnerNames(names);
    } catch (error) {
      console.error("Erreur lors du chargement des partenaires:", error);
      showNotification(notificationHelpers.error(
        "Erreur",
        "Impossible de charger la liste des partenaires"
      ));
    } finally {
      setLoadingPartners(false);
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = "Le titre du projet est requis";
    } else if (formData.title.length < 3) {
      newErrors.title = "Le titre doit contenir au moins 3 caractères";
    }
    
    if (!formData.partner_name?.trim()) {
      newErrors.partner_name = "Veuillez sélectionner un partenaire";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements de champs
  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    console.log(`🔄 Changement de champ ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("📝 Données du formulaire avant validation:", formData);
    
    if (!validateForm() || !user) return;
    
    setLoading(true);
    
    try {
      if (projectId) {
        // Mode édition
        await projectsService.updateProject(
          projectId, 
          formData.title, 
          formData.is_active, 
          user.id,
          formData.partner_name
        );
        
        showNotification(notificationHelpers.success(
          "Projet modifié",
          `Le projet "${formData.title}" a été modifié avec succès`
        ));
      } else {
        // Mode création
        const createData: CreateProjectFormData = {
          title: formData.title,
          partner_name: formData.partner_name,
          is_active: formData.is_active
        };
        
        await projectsService.createProject(createData, user.id);
        
        showNotification(notificationHelpers.success(
          "Projet créé",
          `Le projet "${formData.title}" a été créé avec succès`
        ));
      }
      
      // Redirection ou fermeture
      if (onSuccess) {
        onSuccess();
      } else if (isModal && onClose) {
        onClose();
      } else {
        router.push("/tableaudebord/projet/gerer");
      }
      
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      showNotification(notificationHelpers.error(
        "Erreur",
        error instanceof Error ? error.message : "Une erreur s'est produite"
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const cardContent = (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="flex gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex flex-col w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectId ? "Modifier le projet" : "Créer un nouveau projet"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {projectId ? "Modifiez les informations du projet" : "Remplissez les informations du nouveau projet"}
          </p>
        </div>
      </CardHeader>
      
      <CardBody className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Titre du projet */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Titre du projet <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Entrez le titre du projet"
              value={formData.title}
              onValueChange={(value) => handleInputChange("title", value)}
              isInvalid={!!errors.title}
              errorMessage={errors.title}
              isRequired
              size="lg"
              variant="bordered"
              classNames={{
                input: "text-base",
                inputWrapper: "border-2 hover:border-blue-400 focus-within:border-blue-500"
              }}
            />
          </div>

          {/* Sélection du partenaire */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Partenaire <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Sélectionnez un partenaire"
              selectedKeys={formData.partner_name ? [formData.partner_name] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleInputChange("partner_name", selectedKey);
              }}
              isInvalid={!!errors.partner_name}
              errorMessage={errors.partner_name}
              isLoading={loadingPartners}
              isRequired
              size="lg"
              variant="bordered"
              classNames={{
                trigger: "border-2 hover:border-blue-400 data-[focus=true]:border-blue-500",
                value: "text-base"
              }}
            >
              {partnerNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Statut actif */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Statut du projet
            </label>
            <div className="flex items-center justify-between p-6 border-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex flex-col">
                <p className="font-medium text-gray-900 dark:text-white">
                  Projet {formData.is_active ? "actif" : "inactif"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formData.is_active 
                    ? "Le projet sera visible et accessible aux utilisateurs" 
                    : "Le projet sera masqué et inaccessible"
                  }
                </p>
              </div>
              <Switch
                isSelected={formData.is_active}
                onValueChange={(checked) => handleInputChange("is_active", checked)}
                color="success"
                size="lg"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="bordered"
              onPress={handleCancel}
              isDisabled={loading}
              size="lg"
              className="px-8"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              size="lg"
              className="px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {loading 
                ? (projectId ? "Modification..." : "Création...") 
                : (projectId ? "Modifier le projet" : "Créer le projet")
              }
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );

  if (isModal) {
    return cardContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      {cardContent}
    </motion.div>
  );
};

export default OptimizedProjectForm;