"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Button,
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission, UserRole } from "@/lib/permissions";
import { useNotifications } from "@/components/UI/Notifications/NotificationSystem";
import { UsersService, CreateUserData } from "@/services/users";
import { partnersService, Partner as PartnerType } from "@/services/partners";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const { showNotification } = useNotifications();
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
    role_name: "partner", // Valeur par défaut correspondant à l'API
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
        } else if (response.status === 'success' && response.data) {
          partnersData = response.data;
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
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 shadow-lg dark:border-gray-700 dark:from-blue-900/20 dark:via-gray-800 dark:to-purple-900/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Créer un Utilisateur
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Ajoutez un nouvel administrateur ou un compte partenaire
            </p>
          </div>
          <Link href="/tableaudebord/gestion-utilisateurs">
            <Button
              variant="flat"
              size="lg"
              startContent={<ArrowLeft className="h-5 w-5" />}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              Retour à la liste
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Formulaire */}
      <motion.div
        className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="space-y-8">
              {/* Informations de base */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Informations Personnelles
                  </h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
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
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="jean@exemple.com"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email}
                      startContent={<Mail className="h-4 w-4 text-gray-400" />}
                      size="lg"
                      variant="bordered"
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              {/* Mot de passe */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-cyan-600 text-white">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Sécurité
                  </h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
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
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                      size="lg"
                      variant="bordered"
                      className="bg-white dark:bg-gray-700"
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
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                      size="lg"
                      variant="bordered"
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Exigences de mot de passe :</strong> Minimum 8 caractères avec au moins
                    une majuscule, une minuscule et un chiffre.
                  </p>
                </div>
              </div>

              <Divider />

              {/* Rôle et permissions */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Rôle et Permissions
                  </h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
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
                          <Shield className="h-4 w-4 text-red-500" />
                        ) : (
                          <Users className="h-4 w-4 text-blue-500" />
                        )
                      }
                      className="bg-white dark:bg-gray-700"
                    >
                      <SelectItem key="admin" value="admin">
                        Administrateur - Contrôle total
                      </SelectItem>
                      <SelectItem key="partner" value="partner">
                        Partenaire - Lecture seule
                      </SelectItem>
                    </Select>
                  </div>

                  {formData.role_name === "partner" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Partenaire associé <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <Select
                        placeholder="Sélectionner un partenaire"
                        selectedKeys={formData.partner_id ? [formData.partner_id.toString()] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          handleInputChange("partner_id", parseInt(value));
                        }}
                        isInvalid={!!errors.partner_id}
                        errorMessage={errors.partner_id}
                        size="lg"
                        variant="bordered"
                        startContent={<Users className="h-4 w-4 text-gray-400" />}
                        className="bg-white dark:bg-gray-700"
                        isLoading={loadingPartners}
                      >
                        {partners.map((partner) => (
                          <SelectItem key={partner.id.toString()} value={partner.id.toString()}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>

                {/* Description du rôle */}
                <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                  {formData.role_name === "admin" ? (
                    <div>
                      <h5 className="mb-2 font-semibold text-red-700 dark:text-red-400">
                        Permissions Administrateur
                      </h5>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Gestion complète des utilisateurs et partenaires</li>
                        <li>• Création, modification et suppression de projets</li>
                        <li>• Accès à tous les documents et fichiers</li>
                        <li>• Dashboard global et analytics</li>
                        <li>• Gestion des incidents et support</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <h5 className="mb-2 font-semibold text-blue-700 dark:text-blue-400">
                        Permissions Utilisateur/Partenaire
                      </h5>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Consultation de ses projets uniquement</li>
                        <li>• Accès en lecture seule à ses documents</li>
                        <li>• Dashboard personnel limité</li>
                        <li>• Communication avec les administrateurs</li>
                        <li>• Signalement d'incidents sur ses projets</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <Divider />

              {/* Statut */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Statut du Compte
                  </h3>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Compte actif
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        L'utilisateur pourra se connecter immédiatement après création
                      </p>
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
                    <Button
                      variant="flat"
                      size="lg"
                      className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:w-auto"
                      isDisabled={loading}
                      startContent={<ArrowLeft className="h-4 w-4" />}
                    >
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    color="primary"
                    size="lg"
                    onPress={handleSubmit}
                    isLoading={loading}
                    startContent={!loading && <Save className="h-5 w-5" />}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 sm:w-auto"
                    isDisabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.role_name}
                  >
                    {loading ? "Création en cours..." : "Créer l'Utilisateur"}
                  </Button>
                </div>
              </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AjouterUtilisateur;