"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import DataTable, { Column } from "@/components/UI/DataTable/DataTable";
import { useNotifications } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Select, SelectItem } from "@nextui-org/react";
import { useStore } from "@/store/useStore";
import { useDisclosure } from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import { Chip } from "@nextui-org/react";

interface Project {
  id: string;
  intitule: string;
  societe: string;
  chefDeProjet: string;
  domaine: string[];
  statut: "en_cours" | "termine" | "en_attente" | "suspendu";
  dateCreation: Date;
  dateModification: Date;
  visibilite: "public" | "prive";
  description?: string;
  progression?: number;
  budget?: number;
  partenaireId?: string; // Ajout de l'ID du partenaire
}

const GestionProjet = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { addNotification } = useNotifications();
  const router = useRouter();

  // États pour les modals
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  // Utilisation du store global
  const {
    partners,
    projects: storeProjects,
    setProjects: setStoreProjects,
    setPartners,
  } = useStore();

  // Charger les données mockées
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simuler chargement

      const mockProjects: Project[] = [
        {
          id: "1",
          intitule: "Migration Cloud AWS",
          societe: "TechCorp Solutions",
          chefDeProjet: "Marie Martin",
          domaine: ["itcloud", "security"],
          dateCreation: new Date("2024-01-15"),
          dateModification: new Date("2024-01-15"),
          statut: "en_cours",
          progression: 65,
          budget: 150000,
          visibilite: "public",
          partenaireId: "partner-1", // TechCorp Solutions
        },
        {
          id: "2",
          intitule: "Sécurisation Réseau",
          societe: "GlobalBank",
          chefDeProjet: "Pierre Durand",
          domaine: ["security"],
          dateCreation: new Date("2023-11-20"),
          dateModification: new Date("2023-11-20"),
          statut: "termine",
          progression: 100,
          budget: 75000,
          visibilite: "prive",
          partenaireId: "partner-2", // GlobalBank
        },
        {
          id: "3",
          intitule: "Infrastructure DataCenter",
          societe: "EcoLogistics",
          chefDeProjet: "Sophie Bernard",
          domaine: ["datacenter"],
          dateCreation: new Date("2024-02-10"),
          dateModification: new Date("2024-02-10"),
          statut: "en_attente",
          progression: 15,
          budget: 200000,
          visibilite: "prive",
          partenaireId: "partner-3", // EcoLogistics
        },
        {
          id: "4",
          intitule: "Audit Sécurité",
          societe: "MediHealth Plus",
          chefDeProjet: "Jean Dupont",
          domaine: ["consulting", "security"],
          dateCreation: new Date("2024-01-05"),
          dateModification: new Date("2024-01-05"),
          statut: "en_cours",
          progression: 40,
          budget: 80000,
          visibilite: "public",
          partenaireId: "partner-4", // MediHealth Plus
        },
        {
          id: "5",
          intitule: "Optimisation Cloud",
          societe: "TechCorp Solutions",
          chefDeProjet: "Luc Moreau",
          domaine: ["itcloud", "datacenter"],
          dateCreation: new Date("2024-03-01"),
          dateModification: new Date("2024-03-01"),
          statut: "en_cours",
          progression: 25,
          budget: 120000,
          visibilite: "public",
          partenaireId: "partner-1", // TechCorp Solutions
        },
        {
          id: "6",
          intitule: "Migration Infrastructure",
          societe: "GlobalBank",
          chefDeProjet: "Anne Dubois",
          domaine: ["datacenter", "security"],
          dateCreation: new Date("2024-02-15"),
          dateModification: new Date("2024-02-15"),
          statut: "en_attente",
          progression: 0,
          budget: 300000,
          visibilite: "prive",
          partenaireId: "partner-2", // GlobalBank
        },
      ];

      // Charger les partenaires mockés si ils ne sont pas déjà chargés
      if (partners.length === 0) {
        const mockPartners = [
          {
            id: "partner-1",
            nom: "TechCorp Solutions",
            logo: "/images/partners/techcorp.svg",
            secteur: "Technologie",
            description: "Spécialiste en solutions informatiques d'entreprise",
            email: "contact@techcorp.com",
            telephone: "+33 1 23 45 67 89",
            adresse: "123 Avenue des Champs-Élysées, Paris",
            responsable: "Jean Dupont",
            dateCreation: new Date("2023-01-15"),
            statut: "actif" as const,
            nombreProjets: 2,
            nombreIncidents: 3,
          },
          {
            id: "partner-2",
            nom: "GlobalBank",
            logo: "/images/partners/globalbank.svg",
            secteur: "Finance",
            description: "Institution bancaire internationale",
            email: "partenariat@globalbank.fr",
            telephone: "+33 1 98 76 54 32",
            adresse: "456 Rue de la Banque, La Défense",
            responsable: "Marie Martin",
            dateCreation: new Date("2022-11-20"),
            statut: "actif" as const,
            nombreProjets: 2,
            nombreIncidents: 1,
          },
          {
            id: "partner-3",
            nom: "EcoLogistics",
            logo: "/images/partners/ecologistics.svg",
            secteur: "Logistique",
            description: "Solutions logistiques durables",
            email: "info@ecologistics.com",
            telephone: "+33 2 11 22 33 44",
            adresse: "789 Boulevard Écologique, Lyon",
            responsable: "Pierre Durand",
            dateCreation: new Date("2023-03-10"),
            statut: "inactif" as const,
            nombreProjets: 1,
            nombreIncidents: 0,
          },
          {
            id: "partner-4",
            nom: "MediHealth Plus",
            logo: "/images/partners/medihealth.svg",
            secteur: "Santé",
            description: "Plateforme de santé numérique",
            email: "contact@medihealth.fr",
            telephone: "+33 3 55 66 77 88",
            adresse: "321 Rue de la Santé, Strasbourg",
            responsable: "Sophie Bernard",
            dateCreation: new Date("2023-06-05"),
            statut: "actif" as const,
            nombreProjets: 1,
            nombreIncidents: 2,
          },
        ];
        setPartners(mockPartners);
      }

      setProjects(mockProjects);
      setStoreProjects(mockProjects);
      setLoading(false);
    };

    loadProjects();
  }, [setStoreProjects, setPartners, partners.length]);

  // Filtrer les projets en fonction du partenaire sélectionné
  useEffect(() => {
    if (selectedPartner === "all") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(
        (project) => project.partenaireId === selectedPartner,
      );
      setFilteredProjects(filtered);
    }
  }, [selectedPartner, projects]);

  // Configuration des colonnes pour DataTable
  const columns: Column[] = [
    {
      key: "intitule",
      label: "Intitulé",
      sortable: true,
      filterable: true,
      render: (value, project) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-small text-default-400">{project.societe}</p>
        </div>
      ),
    },
    {
      key: "chefDeProjet",
      label: "Chef de Projet",
      sortable: true,
      filterable: true,
    },
    {
      key: "domaine",
      label: "Domaines",
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.map((domain: string, index: number) => (
            <span
              key={index}
              className="rounded-full bg-primary px-2 py-1 text-sm font-medium text-white"
            >
              {domain}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "statut",
      label: "Statut",
      type: "enum",
      enumOptions: [
        { value: "en_cours", label: "En cours", color: "primary" },
        { value: "termine", label: "Terminé", color: "success" },
        { value: "en_attente", label: "En attente", color: "warning" },
        { value: "suspendu", label: "Suspendu", color: "danger" },
      ],
    },
    {
      key: "progression",
      label: "Progression",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary-500"
              style={{ width: `${value || 0}%` }}
            />
          </div>
          <span className="text-small">{value || 0}%</span>
        </div>
      ),
    },
    {
      key: "budget",
      label: "Budget",
      type: "number",
      render: (value) => (value ? `${value.toLocaleString("fr-FR")} €` : "-"),
    },
    {
      key: "dateCreation",
      label: "Date de création",
      type: "date",
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, project) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            color="success"
            variant="flat"
            onPress={() => handleRowAction(project.id, "view")}
            className="min-w-0 px-2"
          >
            👁️
          </Button>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => handleRowAction(project.id, "edit")}
            className="min-w-0 px-2"
          >
            ✏️
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={() => handleRowAction(project.id, "delete")}
            className="min-w-0 px-2"
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  // Actions sur les lignes
  const handleRowAction = (projectId: string, action: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    switch (action) {
      case "view":
        setSelectedProject(project);
        onViewModalOpen();
        break;
      case "edit":
        setSelectedProject(project);
        onEditModalOpen();
        break;
      case "delete":
        setSelectedProject(project);
        onDeleteModalOpen();
        break;
    }
  };

  // Suppression d'un projet
  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le projet "${project.intitule}" ? Cette action est irréversible.`,
    );

    if (confirmed) {
      try {
        // Simulation de suppression
        await new Promise((resolve) => setTimeout(resolve, 500));

        const updatedProjects = projects.filter((p) => p.id !== projectId);
        setProjects(updatedProjects);
        setStoreProjects(updatedProjects);

        addNotification({
          title: "Projet supprimé",
          body: `Le projet "${project.intitule}" a été supprimé avec succès`,
          type: "success",
          priority: "medium",
          category: "project",
          read: false,
        });
      } catch (error) {
        addNotification({
          title: "Erreur de suppression",
          body: "Une erreur est survenue lors de la suppression du projet",
          type: "error",
          priority: "high",
          category: "system",
          read: false,
        });
      }
    }
  };

  // Actions disponibles
  const actions = [
    {
      key: "view",
      label: "Voir",
      color: "success" as const,
      icon: "👁️",
    },
    {
      key: "edit",
      label: "Modifier",
      color: "primary" as const,
      icon: "✏️",
    },
    {
      key: "delete",
      label: "Supprimer",
      color: "danger" as const,
      icon: "🗑️",
    },
  ];

  // Obtenir le nom du partenaire sélectionné
  const getSelectedPartnerName = () => {
    if (selectedPartner === "all") return "Tous les partenaires";
    const partner = partners.find((p) => p.id === selectedPartner);
    return partner ? partner.nom : "Partenaire inconnu";
  };

  return (
    <>
      <Breadcrumb pageName="Gestion de projet" />
      <div className="mt-5 w-full max-w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">
              Gestion des Projets
            </h1>
            <p className="mt-1 text-default-400">
              Gérez tous vos projets DATALYS Consulting
            </p>
          </div>
          <Link href="/tableaudebord/projet/ajouter">
            <Button
              color="primary"
              className="bg-primary bg-gradient-to-r px-6 py-3 text-base font-semibold shadow-lg hover:from-primary-100 hover:to-primary-800"
              startContent={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              }
            >
              Nouveau Projet
            </Button>
          </Link>
        </div>

        {/* Filtre par partenaire */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrer par partenaire
              </label>
              <Select
                selectedKeys={selectedPartner ? [selectedPartner] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedPartner(selected);
                }}
                placeholder="Sélectionner un partenaire"
                className="w-full sm:w-80"
              >
                <SelectItem key="all" value="all">
                  Tous les partenaires
                </SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.nom} ({partner.statut})
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Partenaire sélectionné :</span>{" "}
                {getSelectedPartnerName()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Projets affichés :</span>{" "}
                {filteredProjects.length} sur {projects.length}
              </div>
            </div>
          </div>
        </div>

        <DataTable
          data={filteredProjects}
          columns={columns}
          loading={loading}
          actions={actions}
          onRowAction={handleRowAction}
          title={`Projets - ${getSelectedPartnerName()}`}
          subtitle={`${filteredProjects.length} projet${filteredProjects.length > 1 ? "s" : ""} affiché${filteredProjects.length > 1 ? "s" : ""} sur ${projects.length} au total`}
          searchPlaceholder="Rechercher un projet..."
          pageSize={10}
          className="w-full"
        />

        {/* Modal de visualisation du projet */}
        <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Détails du Projet
                </ModalHeader>
                <ModalBody>
                  {selectedProject && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Intitulé
                          </label>
                          <p className="text-lg font-semibold">
                            {selectedProject.intitule}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Société
                          </label>
                          <p className="text-lg">{selectedProject.societe}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Chef de Projet
                          </label>
                          <p className="text-lg">
                            {selectedProject.chefDeProjet}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Statut
                          </label>
                          <Chip
                            color={
                              selectedProject.statut === "en_cours"
                                ? "primary"
                                : selectedProject.statut === "termine"
                                  ? "success"
                                  : selectedProject.statut === "en_attente"
                                    ? "warning"
                                    : "danger"
                            }
                            variant="flat"
                          >
                            {selectedProject.statut}
                          </Chip>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Progression
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-primary-500"
                                style={{
                                  width: `${selectedProject.progression || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              {selectedProject.progression || 0}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Budget
                          </label>
                          <p className="text-lg">
                            {selectedProject.budget
                              ? `${selectedProject.budget.toLocaleString("fr-FR")} €`
                              : "-"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Domaines
                        </label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedProject.domaine.map((domain, index) => (
                            <Chip
                              key={index}
                              color="primary"
                              variant="flat"
                              size="sm"
                            >
                              {domain}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Date de création
                        </label>
                        <p className="text-lg">
                          {selectedProject.dateCreation.toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Fermer
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal de modification du projet */}
        <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Modifier le Projet
                </ModalHeader>
                <ModalBody>
                  <p className="py-8 text-center text-gray-500">
                    Fonctionnalité de modification en cours de développement...
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Fermer
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal de suppression du projet */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          size="md"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Confirmer la suppression
                </ModalHeader>
                <ModalBody>
                  {selectedProject && (
                    <p>
                      Êtes-vous sûr de vouloir supprimer le projet{" "}
                      <strong>"{selectedProject.intitule}"</strong> ? Cette
                      action est irréversible.
                    </p>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Annuler
                  </Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      if (selectedProject) {
                        handleDeleteProject(selectedProject.id);
                        onClose();
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </>
  );
};

export default GestionProjet;
