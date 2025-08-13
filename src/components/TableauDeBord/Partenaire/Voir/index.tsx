"use client";

import React, { useState, useEffect } from "react";
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
  useDisclosure,
  Tabs,
  Tab,
  Badge,
} from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import LoadingState from "@/components/UI/Loading/LoadingState";

// Types
interface Partner {
  id: string;
  nom: string;
  logo: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  adresse: string;
  responsable: string;
  dateCreation: Date;
  statut: "actif" | "inactif" | "suspendu";
}

interface Project {
  id: string;
  nom: string;
  description: string;
  statut: "en_cours" | "termine" | "en_attente" | "annule";
  dateDebut: Date;
  dateFin?: Date;
  progression: number;
  budget: number;
  responsable: string;
  nombreFichiers: number;
}

interface Incident {
  id: string;
  titre: string;
  description: string;
  priorite: "faible" | "moyenne" | "haute" | "critique";
  statut: "ouvert" | "en_cours" | "resolu" | "ferme";
  projectId: string;
  projectNom: string;
  dateCreation: Date;
  dateResolution?: Date;
  assigneA: string;
}

interface VoirPartenaireProps {
  partnerId: string;
}

// Données mockées
const MOCK_PARTNER: Partner = {
  id: "partner-1",
  nom: "TechCorp Solutions",
  logo: "/images/partners/techcorp.png",
  secteur: "Technologie",
  description: "Spécialiste en solutions informatiques d'entreprise avec plus de 15 ans d'expérience dans le domaine. Nous accompagnons les entreprises dans leur transformation digitale.",
  email: "contact@techcorp.com",
  telephone: "+33 1 23 45 67 89",
  adresse: "123 Avenue des Champs-Élysées, 75008 Paris",
  responsable: "Jean Dupont",
  dateCreation: new Date("2023-01-15"),
  statut: "actif",
};

const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    nom: "Migration Cloud AWS",
    description: "Migration de l'infrastructure vers AWS avec optimisation des coûts",
    statut: "en_cours",
    dateDebut: new Date("2024-01-15"),
    dateFin: new Date("2024-06-30"),
    progression: 65,
    budget: 150000,
    responsable: "Marie Martin",
    nombreFichiers: 45,
  },
  {
    id: "proj-2",
    nom: "Sécurisation Réseau",
    description: "Mise en place d'une architecture de sécurité avancée",
    statut: "termine",
    dateDebut: new Date("2023-11-01"),
    dateFin: new Date("2024-01-31"),
    progression: 100,
    budget: 75000,
    responsable: "Pierre Durand",
    nombreFichiers: 32,
  },
  {
    id: "proj-3",
    nom: "Application Mobile",
    description: "Développement d'une application mobile pour la gestion des commandes",
    statut: "en_attente",
    dateDebut: new Date("2024-03-01"),
    progression: 15,
    budget: 200000,
    responsable: "Sophie Bernard",
    nombreFichiers: 18,
  },
];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-1",
    titre: "Problème de connectivité VPN",
    description: "Les utilisateurs n'arrivent pas à se connecter au VPN depuis ce matin",
    priorite: "haute",
    statut: "en_cours",
    projectId: "proj-1",
    projectNom: "Migration Cloud AWS",
    dateCreation: new Date("2024-01-20"),
    assigneA: "Support Technique",
  },
  {
    id: "inc-2",
    titre: "Lenteur application web",
    description: "L'application web présente des lenteurs importantes",
    priorite: "moyenne",
    statut: "ouvert",
    projectId: "proj-3",
    projectNom: "Application Mobile",
    dateCreation: new Date("2024-01-18"),
    assigneA: "Équipe DevOps",
  },
  {
    id: "inc-3",
    titre: "Erreur de synchronisation",
    description: "Problème de synchronisation des données entre les serveurs",
    priorite: "critique",
    statut: "resolu",
    projectId: "proj-1",
    projectNom: "Migration Cloud AWS",
    dateCreation: new Date("2024-01-15"),
    dateResolution: new Date("2024-01-16"),
    assigneA: "Admin Système",
  },
];

const VoirPartenaire: React.FC<VoirPartenaireProps> = ({ partnerId }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projets");
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [newIncident, setNewIncident] = useState({
    titre: "",
    description: "",
    priorite: "moyenne" as const,
  });

  // Simulation du chargement des données
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPartner(MOCK_PARTNER);
      setProjects(MOCK_PROJECTS);
      setIncidents(MOCK_INCIDENTS);
      setLoading(false);
    };

    loadData();
  }, [partnerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours": return "primary";
      case "termine": return "success";
      case "en_attente": return "warning";
      case "annule": return "danger";
      case "ouvert": return "danger";
      case "resolu": return "success";
      case "ferme": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critique": return "danger";
      case "haute": return "warning";
      case "moyenne": return "primary";
      case "faible": return "success";
      default: return "default";
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncident.titre || !newIncident.description || !selectedProject) return;
    
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    const incident: Incident = {
      id: `inc-${Date.now()}`,
      titre: newIncident.titre,
      description: newIncident.description,
      priorite: newIncident.priorite,
      statut: "ouvert",
      projectId: selectedProject,
      projectNom: project.nom,
      dateCreation: new Date(),
      assigneA: "Support Technique",
    };

    setIncidents(prev => [incident, ...prev]);
    setNewIncident({ titre: "", description: "", priorite: "moyenne" });
    setSelectedProject("");
    setShowCreateIncident(false);
    
    console.log("Nouvel incident créé:", incident);
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Détails Partenaire" />
        <LoadingState type="skeleton" skeletonVariant="profile" />
      </>
    );
  }

  if (!partner) {
    return (
      <>
        <Breadcrumb pageName="Partenaire introuvable" />
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600">Partenaire introuvable</h3>
          <Link href="/tableaudebord/partenaire/liste">
            <Button color="primary" className="mt-4">
              Retour à la liste
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`Partenaire: ${partner.nom}`} />
      
      <div className="mx-auto max-w-7xl space-y-6">
        {/* En-tête du partenaire */}
        <motion.div
          className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Logo et infos principales */}
            <div className="flex flex-col sm:flex-row gap-6 lg:flex-1">
              <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {partner.logo ? (
                  <Image
                    src={partner.logo}
                    alt={partner.nom}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-3xl font-bold text-gray-400">
                    {partner.nom.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-dark dark:text-white mb-2">
                      {partner.nom}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Chip size="sm" variant="flat" color="secondary">
                        {partner.secteur}
                      </Chip>
                      <Chip size="sm" variant="flat" color="success">
                        {partner.statut}
                      </Chip>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {partner.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                    <p className="text-gray-600 dark:text-gray-400">{partner.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Téléphone:</span>
                    <p className="text-gray-600 dark:text-gray-400">{partner.telephone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Responsable:</span>
                    <p className="text-gray-600 dark:text-gray-400">{partner.responsable}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Partenaire depuis:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {partner.dateCreation.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="lg:w-80">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{projects.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Projets</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {incidents.filter(i => i.statut !== "resolu" && i.statut !== "ferme").length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Incidents</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {projects.reduce((sum, p) => sum + p.nombreFichiers, 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Fichiers</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal avec onglets */}
        <motion.div
          className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tab
              key="projets"
              title={
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.25 6a.75.75 0 0 0-.75.75v7.5a.75.75 0 0 0 1.5 0v-7.5A.75.75 0 0 0 7.25 6M12 6a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 6m4 .75a.75.75 0 0 1 1.5 0v9.5a.75.75 0 0 1-1.5 0z"/>
                    <path d="M3.75 2h16.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25V3.75C2 2.784 2.784 2 3.75 2M3.5 3.75v16.5c0 .138.112.25.25.25h16.5a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25H3.75a.25.25 0 0 0-.25.25"/>
                  </svg>
                  Projets ({projects.length})
                </div>
              }
            >
              <div className="p-6">
                {/* En-tête des projets */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Projets du Partenaire
                  </h3>
                  <Button
                    color="primary"
                    size="sm"
                    startContent={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    }
                  >
                    Nouveau Projet
                  </Button>
                </div>

                {/* Liste des projets */}
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-dark dark:text-white">
                                {project.nom}
                              </h4>
                              <Chip size="sm" variant="flat" color={getStatusColor(project.statut)}>
                                {project.statut.replace("_", " ")}
                              </Chip>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {project.description}
                            </p>
                            
                            {/* Barre de progression */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progression</span>
                                <span>{project.progression}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-primary-500 h-2 rounded-full transition-all"
                                  style={{ width: `${project.progression}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-6">
                            <div className="text-lg font-semibold text-green-600">
                              {project.budget.toLocaleString('fr-FR')} €
                            </div>
                            <div className="text-sm text-gray-500">Budget</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>👤 {project.responsable}</span>
                            <span>📁 {project.nombreFichiers} fichiers</span>
                            <span>📅 {project.dateDebut.toLocaleDateString('fr-FR')}</span>
                          </div>
                          
                          <Link href={`/tableaudebord/projet/pageprojet/${project.id}`}>
                            <Button size="sm" variant="flat" color="primary">
                              Voir Projet
                            </Button>
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            </Tab>

            <Tab
              key="incidents"
              title={
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                  Incidents ({incidents.filter(i => i.statut !== "resolu" && i.statut !== "ferme").length})
                </div>
              }
            >
              <div className="p-6">
                {/* En-tête des incidents */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Gestion des Incidents
                  </h3>
                  <Button
                    color="warning"
                    size="sm"
                    onClick={() => setShowCreateIncident(true)}
                    startContent={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                      </svg>
                    }
                  >
                    Créer Incident
                  </Button>
                </div>

                {/* Liste des incidents */}
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <Card key={incident.id} className="hover:shadow-md transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-dark dark:text-white">
                                {incident.titre}
                              </h4>
                              <Chip size="sm" variant="flat" color={getPriorityColor(incident.priorite)}>
                                {incident.priorite}
                              </Chip>
                              <Chip size="sm" variant="flat" color={getStatusColor(incident.statut)}>
                                {incident.statut.replace("_", " ")}
                              </Chip>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {incident.description}
                            </p>
                            
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>📋 {incident.projectNom}</span>
                              <span>👤 {incident.assigneA}</span>
                              <span>📅 {incident.dateCreation.toLocaleDateString('fr-FR')}</span>
                              {incident.dateResolution && (
                                <span>✅ Résolu le {incident.dateResolution.toLocaleDateString('fr-FR')}</span>
                              )}
                            </div>
                          </div>
                          
                          <Button size="sm" variant="flat" color="primary">
                            Détails
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            </Tab>
          </Tabs>
        </motion.div>
      </div>

      {/* Modal de création d'incident */}
      <Modal isOpen={showCreateIncident} onClose={() => setShowCreateIncident(false)} size="lg">
        <ModalContent>
          <ModalHeader>Créer un Nouvel Incident</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Projet concerné</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nom}
                    </option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Titre de l'incident"
                placeholder="Résumé du problème"
                value={newIncident.titre}
                onChange={(e) => setNewIncident(prev => ({ ...prev, titre: e.target.value }))}
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700"
                  rows={4}
                  placeholder="Description détaillée du problème"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <select
                  value={newIncident.priorite}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, priorite: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="faible">Faible</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowCreateIncident(false)}>
              Annuler
            </Button>
            <Button color="warning" onPress={handleCreateIncident}>
              Créer l'Incident
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VoirPartenaire;