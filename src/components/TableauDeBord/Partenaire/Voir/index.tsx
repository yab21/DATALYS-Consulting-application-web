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
  Tabs,
  Tab,
  Select,
  SelectItem,
  Textarea,
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
  logo: "/images/partners/techcorp.svg",
  secteur: "Technologie",
  description:
    "Spécialiste en solutions informatiques d'entreprise avec plus de 15 ans d'expérience dans le domaine. Nous accompagnons les entreprises dans leur transformation digitale.",
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
    description:
      "Migration de l'infrastructure vers AWS avec optimisation des coûts",
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
    description:
      "Développement d'une application mobile pour la gestion des commandes",
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
    description:
      "Les utilisateurs n'arrivent pas à se connecter au VPN depuis ce matin",
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
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPartner(MOCK_PARTNER);
      setProjects(MOCK_PROJECTS);
      setIncidents(MOCK_INCIDENTS);
      setLoading(false);
    };

    loadData();
  }, [partnerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours":
        return "primary";
      case "termine":
        return "success";
      case "en_attente":
        return "warning";
      case "annule":
        return "danger";
      case "ouvert":
        return "danger";
      case "resolu":
        return "success";
      case "ferme":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critique":
        return "danger";
      case "haute":
        return "warning";
      case "moyenne":
        return "primary";
      case "faible":
        return "success";
      default:
        return "default";
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncident.titre || !newIncident.description || !selectedProject)
      return;

    const project = projects.find((p) => p.id === selectedProject);
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

    setIncidents((prev) => [incident, ...prev]);
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
        <div className="py-12 text-center">
          <h3 className="text-lg font-semibold text-gray-600">
            Partenaire introuvable
          </h3>
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
        {/* En-tête amélioré du partenaire avec couleurs DATALYS */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 p-1 shadow-2xl shadow-cyan-500/20 dark:from-cyan-900/30 dark:via-teal-900/30 dark:to-cyan-900/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="rounded-3xl bg-white/95 p-10 backdrop-blur-sm dark:bg-gray-900/95">
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Logo et infos principales */}
              <div className="flex flex-col gap-8 sm:flex-row lg:flex-1">
                <div className="relative group">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-500 to-teal-600 opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-100 to-teal-100 shadow-xl dark:from-cyan-900/50 dark:to-teal-900/50">
                    {partner.logo ? (
                      <Image
                        src={partner.logo}
                        alt={partner.nom}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-4xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                        {partner.nom.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 to-cyan-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-cyan-400">
                        {partner.nom}
                      </h1>
                      <div className="h-6 w-1 bg-gradient-to-b from-cyan-500 to-teal-600 rounded-full"></div>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3">
                      <Chip 
                        size="lg" 
                        variant="solid" 
                        className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold shadow-lg shadow-cyan-500/25"
                      >
                        📊 {partner.secteur}
                      </Chip>
                      <Chip 
                        size="lg" 
                        variant="solid" 
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-lg shadow-emerald-500/25"
                      >
                        ✅ {partner.statut}
                      </Chip>
                      <Chip 
                        size="lg" 
                        variant="flat" 
                        className="bg-cyan-50 text-cyan-700 font-semibold dark:bg-cyan-900/30 dark:text-cyan-300"
                      >
                        🤝 Partenaire depuis {new Date().getFullYear() - partner.dateCreation.getFullYear()} ans
                      </Chip>
                    </div>
                  </div>

                  <p className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 to-cyan-50 dark:from-gray-800/50 dark:to-cyan-900/20 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                    {partner.description}
                  </p>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200/50 dark:border-cyan-700/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#06B6D4] shadow-lg shadow-cyan-500/25">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{partner.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-teal-200/50 dark:border-teal-700/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 shadow-lg shadow-teal-500/25">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Téléphone</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{partner.telephone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Responsable</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{partner.responsable}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500 shadow-lg shadow-slate-500/25">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Partenaire depuis</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{partner.dateCreation.toLocaleDateString("fr-FR")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques améliorées avec couleurs DATALYS */}
              <div className="lg:w-96">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">📊 Statistiques</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#06B6D4] to-cyan-600 rounded-2xl blur-sm opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-cyan-200/50 dark:border-cyan-700/50 text-center">
                      <div className="text-4xl font-black text-[#06B6D4] dark:text-cyan-400 mb-2">{projects.length}</div>
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Projets Actifs</div>
                      <div className="mt-2 h-1 bg-cyan-100 dark:bg-cyan-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#06B6D4] to-cyan-600 rounded-full transform transition-all duration-1000 ease-out" style={{width: "85%"}}></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-sm opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-orange-200/50 dark:border-orange-700/50 text-center">
                      <div className="text-4xl font-black text-orange-600 dark:text-orange-400 mb-2">
                        {incidents.filter((i) => i.statut !== "resolu" && i.statut !== "ferme").length}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Incidents Ouverts</div>
                      <div className="mt-2 h-1 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transform transition-all duration-1000 ease-out" style={{width: "65%"}}></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur-sm opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-teal-200/50 dark:border-teal-700/50 text-center">
                      <div className="text-4xl font-black text-teal-600 dark:text-teal-400 mb-2">
                        {projects.reduce((sum, p) => sum + p.nombreFichiers, 0)}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">Fichiers Gérés</div>
                      <div className="mt-2 h-1 bg-teal-100 dark:bg-teal-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transform transition-all duration-1000 ease-out" style={{width: "92%"}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal avec onglets améliorés */}
        <motion.div
          className="rounded-3xl border-0 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 shadow-2xl shadow-cyan-500/5 dark:border dark:border-gray-700/50 dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800/80 dark:shadow-gray-900/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
            size="lg"
            classNames={{
              tabList: "bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50 dark:from-gray-700 dark:via-gray-700/90 dark:to-gray-700 p-3 rounded-t-3xl border-b border-cyan-200/50 dark:border-gray-600/50",
              tab: "data-[selected=true]:bg-white data-[selected=true]:shadow-xl data-[selected=true]:shadow-cyan-500/10 dark:data-[selected=true]:bg-gray-600 dark:data-[selected=true]:shadow-gray-900/20 rounded-2xl transition-all duration-300 data-[selected=true]:scale-105",
              tabContent:
                "text-gray-600 dark:text-gray-300 data-[selected=true]:text-[#06B6D4] dark:data-[selected=true]:text-cyan-400 font-bold text-base data-[selected=true]:drop-shadow-sm",
            }}
          >
            <Tab
              key="projets"
              title={
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.25 6a.75.75 0 0 0-.75.75v7.5a.75.75 0 0 0 1.5 0v-7.5A.75.75 0 0 0 7.25 6M12 6a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 6m4 .75a.75.75 0 0 1 1.5 0v9.5a.75.75 0 0 1-1.5 0z" />
                    <path d="M3.75 2h16.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25V3.75C2 2.784 2.784 2 3.75 2M3.5 3.75v16.5c0 .138.112.25.25.25h16.5a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25H3.75a.25.25 0 0 0-.25.25" />
                  </svg>
                  Projets ({projects.length})
                </div>
              }
            >
              <div className="min-h-[500px] bg-gray-50 p-6 dark:bg-gray-800">
                {/* En-tête des projets */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Projets du Partenaire
                  </h3>
                  <Link href="/tableaudebord/projet/ajouter">
                    <Button
                      color="primary"
                      size="md"
                      variant="shadow"
                      className="font-semibold"
                      startContent={
                        <svg
                          width="16"
                          height="16"
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

                {/* Liste des projets */}
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className="border border-gray-200 bg-white transition-all hover:scale-[1.01] hover:shadow-lg dark:border-gray-600 dark:bg-gray-700"
                    >
                      <CardBody className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <h4 className="text-lg font-semibold text-dark dark:text-white">
                                {project.nom}
                              </h4>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={getStatusColor(project.statut)}
                              >
                                {project.statut.replace("_", " ")}
                              </Chip>
                            </div>
                            <p className="mb-3 text-gray-600 dark:text-gray-400">
                              {project.description}
                            </p>

                            {/* Barre de progression */}
                            <div className="mb-4">
                              <div className="mb-1 flex justify-between text-sm">
                                <span>Progression</span>
                                <span>{project.progression}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-2 rounded-full bg-primary-500 transition-all"
                                  style={{ width: `${project.progression}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="ml-6 text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {project.budget.toLocaleString("fr-FR")} €
                            </div>
                            <div className="text-sm text-gray-500">Budget</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>👤 {project.responsable}</span>
                            <span>📁 {project.nombreFichiers} fichiers</span>
                            <span>
                              📅 {project.dateDebut.toLocaleDateString("fr-FR")}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href={`/tableaudebord/projet/pageprojet/${project.id}`}
                            >
                              <Button size="sm" variant="flat" color="primary">
                                Voir Projet
                              </Button>
                            </Link>
                            <Link
                              href={`/tableaudebord/projet/pageprojet/${project.id}?tab=partners`}
                            >
                              <Button
                                size="sm"
                                variant="flat"
                                color="secondary"
                              >
                                Gérer Partenaires
                              </Button>
                            </Link>
                          </div>
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  Incidents (
                  {
                    incidents.filter(
                      (i) => i.statut !== "resolu" && i.statut !== "ferme",
                    ).length
                  }
                  )
                </div>
              }
            >
              <div className="min-h-[500px] bg-gray-50 p-6 dark:bg-gray-800">
                {/* En-tête des incidents */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Gestion des Incidents
                  </h3>
                  <Button
                    color="warning"
                    size="md"
                    variant="shadow"
                    className="font-semibold"
                    onClick={() => setShowCreateIncident(true)}
                    startContent={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                      </svg>
                    }
                  >
                    Créer Incident
                  </Button>
                </div>

                {/* Liste des incidents */}
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <Card
                      key={incident.id}
                      className="border border-gray-200 bg-white transition-all hover:scale-[1.01] hover:shadow-lg dark:border-gray-600 dark:bg-gray-700"
                    >
                      <CardBody className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <h4 className="text-lg font-semibold text-dark dark:text-white">
                                {incident.titre}
                              </h4>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={getPriorityColor(incident.priorite)}
                              >
                                {incident.priorite}
                              </Chip>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={getStatusColor(incident.statut)}
                              >
                                {incident.statut.replace("_", " ")}
                              </Chip>
                            </div>

                            <p className="mb-3 text-gray-600 dark:text-gray-400">
                              {incident.description}
                            </p>

                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>📋 {incident.projectNom}</span>
                              <span>👤 {incident.assigneA}</span>
                              <span>
                                📅{" "}
                                {incident.dateCreation.toLocaleDateString(
                                  "fr-FR",
                                )}
                              </span>
                              {incident.dateResolution && (
                                <span>
                                  ✅ Résolu le{" "}
                                  {incident.dateResolution.toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </span>
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
      <Modal
        isOpen={showCreateIncident}
        onClose={() => setShowCreateIncident(false)}
        size="xl"
        scrollBehavior="inside"
        placement="center"
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[85vh] mt-16",
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "z-[9999]",
        }}
      >
        <ModalContent className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 rounded-t-large border-b border-gray-200 bg-gradient-to-r from-warning-50 to-orange-50 pb-6 dark:border-gray-700 dark:from-warning-900/30 dark:to-orange-900/30">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-warning-100 p-2 dark:bg-warning-900/50">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-warning-600 dark:text-warning-400"
                    >
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Créer un Nouvel Incident
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Signaler un problème ou incident technique
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="max-h-[60vh] overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                    <Select
                      label="Projet concerné"
                      placeholder="Sélectionner un projet"
                      selectedKeys={selectedProject ? [selectedProject] : []}
                      onSelectionChange={(keys) => {
                        const selectedValue = Array.from(keys)[0] as string;
                        setSelectedProject(selectedValue || "");
                      }}
                      variant="bordered"
                      size="lg"
                      startContent={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-500 dark:text-gray-400"
                        >
                          <path d="M7.25 6a.75.75 0 0 0-.75.75v7.5a.75.75 0 0 0 1.5 0v-7.5A.75.75 0 0 0 7.25 6M12 6a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 6m4 .75a.75.75 0 0 1 1.5 0v9.5a.75.75 0 0 1-1.5 0z" />
                        </svg>
                      }
                      classNames={{
                        label: "text-gray-900 dark:text-white font-semibold text-base mb-2",
                        trigger:
                          "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        value: "text-gray-900 dark:text-white font-medium text-base",
                      }}
                    >
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.nom}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                    <Input
                      label="Titre de l'incident"
                      placeholder="Ex: Problème de connexion au serveur"
                      value={newIncident.titre}
                      onChange={(e) =>
                        setNewIncident((prev) => ({
                          ...prev,
                          titre: e.target.value,
                        }))
                      }
                      variant="bordered"
                      size="lg"
                      startContent={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-400"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      }
                      classNames={{
                        label: "text-gray-900 dark:text-white font-semibold text-base mb-2",
                        input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-700 text-base pl-3",
                        inputWrapper:
                          "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                    <Textarea
                      label="Description détaillée"
                      placeholder="Décrivez le problème en détail : quand est-il survenu, quels sont les symptômes, etc."
                      value={newIncident.description}
                      onValueChange={(value) =>
                        setNewIncident((prev) => ({
                          ...prev,
                          description: value,
                        }))
                      }
                      variant="bordered"
                      size="lg"
                      minRows={4}
                      startContent={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-400"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                        </svg>
                      }
                      classNames={{
                        label: "text-gray-900 dark:text-white font-semibold text-base mb-2",
                        input: "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-700 text-base p-3",
                        inputWrapper:
                          "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[120px]",
                      }}
                    />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-800">
                    <Select
                      label="Niveau de priorité"
                      placeholder="Sélectionner une priorité"
                      variant="bordered"
                      size="lg"
                      selectedKeys={
                        newIncident.priorite ? [newIncident.priorite] : []
                      }
                      onSelectionChange={(keys) => {
                        const selectedValue = Array.from(keys)[0] as string;
                        setNewIncident((prev) => ({
                          ...prev,
                          priorite: selectedValue as any,
                        }));
                      }}
                      startContent={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-500 dark:text-gray-400"
                        >
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                      }
                      classNames={{
                        label: "text-gray-900 dark:text-white font-semibold text-base mb-2",
                        trigger:
                          "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 focus-within:border-sky-500 dark:focus-within:border-sky-400 shadow-sm hover:shadow-md transition-all duration-300 min-h-[48px]",
                        value: "text-gray-900 dark:text-white font-medium text-base",
                      }}
                    >
                      <SelectItem key="faible" value="faible">
                        🟢 Faible - Impact mineur
                      </SelectItem>
                      <SelectItem key="moyenne" value="moyenne">
                        🟡 Moyenne - Impact modéré
                      </SelectItem>
                      <SelectItem key="haute" value="haute">
                        🟠 Haute - Impact important
                      </SelectItem>
                      <SelectItem key="critique" value="critique">
                        🔴 Critique - Impact majeur
                      </SelectItem>
                    </Select>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="rounded-b-large border-t border-gray-200 bg-gray-50 pt-6 dark:border-gray-700 dark:bg-gray-800">
                <Button
                  variant="flat"
                  onPress={() => setShowCreateIncident(false)}
                  className="text-base font-semibold text-gray-600 dark:text-gray-300"
                  size="lg"
                >
                  Annuler
                </Button>
                <Button
                  color="warning"
                  variant="shadow"
                  onPress={handleCreateIncident}
                  className="text-base font-semibold"
                  size="lg"
                  startContent={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                  }
                >
                  Créer l'Incident
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default VoirPartenaire;
