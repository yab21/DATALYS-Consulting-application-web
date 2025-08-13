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
  "Autre"
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Supprimer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      <div className="mx-auto max-w-4xl space-y-6">
        {/* En-tête */}
        <motion.div
          className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark dark:text-white">
                Nouveau Partenaire
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Remplissez les informations ci-dessous pour ajouter un nouveau partenaire
              </p>
            </div>
            
            <Link href="/tableaudebord/partenaire/liste">
              <Button variant="flat" color="default">
                Retour à la liste
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardBody className="p-8">
              <div className="space-y-6">
                {/* Informations de base */}
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">
                    Informations de Base
                  </h3>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Nom du partenaire"
                      placeholder="Ex: TechCorp Solutions"
                      value={formData.nom}
                      onChange={(e) => handleInputChange("nom", e.target.value)}
                      isInvalid={!!errors.nom}
                      errorMessage={errors.nom}
                      isRequired
                    />
                    
                    <Select
                      label="Secteur d'activité"
                      placeholder="Sélectionner un secteur"
                      selectedKeys={formData.secteur ? [formData.secteur] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange("secteur", value || "");
                      }}
                      isInvalid={!!errors.secteur}
                      errorMessage={errors.secteur}
                      isRequired
                    >
                      {SECTEURS.map((secteur) => (
                        <SelectItem key={secteur} value={secteur}>
                          {secteur}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="mt-4">
                    <Textarea
                      label="Description"
                      placeholder="Description de l'activité du partenaire et de ses services"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      minRows={3}
                      maxRows={5}
                      isInvalid={!!errors.description}
                      errorMessage={errors.description}
                      isRequired
                    />
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">
                    Logo du Partenaire
                  </h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      {formData.logo ? (
                        <div className="text-xs text-center p-2">
                          <div className="text-green-600 mb-1">✓</div>
                          <div>Logo ajouté</div>
                        </div>
                      ) : (
                        <div className="text-xs text-center text-gray-400">
                          <div className="mb-1">📷</div>
                          <div>Logo</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-primary-50 file:text-primary-700
                          hover:file:bg-primary-100
                          dark:file:bg-primary-900/20 dark:file:text-primary-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF jusqu'à 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">
                    Informations de Contact
                  </h3>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="contact@partenaire.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      isInvalid={!!errors.email}
                      errorMessage={errors.email}
                      isRequired
                    />
                    
                    <Input
                      label="Téléphone"
                      placeholder="+33 1 23 45 67 89"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange("telephone", e.target.value)}
                      isInvalid={!!errors.telephone}
                      errorMessage={errors.telephone}
                      isRequired
                    />
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2 mt-4">
                    <Input
                      label="Responsable"
                      placeholder="Nom du responsable"
                      value={formData.responsable}
                      onChange={(e) => handleInputChange("responsable", e.target.value)}
                      isInvalid={!!errors.responsable}
                      errorMessage={errors.responsable}
                      isRequired
                    />
                    
                    <Select
                      label="Statut"
                      selectedKeys={[formData.statut]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as "actif" | "inactif" | "suspendu";
                        handleInputChange("statut", value);
                      }}
                    >
                      <SelectItem key="actif" value="actif">Actif</SelectItem>
                      <SelectItem key="inactif" value="inactif">Inactif</SelectItem>
                      <SelectItem key="suspendu" value="suspendu">Suspendu</SelectItem>
                    </Select>
                  </div>
                  
                  <div className="mt-4">
                    <Textarea
                      label="Adresse"
                      placeholder="Adresse complète du partenaire"
                      value={formData.adresse}
                      onChange={(e) => handleInputChange("adresse", e.target.value)}
                      minRows={2}
                      maxRows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    color="primary"
                    size="lg"
                    className="flex-1 font-medium"
                    onPress={handleSubmit}
                    isLoading={isSubmitting}
                    loadingText="Création en cours..."
                    startContent={
                      !isSubmitting && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                      )
                    }
                  >
                    Créer le Partenaire
                  </Button>
                  
                  <Link href="/tableaudebord/partenaire/liste" className="flex-1">
                    <Button
                      variant="flat"
                      size="lg"
                      className="w-full"
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
      <Modal isOpen={isOpen} onClose={onClose} size="md" isDismissable={false}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Partenaire Créé avec Succès</h3>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Le partenaire <strong>{formData.nom}</strong> a été créé avec succès dans le système.
              </p>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-500">
                      {formData.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{formData.nom}</h4>
                    <div className="flex gap-2">
                      <Chip size="sm" variant="flat" color="secondary">
                        {formData.secteur}
                      </Chip>
                      <Chip size="sm" variant="flat" color="success">
                        {formData.statut}
                      </Chip>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>📧 {formData.email}</p>
                  <p>👤 {formData.responsable}</p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={handleReturnToList}
              startContent={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
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