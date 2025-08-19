"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { partnersService, CreatePartnerFormData } from "@/services/partners";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, notificationHelpers } from "@/components/UI/Notifications/NotificationSystem";
import { Permission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/Security/PermissionGuard";

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
  const { showNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<'idle' | 'creating' | 'uploading' | 'completed'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Nouveaux états pour le modal de logo
  const [createdPartnerId, setCreatedPartnerId] = useState<number | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const { isOpen: isLogoModalOpen, onOpen: onLogoModalOpen, onClose: onLogoModalClose } = useDisclosure();

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
      showNotification(notificationHelpers.error(
        "Accès refusé",
        "Seuls les administrateurs peuvent créer des partenaires"
      ));
      router.push("/tableaudebord");
      return;
    }

    if (isAuthenticated && !hasPermission(Permission.CREATE_PARTNERS)) {
      console.log("❌ Accès refusé - Permission CREATE_PARTNERS manquante");
      showNotification(notificationHelpers.error(
        "Permissions insuffisantes",
        "Vous n'avez pas la permission de créer des partenaires"
      ));
      router.push("/tableaudebord");
      return;
    }
  }, [isAuthenticated, user, isAdmin, canCreate, hasPermission, router, showNotification]);

  // Fonction de test de l'API (accessible dans la console)
  const testAPI = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      partnersService.setToken(token);
      return await partnersService.testCreateEndpoint();
    }
    return { error: 'Pas de token' };
  };

  // Exposer la fonction de test globalement pour le debug
  useEffect(() => {
    (window as any).testAPI = testAPI;
  }, []);

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

  // Nouvelle gestion du logo dans le modal
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      console.log("Logo sélectionné:", file.name);
    }
  };

  // Upload du logo via le modal
  const handleLogoUpload = async () => {
    if (!logoFile || !createdPartnerId) return;

    setLogoUploading(true);
    try {
      // Appel au service pour uploader le logo
      await partnersService.uploadPartnerLogo(createdPartnerId, logoFile);
      
      showNotification(notificationHelpers.success(
        "Logo ajouté ! 🎨",
        "Le logo a été ajouté avec succès au partenaire"
      ));
      
      onLogoModalClose();
      
      // Rediriger vers la liste après un délai
      setTimeout(() => {
        router.push("/tableaudebord/partenaire/liste");
      }, 1500);
      
    } catch (error) {
      console.error("Erreur upload logo:", error);
      showNotification(notificationHelpers.error(
        "Erreur upload logo",
        "Impossible d'ajouter le logo. Vous pourrez l'ajouter plus tard via la modification du partenaire."
      ));
    } finally {
      setLogoUploading(false);
    }
  };

  // Ignorer le logo et aller directement à la liste
  const handleSkipLogo = () => {
    onLogoModalClose();
    router.push("/tableaudebord/partenaire/liste");
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
      showNotification(notificationHelpers.error(
        "Erreur d'authentification",
        errorMsg
      ));
      return;
    }

    // Vérifier explicitement le token dans le service
    if (!token) {
      console.log("❌ Aucun token trouvé dans localStorage");
      showNotification(notificationHelpers.error(
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

      // Préparer les données pour l'API (sans logo)
      const partnerData: CreatePartnerFormData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        is_active: formData.is_active,
        logo: undefined, // Pas de logo dans cette étape
      };

      console.log("📋 Données préparées (sans logo):", partnerData);

      // Notification initiale
      showNotification(notificationHelpers.info(
        "Création en cours...",
        `Création du partenaire ${formData.name}`
      ));
      
      console.log("📡 Appel API en cours...");
      const result = await partnersService.createPartner(partnerData, user?.id);
      
      console.log("📨 Réponse de l'API:", result);
      
      if (result.code === 200) {
        console.log("✅ Partenaire créé avec succès:", result);
        setSubmitStep('completed');
        
        // Récupérer l'ID du partenaire créé
        const partnerId = result.items?.[0]?.id;
        if (partnerId) {
          setCreatedPartnerId(partnerId);
        }
        
        // Notification de succès
        showNotification(notificationHelpers.success(
          "Partenaire créé ! 🎉",
          `${formData.name} a été créé avec succès`
        ));
        
        // Ouvrir le modal pour uploader le logo
        setTimeout(() => {
          onLogoModalOpen();
        }, 1000);
      } else {
        throw new Error(result.message?.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la création:", error);
      
      let errorTitle = "Erreur de création";
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
      
      showNotification(notificationHelpers.error(
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

      <div className="mx-auto max-w-5xl space-y-8">
        {/* En-tête amélioré */}
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
                <h1 className="relative mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-4xl font-black text-transparent dark:from-cyan-400 dark:to-blue-400">
                  Nouveau Partenaire
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Créez un partenariat stratégique en remplissant les informations ci-dessous
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Étape 1 sur 1 - Configuration du partenaire
                  </span>
                </div>
              </div>

              <Link href="/tableaudebord/partenaire/liste">
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
                {/* Informations de base */}
                <div className="relative">
                  <div className="absolute -left-6 top-2 h-12 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Informations de Base
                    </h3>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nom du partenaire *
                      </label>
                      <Input
                        variant="bordered"
                        placeholder="Ex: TechCorp Solutions"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        isInvalid={!!errors.name}
                        errorMessage={errors.name}
                        isRequired
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium",
                          inputWrapper:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-cyan-400 dark:hover:border-cyan-500 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                        }}
                      />
                    </div>

                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Adresse *
                      </label>
                      <Textarea
                        variant="bordered"
                        placeholder="Adresse complète du partenaire (rue, ville, code postal, pays)"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        minRows={3}
                        maxRows={4}
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium leading-relaxed",
                          inputWrapper:
                            "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-900/25",
                        }}
                      />
                    </div>
                  </div>

                </div>


                {/* Contact */}
                <div className="relative">
                  <div className="absolute -left-6 top-2 h-12 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Informations de Contact
                    </h3>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Email *
                      </label>
                      <Input
                        variant="bordered"
                        type="email"
                        placeholder="contact@partenaire.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        isInvalid={!!errors.email}
                        errorMessage={errors.email}
                        isRequired
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium",
                          inputWrapper:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-900/25",
                        }}
                      />
                    </div>

                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        Téléphone *
                      </label>
                      <Input
                        variant="bordered"
                        placeholder="+33 1 23 45 67 89"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        isInvalid={!!errors.phone}
                        errorMessage={errors.phone}
                        isRequired
                        size="lg"
                        className="text-base"
                        classNames={{
                          input:
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium",
                          inputWrapper:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-900/25",
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                        </svg>
                        Statut
                      </label>
                      <Select
                        selectedKeys={[formData.is_active ? "actif" : "inactif"]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          setFormData(prev => ({ ...prev, is_active: value === "actif" }));
                        }}
                        size="lg"
                        className="text-base"
                        classNames={{
                          trigger:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-900/25",
                          value: "text-gray-900 dark:text-white font-medium",
                        }}
                      >
                        <SelectItem
                          key="actif"
                          value="actif"
                          className="text-gray-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          ✅ Actif
                        </SelectItem>
                        <SelectItem
                          key="inactif"
                          value="inactif"
                          className="text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/20"
                        >
                          ⚪ Inactif
                        </SelectItem>
                        <SelectItem
                          key="suspendu"
                          value="suspendu"
                          className="text-gray-900 dark:text-white hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                          ⏸️ Suspendu
                        </SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-8 group">
                    <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                      <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Adresse
                    </label>
                    <Textarea
                      variant="bordered"
                      placeholder="Adresse complète du partenaire (rue, ville, code postal, pays)"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      minRows={3}
                      maxRows={4}
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium leading-relaxed",
                        inputWrapper:
                          "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-900/25",
                      }}
                    />
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
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-lg font-bold shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-600 hover:to-blue-700 hover:shadow-cyan-500/40 hover:-translate-y-1 active:scale-95"
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
                    {isSubmitting ? (
                      submitStep === 'creating' ? "📝 Création du partenaire..." :
                      submitStep === 'uploading' ? "🖼️ Upload du logo..." :
                      submitStep === 'completed' ? "✅ Terminé !" :
                      "Création en cours..."
                    ) : "🚀 Créer le Partenaire"}
                  </Button>

                  <Link
                    href="/tableaudebord/partenaire/liste"
                    className="flex-1"
                  >
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

      {/* Modal pour upload de logo */}
      <Modal 
        isOpen={isLogoModalOpen} 
        onClose={onLogoModalClose}
        size="lg"
        placement="center"
        classNames={{
          base: "bg-white dark:bg-gray-800",
          backdrop: "bg-black/60 backdrop-blur-sm",
          header: "border-b border-gray-200 dark:border-gray-600",
          footer: "border-t border-gray-200 dark:border-gray-600",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Ajouter un logo
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ajoutez un logo pour votre partenaire (optionnel)
                  </p>
                </div>
              </ModalHeader>
              
              <ModalBody className="py-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex h-32 w-32 items-center justify-center mx-auto overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-purple-400 transition-all duration-300 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:hover:border-purple-500">
                      {logoFile ? (
                        <div className="p-4 text-center text-sm">
                          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 mx-auto shadow-lg shadow-green-400/25">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="font-semibold text-gray-700 dark:text-gray-300">
                            Logo sélectionné
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-400 dark:text-gray-500">
                          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 mx-auto dark:from-gray-700 dark:to-gray-600">
                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="font-medium">Sélectionner un logo</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="block w-full text-base text-gray-600 file:mr-6
                        file:cursor-pointer file:rounded-2xl file:border-0
                        file:bg-gradient-to-r file:from-purple-50 file:to-pink-50 file:px-8
                        file:py-4 file:text-base
                        file:font-semibold file:text-purple-700
                        hover:file:from-purple-100 hover:file:to-pink-100 hover:file:shadow-lg
                        file:transition-all file:duration-300
                        dark:text-gray-400 dark:file:from-purple-900/30 dark:file:to-pink-900/30
                        dark:file:text-purple-400 dark:hover:file:from-purple-800/40 dark:hover:file:to-pink-800/40"
                    />
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="h-4 w-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      PNG, JPG, GIF jusqu'à 2MB • Recommandé: 256x256px
                    </div>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="light"
                  onPress={handleSkipLogo}
                  isDisabled={logoUploading}
                >
                  Ignorer le logo
                </Button>
                <Button
                  color="primary"
                  onPress={handleLogoUpload}
                  isLoading={logoUploading}
                  isDisabled={!logoFile}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  {logoUploading ? "Upload en cours..." : "Ajouter le logo"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </PermissionGuard>
  );
};

export default AjouterPartenaire;
