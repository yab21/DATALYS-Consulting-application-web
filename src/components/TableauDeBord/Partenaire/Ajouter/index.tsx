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
} from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Types
interface PartnerForm {
  nom: string;
  logo: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  adresse: string;
  responsable: string;
  statut: "actif" | "inactif" | "suspendu";
}

// Options prédéfinies
const SECTEURS = [
  "Technologie",
  "Finance",
  "Santé",
  "Logistique",
  "Commerce",
  "Industrie",
  "Education",
  "Immobilier",
  "Agriculture",
  "Autre",
];

const AjouterPartenaire: React.FC = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PartnerForm>({
    nom: "",
    logo: "",
    secteur: "",
    description: "",
    email: "",
    telephone: "",
    adresse: "",
    responsable: "",
    statut: "actif",
  });

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom du partenaire est requis";
    }

    if (!formData.secteur) {
      newErrors.secteur = "Le secteur est requis";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis";
    }

    if (!formData.responsable.trim()) {
      newErrors.responsable = "Le responsable est requis";
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

  // Gestion de l'upload de logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulation d'upload - en production, vous uploaderiez vers un service
      const mockUrl = `/images/partners/${file.name}`;
      handleInputChange("logo", mockUrl);
      console.log("Logo uploadé:", file.name);
    }
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulation de l'envoi - en production, vous feriez un appel API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newPartner = {
        id: `partner-${Date.now()}`,
        ...formData,
        dateCreation: new Date(),
        nombreProjets: 0,
        nombreIncidents: 0,
      };

      console.log("Nouveau partenaire créé:", newPartner);

      // Afficher la modal de confirmation
      onOpen();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retour à la liste
  const handleReturnToList = () => {
    onClose();
    router.push("/tableaudebord/partenaire/liste");
  };

  return (
    <>
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
                        value={formData.nom}
                        onChange={(e) =>
                          handleInputChange("nom", e.target.value)
                        }
                        isInvalid={!!errors.nom}
                        errorMessage={errors.nom}
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
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H3.862a2 2 0 01-1.995-1.858L1 7m18 0l-2.5-5H15.5m3.5 5l-8 8L3 7m16 0H3m0 0l2.5-5H9.5M7 9v8M13 9v8"/>
                        </svg>
                        Secteur d'activité *
                      </label>
                      <Select
                        variant="bordered"
                        selectedKeys={
                          formData.secteur ? [formData.secteur] : []
                        }
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          handleInputChange("secteur", value || "");
                        }}
                        isInvalid={!!errors.secteur}
                        errorMessage={errors.secteur}
                        isRequired
                        size="lg"
                        className="text-base"
                        classNames={{
                          trigger:
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-cyan-400 dark:hover:border-cyan-500 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                          value: "text-gray-900 dark:text-white font-medium",
                        }}
                      >
                        {SECTEURS.map((secteur) => (
                          <SelectItem
                            key={secteur}
                            value={secteur}
                            className="text-gray-900 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                          >
                            {secteur}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="mt-8 group">
                    <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                      <svg className="h-4 w-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                      </svg>
                      Description *
                    </label>
                    <Textarea
                      variant="bordered"
                      placeholder="Description détaillée de l'activité du partenaire, ses services et domaines d'expertise"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      minRows={4}
                      maxRows={6}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description}
                      isRequired
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium leading-relaxed",
                        inputWrapper:
                          "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-cyan-400 dark:hover:border-cyan-500 focus-within:border-cyan-500 dark:focus-within:border-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-cyan-200/50 dark:group-hover:shadow-cyan-900/25",
                      }}
                    />
                  </div>
                </div>

                {/* Logo */}
                <div className="relative">
                  <div className="absolute -left-6 top-2 h-12 w-1 rounded-full bg-gradient-to-b from-purple-500 to-pink-600"></div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Logo du Partenaire
                    </h3>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-purple-400 transition-all duration-300 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:hover:border-purple-500">
                        {formData.logo ? (
                          <div className="p-4 text-center text-sm">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 mx-auto shadow-lg shadow-green-400/25">
                              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="font-semibold text-gray-700 dark:text-gray-300">
                              Logo ajouté
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors duration-300">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 mx-auto dark:from-gray-700 dark:to-gray-600 group-hover:from-purple-100 group-hover:to-purple-200 dark:group-hover:from-purple-900/30 dark:group-hover:to-purple-800/30 transition-all duration-300">
                              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="font-medium">Logo</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
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
                        value={formData.telephone}
                        onChange={(e) =>
                          handleInputChange("telephone", e.target.value)
                        }
                        isInvalid={!!errors.telephone}
                        errorMessage={errors.telephone}
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

                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div className="group">
                      <label className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                        <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Responsable *
                      </label>
                      <Input
                        variant="bordered"
                        placeholder="Nom du responsable"
                        value={formData.responsable}
                        onChange={(e) =>
                          handleInputChange("responsable", e.target.value)
                        }
                        isInvalid={!!errors.responsable}
                        errorMessage={errors.responsable}
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
                          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                        </svg>
                        Statut
                      </label>
                      <Select
                        selectedKeys={[formData.statut]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as
                            | "actif"
                            | "inactif"
                            | "suspendu";
                          handleInputChange("statut", value);
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
                      value={formData.adresse}
                      onChange={(e) =>
                        handleInputChange("adresse", e.target.value)
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
                    {isSubmitting
                      ? "Création en cours..."
                      : "🚀 Créer le Partenaire"}
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

      {/* Modal de confirmation améliorée */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" className="dark">
        <ModalContent className="bg-white dark:bg-gray-900 border-0 shadow-2xl">
          <ModalHeader className="relative overflow-hidden border-b border-gray-200/50 pb-6 pt-8 dark:border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20"></div>
            <div className="relative flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 shadow-2xl shadow-green-500/30">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                  Partenaire Créé ! 🎉
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Nouveau partenariat établi avec succès
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-8 py-8">
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-300 mb-4">
                  🤝 Le partenaire{" "}
                  <span className="font-black text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text dark:from-cyan-400 dark:to-blue-400">
                    {formData.nom}
                  </span>{" "}
                  a rejoint notre écosystème !
                </p>
              </div>

              <div className="relative rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 shadow-xl dark:from-gray-800 dark:via-gray-750 dark:to-gray-700">
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 blur-2xl"></div>
                <div className="relative mb-6 flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/25">
                    <span className="text-3xl font-black text-white">
                      {formData.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {formData.nom}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <Chip
                        size="lg"
                        variant="solid"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold shadow-lg"
                      >
                        📊 {formData.secteur}
                      </Chip>
                      <Chip
                        size="lg"
                        variant="solid"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg"
                      >
                        {formData.statut === 'actif' ? '✅' : formData.statut === 'suspendu' ? '⏸️' : '⚪'} {formData.statut}
                      </Chip>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-4 rounded-2xl bg-white/50 dark:bg-gray-700/50 p-4 backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white/50 dark:bg-gray-700/50 p-4 backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{formData.responsable}</span>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="relative overflow-hidden border-t border-gray-200/50 pt-6 pb-8 dark:border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-white/30 to-gray-50/50 dark:from-gray-800/50 dark:via-gray-900/30 dark:to-gray-800/50"></div>
            <div className="relative w-full flex justify-center">
              <Button
                color="primary"
                size="lg"
                onPress={handleReturnToList}
                className="px-12 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-xl font-bold shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:from-cyan-600 hover:via-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95"
                startContent={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
              >
                📋 Voir la Liste des Partenaires
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AjouterPartenaire;
