"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  FileText,
  FolderOpen,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Chip } from "@heroui/react";
import { projectFilesService, ProjectFolder } from "@/services/projectFiles";
import { IncidentsService, Incident } from "@/services/incidents";
import { projectPartnersService, ProjectPartner } from "@/services/projectPartners";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpiredError } from "@/lib/api-interceptor";

interface ProjectOverviewProps {
  project: {
    id: string;
    intitule: string;
    societe: string;
    chefDeProjet: string;
    createdAt: Date;
    statut: "en_cours" | "termine" | "en_attente" | "suspendu" | "cloture";
    progression?: number;
    description?: string;
  };
  onTabChange?: (tab: string) => void;
}

const MAX_DROPDOWN_ITEMS = 5;

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project, onTabChange }) => {
  const { user } = useAuth();
  const router = useRouter();

  const projectAge = Math.floor((new Date().getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const [projectStats, setProjectStats] = useState({
    filesCount: 0,
    foldersCount: 0,
    incidentsCount: 0,
    teamMembersCount: 0,
    teamError: false,
    loading: true
  });

  const [detailedData, setDetailedData] = useState<{
    folders: ProjectFolder[];
    files: { name: string; folder_name: string; folder_id: number }[];
    incidents: Incident[];
    teamMembers: ProjectPartner[];
  }>({
    folders: [],
    files: [],
    incidents: [],
    teamMembers: []
  });

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedCard && cardRefs.current[expandedCard]) {
        if (!cardRefs.current[expandedCard]!.contains(event.target as Node)) {
          setExpandedCard(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedCard]);

  // Charger les statistiques
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        projectFilesService.clearStatsCache();

        const folders = await projectFilesService.getFolders(null, Number(project.id));
        const foldersCount = folders.length;

        let totalFiles = 0;
        const allFiles: { name: string; folder_name: string; folder_id: number }[] = [];

        for (const folder of folders) {
          try {
            const files = await projectFilesService.getFiles(folder.id, Number(project.id));
            totalFiles += files.length;
            files.forEach(f => {
              allFiles.push({
                name: f.original_name || f.name,
                folder_name: folder.name,
                folder_id: folder.id
              });
            });
          } catch (error) {
            if (isTokenExpiredError(error)) throw error;
          }
        }

        let incidentsCount = 0;
        let incidentsList: Incident[] = [];
        try {
          const incidentsResponse = await IncidentsService.getIncidentsByCriteria({
            data: { project_id: parseInt(project.id), is_active: true }
          });
          if (incidentsResponse.code === 200 && incidentsResponse.items) {
            incidentsCount = incidentsResponse.items.length;
            incidentsList = incidentsResponse.items;
          }
        } catch (error) {
          if (isTokenExpiredError(error)) throw error;
        }

        let teamMembersCount = 0;
        let teamMembersList: ProjectPartner[] = [];
        let teamError = false;
        try {
          if (user?.id) {
            const teamMembers = await projectPartnersService.getProjectPartners(
              parseInt(project.id), user.id
            );
            teamMembersCount = teamMembers.length;
            teamMembersList = teamMembers;
          } else {
            teamError = true;
          }
        } catch (error) {
          if (isTokenExpiredError(error)) throw error;
          teamError = true;
        }

        setDetailedData({ folders, files: allFiles, incidents: incidentsList, teamMembers: teamMembersList });
        setProjectStats({ filesCount: totalFiles, foldersCount, incidentsCount, teamMembersCount, teamError, loading: false });
      } catch (error) {
        if (isTokenExpiredError(error)) throw error;
        console.error('Erreur lors du chargement des statistiques du projet:', error);
        setProjectStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (project.id) fetchProjectStats();
  }, [project.id, user?.id]);

  const handleViewAll = (label: string) => {
    switch (label) {
      case "Dossiers":
      case "Fichiers":
        onTabChange?.("files");
        break;
      case "Incidents":
        router.push(`/tableaudebord/incidents?project_id=${project.id}`);
        break;
      case "Équipe":
        router.push(`/tableaudebord/partenaire/liste?project_id=${project.id}`);
        break;
    }
  };

  const handleCardClick = (label: string) => {
    setExpandedCard(prev => prev === label ? null : label);
  };

  const getPriorityColor = (priority: string): "danger" | "warning" | "primary" | "default" => {
    switch (priority) {
      case 'P0': case 'P1': return 'danger';
      case 'P2': return 'warning';
      case 'P3': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      nouveau: 'Nouveau', en_cours: 'En cours', en_attente: 'En attente',
      en_arbitrage: 'Arbitrage', en_pause: 'En pause', resolu: 'Résolu'
    };
    return labels[status] || status;
  };

  const getTotalCount = (label: string): number => {
    switch (label) {
      case "Dossiers": return detailedData.folders.length;
      case "Fichiers": return detailedData.files.length;
      case "Incidents": return detailedData.incidents.length;
      case "Équipe": return detailedData.teamMembers.length;
      default: return 0;
    }
  };

  const renderDropdownContent = (label: string) => {
    switch (label) {
      case "Dossiers": {
        const items = detailedData.folders.slice(0, MAX_DROPDOWN_ITEMS);
        if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun dossier</p>;
        return items.map(folder => (
          <button
            key={folder.id}
            onClick={(e) => { e.stopPropagation(); onTabChange?.("files"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <FolderOpen className="w-4 h-4 text-[#4ba9b7] flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{folder.name}</span>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity" />
          </button>
        ));
      }
      case "Fichiers": {
        const items = detailedData.files.slice(0, MAX_DROPDOWN_ITEMS);
        if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun fichier</p>;
        return items.map((file, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); onTabChange?.("files"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <FileText className="w-4 h-4 text-[#4ba9b7] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{file.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{file.folder_name}</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ));
      }
      case "Incidents": {
        const items = detailedData.incidents.slice(0, MAX_DROPDOWN_ITEMS);
        if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun incident</p>;
        return items.map(incident => (
          <button
            key={incident.id}
            onClick={(e) => { e.stopPropagation(); router.push(`/tableaudebord/incidents/${incident.id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{incident.title}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Chip size="sm" color={getPriorityColor(incident.priority)} variant="flat" className="h-5 text-[10px]">
                  {incident.priority}
                </Chip>
                <Chip size="sm" variant="flat" className="h-5 text-[10px]">
                  {getStatusLabel(incident.status)}
                </Chip>
              </div>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ));
      }
      case "Équipe": {
        if (projectStats.teamError) {
          return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Données non disponibles</p>;
        }
        const items = detailedData.teamMembers.slice(0, MAX_DROPDOWN_ITEMS);
        if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun membre</p>;
        return items.map(member => (
          <button
            key={member.id}
            onClick={(e) => { e.stopPropagation(); router.push(`/tableaudebord/partenaire/${member.user_id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {(member.partner_name || member.user_name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{member.partner_name || member.user_name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">{member.partner_email || member.user_email}</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ));
      }
      default:
        return null;
    }
  };

  const statisticsCards = [
    {
      icon: <FolderOpen className="w-5 h-5" />,
      label: "Dossiers",
      value: projectStats.loading ? "..." : projectStats.foldersCount,
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderActive: "border-blue-300 dark:border-blue-700"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Fichiers",
      value: projectStats.loading ? "..." : projectStats.filesCount,
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderActive: "border-emerald-300 dark:border-emerald-700"
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Incidents",
      value: projectStats.incidentsCount,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderActive: "border-orange-300 dark:border-orange-700"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Équipe",
      value: projectStats.teamError ? "N/A" : projectStats.teamMembersCount,
      iconBg: "bg-violet-50 dark:bg-violet-900/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderActive: "border-violet-300 dark:border-violet-700"
    }
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statisticsCards.map((stat) => {
          const isExpanded = expandedCard === stat.label;
          const totalCount = getTotalCount(stat.label);

          return (
            <div
              key={stat.label}
              ref={(el) => { cardRefs.current[stat.label] = el; }}
              className="relative"
            >
              <div
                onClick={() => handleCardClick(stat.label)}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-5 cursor-pointer transition-all duration-200 select-none ${
                  isExpanded
                    ? `${stat.borderActive} shadow-md`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className={stat.iconColor}>{stat.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                      {projectStats.loading ? (
                        <div className="w-8 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                      {stat.label}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-30"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                        {renderDropdownContent(stat.label)}
                      </div>
                      {totalCount > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewAll(stat.label); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4ba9b7] hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            Voir tout ({totalCount})
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Détails du projet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-[#4ba9b7]" />
            Informations du projet
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nom du projet</dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white">{project.intitule}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Partenaire</dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white">{project.societe}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date de création</dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                {project.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Durée</dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                {projectAge} jour{projectAge !== 1 ? 's' : ''}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4ba9b7]" />
              Description
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;
