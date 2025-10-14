"use client";

import React, { useState, useEffect } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Divider,
} from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { partnersService, CreatePartnerFormData } from "@/services/partners";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { Permission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/Security/PermissionGuard";
import { ArrowLeft, Save, Building, Mail, Phone, Shield } from "lucide-react";
import { ProfessionalCard, ProfessionalButton, SectionHeader } from "@/components/UI/Professional";

// Types
interface PartnerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

const AjouterPartenaire: React.FC = () => {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    hasPermission, 
    canCreate 
  } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<'idle' | 'creating' | 'completed'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PartnerForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    is_active: true,
  });

  // Vérification des permissions et authentification
  useEffect(() => {
    console.log("🔐 État d'authentification:", {
      isAuthenticated,
      user,
      hasToken: !!localStorage.getItem('authToken'),
      isAdmin: isAdmin(),
      canCreate: canCreate(),
      hasCreatePermission: hasPermission(Permission.CREATE_PARTNERS)
    });

    // Rediriger si l'utilisateur n'a pas les permissions nécessaires
    if (isAuthenticated && !isAdmin()) {
      console.log("❌ Accès refusé - Utilisateur non administrateur");
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        "Accès refusé"
      ));
      router.push("/tableaudebord");
      return;
    }

    if (isAuthenticated && !hasPermission(Permission.CREATE_PARTNERS)) {
      console.log("❌ Accès refusé - Permission CREATE_PARTNERS manquante");
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        "Permissions insuffisantes"
      ));
      router.push("/tableaudebord");
      return;
    }
  }, [isAuthenticated, user, isAdmin, canCreate, hasPermission, router, showNotification]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du partenaire est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements du formulaire
  const handleInputChange = (field: keyof PartnerForm, value: string) => {
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

  // Soumission du formulaire
  const handleSubmit = async () => {
    console.log("🚀 Début de la soumission du formulaire");
    
    // Debug d'authentification détaillé
    const token = localStorage.getItem('authToken');
    console.log("🔑 Debug authentification:", {
      isAuthenticated,
      user,
      token: token ? `${token.substring(0, 20)}...` : null,
      userObject: user,
    });
    
    if (!validateForm()) {
      console.log("❌ Validation du formulaire échouée");
      return;
    }

    if (!isAuthenticated || !user) {
      const errorMsg = "Vous devez être connecté pour créer un partenaire";
      console.log("❌ Utilisateur non authentifié");
      showNotification(simpleNotificationHelpers.error(
        "Erreur d'authentification",
        errorMsg
      ));
      return;
    }

    // Vérifier explicitement le token dans le service
    if (!token) {
      console.log("❌ Aucun token trouvé dans localStorage");
      showNotification(simpleNotificationHelpers.error(
        "Erreur d'authentification",
        "Token d'authentification manquant"
      ));
      return;
    }

    setIsSubmitting(true);
    setSubmitStep('creating');
    console.log("📤 Envoi des données à l'API...");

    try {
      // S'assurer que le token est bien défini dans le service
      partnersService.setToken(token);
      console.log("🔐 Token défini dans le service");

      // Préparer les données pour l'API
      const partnerData: CreatePartnerFormData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        is_active: formData.is_active,
      };

      console.log("📋 Données préparées:", partnerData);

      // Notification initiale
      showNotification(simpleNotificationHelpers.info(
        "Création en cours...",
        `Création du partenaire ${formData.name}`
      ));
      
      console.log("📡 Appel API en cours...");
      const result = await partnersService.createPartner(partnerData, user?.id);
      
      console.log("📨 Réponse de l'API:", result);
      
      if (result.code === 200) {
        console.log("✅ Partenaire créé avec succès:", result);
        setSubmitStep('completed');
        
        // Notification de succès
        showNotification(simpleNotificationHelpers.success(
          "Partenaire créé ! 🎉",
          `${formData.name} a été créé avec succès`
        ));
        
        // Redirection vers la liste
        setTimeout(() => {
          router.push("/tableaudebord/partenaire/liste");
        }, 1500);
      } else {
        throw new Error(result.message?.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la création:", error);
      
      let errorTitle = "Erreur";
      let errorMessage = "Erreur inconnue";
      
      if (error instanceof Error) {
        // Essayer d'extraire le message JSON de l'erreur API
        try {
          // Le message d'erreur peut contenir du JSON, essayons de l'extraire
          const errorString = error.message;
          
          // Vérifier si le message contient du JSON
          const jsonMatch = errorString.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } else {
            errorMessage = errorString;
          }
        } catch {
          errorMessage = error.message;
        }
        
        // Vérifier les cas d'erreur spécifiques
        if (errorMessage.includes("téléphone") && errorMessage.includes("existe déjà")) {
          errorTitle = "📞 Numéro de téléphone déjà utilisé";
          
          // Extraire le numéro de téléphone du message
          const phoneMatch = errorMessage.match(/'([+0-9]+)'/);
          const phoneNumber = phoneMatch ? phoneMatch[1] : formData.phone;
          
          errorMessage = `Le numéro de téléphone ${phoneNumber} est déjà associé à un autre partenaire.\n\nVeuillez vérifier et utiliser un numéro différent.`;
        } else if (errorMessage.includes("email") && errorMessage.includes("existe déjà")) {
          errorTitle = "📧 Adresse email déjà utilisée";
          errorMessage = `Cette adresse email est déjà associée à un autre partenaire. Veuillez utiliser une adresse différente.`;
        } else if (errorMessage.includes("name") && errorMessage.includes("existe déjà")) {
          errorTitle = "🏢 Nom de partenaire déjà utilisé";
          errorMessage = `Ce nom de partenaire existe déjà. Veuillez choisir un nom différent.`;
        }
      }
      
      showNotification(simpleNotificationHelpers.error(
        errorTitle,
        errorMessage
      ));
      setSubmitStep('idle');
    } finally {
      setIsSubmitting(false);
      console.log("🏁 Fin de la soumission");
    }
  };

  return (
    <PermissionGuard permissions={[Permission.CREATE_PARTNERS, Permission.CREATE_PARTNERS_ACCOUNTS]}>
      <Breadcrumb pageName="Ajouter un Partenaire" />

      <div className="mx-auto max-w-4xl space-y-6">
        <SectionHeader
          title="Nouveau Partenaire"
          subtitle="Créez un partenariat stratégique en remplissant les informations ci-dessous"
          icon={<Building />}
          actions={
            <Link href="/tableaudebord/partenaire/liste">
              <ProfessionalButton
                variant="outline"
                startContent={<ArrowLeft className="h-4 w-4" />}
              >
                Retour à la liste
              </ProfessionalButton>
            </Link>
          }
        />

        <ProfessionalCard>
          <div className="space-y-8">
            {/* Informations de base */}
            <div>
              <SectionHeader
                title="Informations de Base"
                icon={<Building />}
                variant="compact"
                divider
              />
              
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom du partenaire <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Ex: TechCorp Solutions"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                    startContent={<Building className="h-4 w-4 text-gray-400" />}
                    size="lg"
                    variant="bordered"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@partenaire.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                    startContent={<Mail className="h-4 w-4 text-gray-400" />}
                    size="lg"
                    variant="bordered"
                  />
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="+33 1 23 45 67 89"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    isInvalid={!!errors.phone}
                    errorMessage={errors.phone}
                    startContent={<Phone className="h-4 w-4 text-gray-400" />}
                    size="lg"
                    variant="bordered"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut
                  </label>
                  <Select
                    selectedKeys={[formData.is_active ? "actif" : "inactif"]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      setFormData(prev => ({ ...prev, is_active: value === "actif" }));
                    }}
                    size="lg"
                    variant="bordered"
                    startContent={<Shield className="h-4 w-4 text-gray-400" />}
                  >
                    <SelectItem key="actif" value="actif">✅ Actif</SelectItem>
                    <SelectItem key="inactif" value="inactif">⚪ Inactif</SelectItem>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Adresse complète du partenaire (rue, ville, code postal, pays)"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  isInvalid={!!errors.address}
                  errorMessage={errors.address}
                  minRows={3}
                  size="lg"
                  variant="bordered"
                />
              </div>
            </div>
            
            <Divider />
            
            {/* Actions */}
            <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <Link href="/tableaudebord/partenaire/liste">
                  <ProfessionalButton
                    variant="outline"
                    size="lg"
                    startContent={<ArrowLeft className="h-4 w-4" />}
                    isDisabled={isSubmitting}
                  >
                    Annuler
                  </ProfessionalButton>
                </Link>
                
                <ProfessionalButton
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <Save className="h-4 w-4" />}
                  isDisabled={!formData.name || !formData.email || !formData.phone || !formData.address}
                >
                  {isSubmitting ? (
                    submitStep === 'creating' ? "Création du partenaire..." :
                    submitStep === 'completed' ? "Terminé !" :
                    "Création en cours..."
                  ) : "Créer le Partenaire"}
                </ProfessionalButton>
              </div>
            </div>
          </div>
        </ProfessionalCard>
      </div>
    </PermissionGuard>
  );
};

export default AjouterPartenaire;