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
        {/* En-tête */}
        <motion.div
          className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-gray-900/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
                Nouveau Partenaire
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Remplissez les informations ci-dessous pour ajouter un nouveau
                partenaire
              </p>
            </div>

            <Link href="/tableaudebord/partenaire/liste">
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
          className="rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-gray-900/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-transparent shadow-none">
            <CardBody className="p-8">
              <div className="space-y-8">
                {/* Informations de base */}
                <div>
                  <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                    Informations de Base
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                          value: "text-gray-900 dark:text-white font-medium",
                        }}
                      >
                        {SECTEURS.map((secteur) => (
                          <SelectItem
                            key={secteur}
                            value={secteur}
                            className="text-gray-900 dark:text-white"
                          >
                            {secteur}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Description *
                    </label>
                    <Textarea
                      variant="bordered"
                      placeholder="Description de l'activité du partenaire et de ses services"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      minRows={3}
                      maxRows={5}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description}
                      isRequired
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200",
                      }}
                    />
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                    Logo du Partenaire
                  </h3>

                  <div className="flex items-center gap-6">
                    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                      {formData.logo ? (
                        <div className="p-3 text-center text-sm">
                          <div className="mb-2 text-xl text-green-600 dark:text-green-400">
                            ✓
                          </div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">
                            Logo ajouté
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-gray-400 dark:text-gray-500">
                          <div className="mb-2 text-2xl">📷</div>
                          <div>Logo</div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-base text-gray-500 file:mr-4
                          file:cursor-pointer file:rounded-xl file:border-0
                          file:bg-blue-50 file:px-6
                          file:py-3 file:text-base
                          file:font-semibold file:text-blue-700
                          hover:file:bg-blue-100
                          dark:text-gray-400 dark:file:bg-blue-900/30
                          dark:file:text-blue-400"
                      />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF jusqu'à 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                    Informations de Contact
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                          inputWrapper:
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
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
                            "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300",
                          value: "text-gray-900 dark:text-white font-medium",
                        }}
                      >
                        <SelectItem
                          key="actif"
                          value="actif"
                          className="text-gray-900 dark:text-white"
                        >
                          Actif
                        </SelectItem>
                        <SelectItem
                          key="inactif"
                          value="inactif"
                          className="text-gray-900 dark:text-white"
                        >
                          Inactif
                        </SelectItem>
                        <SelectItem
                          key="suspendu"
                          value="suspendu"
                          className="text-gray-900 dark:text-white"
                        >
                          Suspendu
                        </SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-3 block text-base font-semibold text-gray-800 dark:text-gray-200">
                      Adresse
                    </label>
                    <Textarea
                      placeholder="Adresse complète du partenaire"
                      value={formData.adresse}
                      onChange={(e) =>
                        handleInputChange("adresse", e.target.value)
                      }
                      minRows={2}
                      maxRows={3}
                      size="lg"
                      className="text-base"
                      classNames={{
                        input:
                          "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                        inputWrapper:
                          "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 shadow-sm hover:shadow-md transition-all duration-200",
                      }}
                    />
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
                    {isSubmitting
                      ? "Création en cours..."
                      : "Créer le Partenaire"}
                  </Button>

                  <Link
                    href="/tableaudebord/partenaire/liste"
                    className="flex-1"
                  >
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
                  Partenaire Créé avec Succès
                </h3>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                Le partenaire{" "}
                <strong className="text-gray-900 dark:text-white">
                  {formData.nom}
                </strong>{" "}
                a été créé avec succès dans le système.
              </p>

              <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-700">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-600">
                    <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                      {formData.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {formData.nom}
                    </h4>
                    <div className="mt-2 flex gap-3">
                      <Chip
                        size="lg"
                        variant="flat"
                        color="secondary"
                        className="text-sm font-semibold"
                      >
                        {formData.secteur}
                      </Chip>
                      <Chip
                        size="lg"
                        variant="flat"
                        color="success"
                        className="text-sm font-semibold"
                      >
                        {formData.statut}
                      </Chip>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-base text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-2">
                    <span className="text-lg">📧</span> {formData.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg">👤</span> {formData.responsable}
                  </p>
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
              Voir la Liste des Partenaires
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AjouterPartenaire;
