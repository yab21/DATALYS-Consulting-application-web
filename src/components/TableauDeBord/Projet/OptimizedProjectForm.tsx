"use client";

import React, { useState, useEffect } from "react";
import {
  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { projectsService, CreateProjectFormData } from "@/services/projects";
import { FolderPlus, Users, Shield, Save, ArrowLeft, FileText } from "lucide-react";
import { ProfessionalCard, ProfessionalButton, SectionHeader } from "@/components/UI/Professional";
import Link from "next/link";

// Interface pour le formulaire
interface ProjectFormData {
  title: string;
  description: string;
  partner_id: number | null;
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
  const { showNotification } = useSimpleNotifications();
  
  // États
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    partner_id: null,
    is_active: true,
    ...initialData
  });
  
  const [partners, setPartners] = useState<Array<{id: number, name: string}>>([]);
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
      // Pour récupérer les partenaires avec leurs IDs, on utilise l'API complète
      const response = await fetch('/api/partners/getByCriteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: 0,
          size: 100,
          data: { is_active: true }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const partnersData = result.items?.map((partner: any) => ({
          id: partner.id,
          name: partner.name || partner.company_name
        })) || [];
        console.log("👥 Partenaires chargés:", partnersData);
        setPartners(partnersData);
      } else {
        // Fallback vers l'ancienne méthode
        const names = await projectsService.getPartnerNames();
        const partnersData = names.map((name, index) => ({ id: index + 1, name }));
        setPartners(partnersData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des partenaires:", error);
      showNotification(simpleNotificationHelpers.error(
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
    
    if (!formData.partner_id) {
      newErrors.partner_id = "Veuillez sélectionner un partenaire";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements de champs
  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    console.log(`🔄 Changement de champ ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: "" }));
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
          formData.title, // name
          formData.title, // title
          formData.partner_id || 0, // partner_id
          formData.is_active, 
          user.id,
          user.email
        );
        
        showNotification(simpleNotificationHelpers.success(
          "Projet modifié",
          `Le projet "${formData.title}" a été modifié avec succès`
        ));
      } else {
        // Mode création
        const createData: CreateProjectFormData = {
          title: formData.title,
          description: formData.description,
          partner_id: formData.partner_id!,
          is_active: formData.is_active
        };
        
        await projectsService.createProject(createData, user.id, user.email);
        
        showNotification(simpleNotificationHelpers.success(
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
      showNotification(simpleNotificationHelpers.error(
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
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeader
        title={projectId ? "Modifier le Projet" : "Nouveau Projet"}
        subtitle={projectId ? "Modifiez les informations du projet" : "Créez un nouveau projet pour organiser et gérer vos dossiers"}
        icon={<FolderPlus />}
        actions={
          !isModal && (
            <Link href="/tableaudebord/projet/gerer">
              <ProfessionalButton
                variant="outline"
                startContent={<ArrowLeft className="h-4 w-4" />}
              >
                Retour à la liste
              </ProfessionalButton>
            </Link>
          )
        }
      />

      <ProfessionalCard>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div>
            <SectionHeader
              title="Informations de Base"
              icon={<FileText />}
              variant="compact"
              divider
            />
            
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Titre du projet <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: Migration Data Center, Sécurisation réseau entreprise"
                  value={formData.title}
                  onValueChange={(value) => handleInputChange("title", value)}
                  isInvalid={!!errors.title}
                  errorMessage={errors.title}
                  startContent={<FileText className="h-4 w-4 text-gray-400" />}
                  size="lg"
                  variant="bordered"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Partenaire <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder="Sélectionnez un partenaire"
                  selectedKeys={formData.partner_id ? [formData.partner_id.toString()] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    const partnerId = parseInt(selectedKey);
                    handleInputChange("partner_id", partnerId);
                  }}
                  isInvalid={!!errors.partner_id}
                  errorMessage={errors.partner_id as string}
                  isLoading={loadingPartners}
                  size="lg"
                  variant="bordered"
                  startContent={<Users className="h-4 w-4 text-gray-400" />}
                >
                  {partners.map((partner) => (
                    <SelectItem key={partner.id.toString()} value={partner.id.toString()}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mt-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description du projet
              </label>
              <Input
                placeholder="Description détaillée du projet..."
                value={formData.description}
                onValueChange={(value) => handleInputChange("description", value)}
                startContent={<FileText className="h-4 w-4 text-gray-400" />}
                size="lg"
                variant="bordered"
              />
            </div>
            
            <div className="space-y-2 mt-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Statut du projet
              </label>
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#4ba9b7]" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Projet {formData.is_active ? "actif" : "inactif"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.is_active 
                        ? "Le projet sera visible et accessible aux utilisateurs" 
                        : "Le projet sera masqué et inaccessible"
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(checked) => handleInputChange("is_active", checked)}
                  color="success"
                  size="lg"
                />
              </div>
            </div>
          </div>
          
          <Divider />
          
          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <ProfessionalButton
                variant="outline"
                size="lg"
                onClick={handleCancel}
                isDisabled={loading}
                startContent={<ArrowLeft className="h-4 w-4" />}
              >
                Annuler
              </ProfessionalButton>
              
              <ProfessionalButton
                variant="primary"
                size="lg"
                type="submit"
                isLoading={loading}
                startContent={!loading && <Save className="h-4 w-4" />}
                isDisabled={!formData.title || !formData.partner_id}
              >
                {loading 
                  ? (projectId ? "Modification..." : "Création...") 
                  : (projectId ? "Modifier le Projet" : "Créer le Projet")
                }
              </ProfessionalButton>
            </div>
          </div>
        </form>
      </ProfessionalCard>
    </div>
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