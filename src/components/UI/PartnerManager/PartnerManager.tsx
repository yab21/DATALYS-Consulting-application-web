"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Checkbox,
  Divider,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useNotifications } from "@/context/NotificationContext";

// Types
interface Partner {
  id: string;
  nom: string;
  logo: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  responsable: string;
  statut: "actif" | "inactif" | "suspendu";
}

interface ProjectPartner extends Partner {
  roleInProject: string;
  dateAjout: Date;
  contributions: string[];
}

interface PartnerManagerProps {
  projectId: string;
  projectName: string;
  projectPartners: ProjectPartner[];
  onPartnersUpdate: (partners: ProjectPartner[]) => void;
  showAddButton?: boolean;
  className?: string;
}

// Données mockées des partenaires disponibles
const AVAILABLE_PARTNERS: Partner[] = [
  {
    id: "partner-1",
    nom: "TechCorp Solutions",
    logo: "/images/partners/techcorp.svg",
    secteur: "Technologie",
    description: "Spécialiste en solutions informatiques d'entreprise",
    email: "contact@techcorp.com",
    telephone: "+33 1 23 45 67 89",
    responsable: "Jean Dupont",
    statut: "actif",
  },
  {
    id: "partner-2",
    nom: "GlobalBank",
    logo: "/images/partners/globalbank.svg",
    secteur: "Finance",
    description: "Institution bancaire internationale",
    email: "partenariat@globalbank.fr",
    telephone: "+33 1 98 76 54 32",
    responsable: "Marie Martin",
    statut: "actif",
  },
  {
    id: "partner-3",
    nom: "EcoLogistics",
    logo: "/images/partners/ecologistics.svg",
    secteur: "Logistique",
    description: "Solutions logistiques durables",
    email: "info@ecologistics.com",
    telephone: "+33 2 11 22 33 44",
    responsable: "Pierre Durand",
    statut: "actif",
  },
  {
    id: "partner-4",
    nom: "MediHealth Plus",
    logo: "/images/partners/medihealth.svg",
    secteur: "Santé",
    description: "Plateforme de santé numérique",
    email: "contact@medihealth.fr",
    telephone: "+33 3 55 66 77 88",
    responsable: "Sophie Bernard",
    statut: "actif",
  },
  {
    id: "partner-5",
    nom: "DataFlow Systems",
    logo: "/images/partners/dataflow.svg",
    secteur: "Analytics",
    description: "Solutions d'analyse de données en temps réel",
    email: "hello@dataflow.io",
    telephone: "+33 4 77 88 99 00",
    responsable: "Alexandre Petit",
    statut: "actif",
  },
];

const PARTNER_ROLES = [
  { value: "lead", label: "Partenaire Principal" },
  { value: "technical", label: "Support Technique" },
  { value: "consulting", label: "Conseil" },
  { value: "supplier", label: "Fournisseur" },
  { value: "client", label: "Client" },
  { value: "collaborator", label: "Collaborateur" },
];

const PartnerManager: React.FC<PartnerManagerProps> = ({
  projectName,
  projectPartners,
  onPartnersUpdate,
  showAddButton = true,
  className = "",
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [newPartnerRole, setNewPartnerRole] = useState("collaborator");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Filtrer les partenaires disponibles (exclure ceux déjà dans le projet)
  const availablePartners = AVAILABLE_PARTNERS.filter(
    (partner) =>
      !projectPartners.some((pp) => pp.id === partner.id) &&
      partner.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPartners = async () => {
    if (selectedPartners.length === 0) {
      addNotification({
        title: "Sélection requise",
        body: "Veuillez sélectionner au moins un partenaire",
        type: "warning",
        priority: "medium",
        category: "project",
        read: false,
      });
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      const newProjectPartners = selectedPartners.map((partnerId) => {
        const partner = AVAILABLE_PARTNERS.find((p) => p.id === partnerId);
        if (!partner) throw new Error("Partenaire introuvable");

        return {
          ...partner,
          roleInProject: newPartnerRole,
          dateAjout: new Date(),
          contributions: [],
        };
      });

      const updatedPartners = [...projectPartners, ...newProjectPartners];
      onPartnersUpdate(updatedPartners);

      addNotification({
        title: "Partenaires ajoutés",
        body: `${selectedPartners.length} partenaire(s) ajouté(s) au projet "${projectName}"`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setSelectedPartners([]);
      setNewPartnerRole("collaborator");
      setShowAddModal(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout des partenaires:", error);
      addNotification({
        title: "Erreur",
        body: "Une erreur est survenue lors de l'ajout des partenaires",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    const partner = projectPartners.find((p) => p.id === partnerId);
    if (!partner) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir retirer "${partner.nom}" du projet ?`
    );

    if (confirmed) {
      const updatedPartners = projectPartners.filter((p) => p.id !== partnerId);
      onPartnersUpdate(updatedPartners);

      addNotification({
        title: "Partenaire retiré",
        body: `${partner.nom} a été retiré du projet`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "lead": return "primary";
      case "technical": return "secondary";
      case "consulting": return "warning";
      case "supplier": return "success";
      case "client": return "danger";
      default: return "default";
    }
  };

  const getRoleLabel = (role: string) => {
    const roleObj = PARTNER_ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark dark:text-white">
            Partenaires du Projet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {projectPartners.length} partenaire(s) associé(s)
          </p>
        </div>
        
        {showAddButton && (
          <Button
            color="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            startContent={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            }
          >
            Ajouter Partenaire
          </Button>
        )}
      </div>

      {/* Liste des partenaires du projet */}
      <div className="space-y-4">
        {projectPartners.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardBody className="p-8 text-center">
              <div className="mb-4 text-gray-400">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mx-auto"
                >
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zM16 13v5h4v-5h-4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM8.5 11.5c.83 0 1.5-.67 1.5-1.5S9.33 8.5 8.5 8.5 7 9.17 7 10s.67 1.5 1.5 1.5z" />
                </svg>
              </div>
              <h4 className="mb-2 text-lg font-medium text-gray-600 dark:text-gray-300">
                Aucun partenaire associé
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Ajoutez des partenaires pour collaborer sur ce projet
              </p>
            </CardBody>
          </Card>
        ) : (
          projectPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {partner.logo ? (
                          <Image
                            src={partner.logo}
                            alt={partner.nom}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-lg font-bold text-gray-400">
                            {partner.nom.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Informations */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-dark dark:text-white">
                            {partner.nom}
                          </h4>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={getRoleColor(partner.roleInProject)}
                          >
                            {getRoleLabel(partner.roleInProject)}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{partner.secteur}</span>
                          <span>👤 {partner.responsable}</span>
                          <span>
                            📅 Ajouté le {partner.dateAjout.toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onClick={() => {
                          // TODO: Voir détails du partenaire
                          console.log("Voir partenaire:", partner.id);
                        }}
                      >
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onClick={() => handleRemovePartner(partner.id)}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal d'ajout de partenaires */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h3 className="text-xl font-semibold">Ajouter des Partenaires</h3>
              <p className="text-sm text-gray-500">
                Projet: {projectName}
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Recherche */}
              <Input
                placeholder="Rechercher un partenaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                }
              />

              {/* Rôle pour les nouveaux partenaires */}
              <Select
                label="Rôle dans le projet"
                placeholder="Sélectionner un rôle"
                selectedKeys={[newPartnerRole]}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  if (key) setNewPartnerRole(key);
                }}
              >
                {PARTNER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </Select>

              <Divider />

              {/* Liste des partenaires disponibles */}
              <div>
                <h4 className="mb-4 font-medium">
                  Partenaires disponibles ({availablePartners.length})
                </h4>
                
                {availablePartners.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardBody className="p-6 text-center">
                      <p className="text-gray-500">
                        {searchTerm 
                          ? "Aucun partenaire trouvé pour cette recherche"
                          : "Tous les partenaires sont déjà associés au projet"
                        }
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {availablePartners.map((partner) => (
                      <Card
                        key={partner.id}
                        className={`cursor-pointer transition-all ${
                          selectedPartners.includes(partner.id)
                            ? "border-2 border-primary bg-primary-50 dark:bg-primary-900/20"
                            : "border border-gray-200"
                        }`}
                        onClick={() => {
                          setSelectedPartners(prev =>
                            prev.includes(partner.id)
                              ? prev.filter(id => id !== partner.id)
                              : [...prev, partner.id]
                          );
                        }}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              isSelected={selectedPartners.includes(partner.id)}
                              onChange={() => {}} // Géré par le clic sur la carte
                            />
                            
                            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                              {partner.logo ? (
                                <Image
                                  src={partner.logo}
                                  alt={partner.nom}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="text-sm font-bold text-gray-400">
                                  {partner.nom.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h5 className="font-medium">{partner.nom}</h5>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{partner.secteur}</span>
                                <span>•</span>
                                <span>{partner.responsable}</span>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowAddModal(false)}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleAddPartners}
              isLoading={loading}
              isDisabled={selectedPartners.length === 0 || loading}
            >
              Ajouter {selectedPartners.length > 0 && `(${selectedPartners.length})`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PartnerManager;