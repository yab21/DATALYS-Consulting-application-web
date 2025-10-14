"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
} from "@nextui-org/react";
import {
  User,
  Mail,
  Lock,
  Shield,
  Users,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission, UserRole } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { UsersService, CreateUserData } from "@/services/users";
import { partnersService, Partner as PartnerType } from "@/services/partners";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfessionalCard, ProfessionalButton, SectionHeader } from "@/components/UI/Professional";

// Types pour le formulaire
interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role_name: string; // Changement pour correspondre à l'API
  partner_id?: number;
  is_active: boolean;
}

// Utilise le type Partner du service
type Partner = PartnerType;

const AjouterUtilisateur: React.FC = () => {
  const router = useRouter();
  const {
    isAuthenticated,
    isAdmin,
    hasPermission,
  } = useAuth();

  const { showNotification } = useSimpleNotifications();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_name: "admin", // Valeur par défaut pour les admins uniquement
    is_active: true,
  });

  // Vérification des permissions d'accès
  useEffect(() => {
    if (isAuthenticated && !isAdmin()) {
      showNotification({
        type: "error",
        title: "Accès refusé",
        message: "Seuls les administrateurs peuvent créer des utilisateurs",
        duration: 5000,
      });
      router.push("/tableaudebord");
      return;
    }

    if (isAuthenticated && !hasPermission(Permission.CREATE_USERS)) {
      showNotification({
        type: "error",
        title: "Permissions insuffisantes",
        message: "Vous n'avez pas la permission de créer des utilisateurs",
        duration: 5000,
      });
      router.push("/tableaudebord");
      return;
    }
  }, [isAuthenticated, isAdmin, hasPermission, router, showNotification]);

  // Chargement des partenaires pour la sélection
  useEffect(() => {
    const loadPartners = async () => {
      setLoadingPartners(true);
      try {
        const response = await partnersService.getPartners();
        
        // Adapter selon le format de réponse de l'API
        let partnersData;
        if (response.code === 200 && response.items) {
          partnersData = response.items;
        } else if (Array.isArray(response)) {
          partnersData = response;
        } else {
          partnersData = response;
        }

        if (partnersData && Array.isArray(partnersData)) {
          // Filtrer seulement les partenaires actifs
          setPartners(partnersData.filter(p => p.is_active && !p.is_deleted));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des partenaires:", error);
        // En cas d'erreur, afficher un message mais pas bloquer
        showNotification({
          type: "warning",
          title: "Attention",
          message: "Impossible de charger la liste des partenaires",
          duration: 3000,
        });
      } finally {
        setLoadingPartners(false);
      }
    };

    loadPartners();
  }, [showNotification]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre";
    }

    // Validation de la confirmation du mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    // Validation du rôle
    if (!formData.role_name) {
      newErrors.role_name = "Vous devez sélectionner un rôle";
    }

    // Validation du partenaire pour les utilisateurs partenaires (optionnel)
    // if (formData.role_name === "partner" && !formData.partner_id) {
    //   newErrors.partner_id = "Vous devez sélectionner un partenaire";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field: keyof UserFormData, value: any) => {
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
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData: CreateUserData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_name: formData.role_name,
        partner_id: formData.partner_id,
        is_active: formData.is_active,
      };

      const response = await UsersService.createUser(userData);
      
      if (response.code === 200 || response.status === 'success') {
        showNotification({
          type: "success",
          title: "Utilisateur créé",
          message: `${formData.name} a été créé avec succès`,
          duration: 3000,
        });

        // Redirection vers la liste des utilisateurs
        router.push("/tableaudebord/gestion-utilisateurs");
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      showNotification({
        type: "error",
        title: "Erreur de création",
        message: error instanceof Error ? error.message : "Impossible de créer l'utilisateur",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin() || !hasPermission(Permission.CREATE_USERS)) {
    return null; // Le useEffect redirige déjà
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeader
        title="Nouvel Utilisateur"
        subtitle="Créez un compte administrateur avec accès complet au système"
        icon={<UserPlus />}
        actions={
          <Link href="/tableaudebord/gestion-utilisateurs">
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
              title="Informations Personnelles"
              icon={<User />}
              variant="compact"
              color="primary"
              divider
            />

            
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Ex: Jean Dupont"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                  startContent={<User className="h-4 w-4 text-gray-400" />}
                  size="lg"
                  variant="bordered"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="jean@datalys.com"
                  type="email"
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
          </div>

              <Divider />

          {/* Mot de passe */}
          <div>
            <SectionHeader
              title="Sécurité"
              icon={<Lock />}
              variant="compact"
              color="primary"
              divider
            />

            
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Mot de passe sécurisé"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  startContent={<Lock className="h-4 w-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  size="lg"
                  variant="bordered"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Confirmer le mot de passe"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  isInvalid={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword}
                  startContent={<Lock className="h-4 w-4 text-gray-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  size="lg"
                  variant="bordered"
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#4ba9b7]/30 bg-[#e0f4f6] p-4 dark:bg-[#4ba9b7]/20 dark:border-[#4ba9b7]/50">
              <p className="text-sm text-[#3a8a95] dark:text-[#7bc5cd]">
                <strong>Exigences de sécurité :</strong> Minimum 8 caractères avec au moins
                une majuscule, une minuscule et un chiffre.
              </p>
            </div>
          </div>

              <Divider />

          {/* Rôle et permissions */}
          <div>
            <SectionHeader
              title="Rôle et Permissions"
              icon={<Shield />}
              variant="compact"
              color="primary"
              divider
            />

            
            <div className="space-y-2 mt-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rôle utilisateur <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Sélectionner un rôle"
                selectedKeys={formData.role_name ? [formData.role_name] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  handleInputChange("role_name", value);
                  
                  // Reset partner_id when changing role
                  if (value === "admin") {
                    handleInputChange("partner_id", undefined);
                  }
                }}
                isInvalid={!!errors.role_name}
                errorMessage={errors.role_name}
                size="lg"
                variant="bordered"
                startContent={
                  formData.role_name === "admin" ? (
                    <Shield className="h-4 w-4 text-[#4ba9b7]" />
                  ) : (
                    <Users className="h-4 w-4 text-[#4ba9b7]" />
                  )
                }
              >
                <SelectItem key="admin" value="admin">
                  Administrateur - Contrôle total du système
                </SelectItem>
              </Select>
            </div>

            
            {/* Description du rôle */}
            <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              {formData.role_name === "admin" ? (
                <div>
                  <h5 className="mb-2 font-semibold text-[#3a8a95] dark:text-[#4ba9b7]">
                    Permissions Administrateur
                  </h5>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Gestion complète des utilisateurs et partenaires
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Création, modification et suppression de projets
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Accès à tous les documents et fichiers
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Dashboard global et analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Gestion des incidents et support
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <h5 className="mb-2 font-semibold text-[#3a8a95] dark:text-[#4ba9b7]">
                    Permissions Utilisateur Standard
                  </h5>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Consultation de ses projets uniquement
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Accès en lecture seule à ses documents
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#4ba9b7]"></div>
                      Dashboard personnel limité
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

              <Divider />

          {/* Statut */}
          <div>
            <SectionHeader
              title="Statut du Compte"
              icon={<Users />}
              variant="compact"
              color="primary"
              divider
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#4ba9b7]" />
                  <div>
                    <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                      Compte actif
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      L'utilisateur pourra se connecter immédiatement après création
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(value) => handleInputChange("is_active", value)}
                  color="success"
                  size="lg"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-600">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Link href="/tableaudebord/gestion-utilisateurs">
                <ProfessionalButton
                  variant="outline"
                  size="lg"
                  isDisabled={loading}
                  startContent={<ArrowLeft className="h-4 w-4" />}
                >
                  Annuler
                </ProfessionalButton>
              </Link>
              
              <ProfessionalButton
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                isLoading={loading}
                startContent={!loading && <Save className="h-4 w-4" />}
                isDisabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.role_name}
              >
                {loading ? "Création en cours..." : "Créer l'Utilisateur"}
              </ProfessionalButton>
            </div>
          </div>
        </div>
      </ProfessionalCard>
    </div>
  );
};

export default AjouterUtilisateur;