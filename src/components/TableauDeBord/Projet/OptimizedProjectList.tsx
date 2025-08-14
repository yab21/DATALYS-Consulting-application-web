"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Calendar, User, ExternalLink } from "lucide-react";
import { Button, Chip, Avatar } from "@nextui-org/react";
import { useProjectCache, VirtualizedTable, SkeletonTable } from "@/components/Optimizations";
import { useRouter } from "next/navigation";

// Types
interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "draft" | "archived";
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  collaborators_count: number;
  files_count: number;
  progress: number;
  priority: "low" | "medium" | "high";
}

const OptimizedProjectList: React.FC = () => {
  const router = useRouter();

  // Cache intelligent pour les projets
  const { 
    data: projects = [], 
    isLoading, 
    isStale,
    refetch 
  } = useProjectCache<Project[]>("projects-list", async () => {
    // Simuler un appel API - remplacer par votre vraie API
    const response = await fetch("/api/projects");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des projets");
    }
    return response.json();
  });

  // Configuration des colonnes pour la table virtualisée
  const columns = useMemo(() => [
    {
      key: "name",
      label: "Nom du projet",
      sortable: true,
      searchable: true,
      width: 300,
      render: (value: string, project: Project) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
            {project.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {project.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      width: 120,
      render: (value: string) => {
        const statusConfig = {
          active: { color: "success", label: "Actif" },
          completed: { color: "primary", label: "Terminé" },
          draft: { color: "warning", label: "Brouillon" },
          archived: { color: "default", label: "Archivé" },
        };
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.draft;
        return (
          <Chip size="sm" color={config.color as any} variant="flat">
            {config.label}
          </Chip>
        );
      },
    },
    {
      key: "owner",
      label: "Propriétaire",
      sortable: true,
      searchable: true,
      width: 200,
      render: (value: Project["owner"]) => (
        <div className="flex items-center gap-2">
          <Avatar
            src={value.avatar}
            name={value.name}
            size="sm"
            className="flex-shrink-0"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {value.name}
          </span>
        </div>
      ),
    },
    {
      key: "progress",
      label: "Progression",
      sortable: true,
      width: 150,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {value}%
          </span>
        </div>
      ),
    },
    {
      key: "files_count",
      label: "Fichiers",
      sortable: true,
      width: 100,
      className: "text-center",
      render: (value: number) => (
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
            📁 {value}
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Créé le",
      sortable: true,
      width: 120,
      render: (value: string) => (
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 100,
      render: (value: any, project: Project) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tableaudebord/projet/pageprojet/${project.id}`);
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  // Gestion des actions
  const handleProjectClick = (project: Project) => {
    router.push(`/tableaudebord/projet/voir/${project.id}`);
  };

  const handleSelectionChange = (selectedProjects: Project[]) => {
    console.log("Projets sélectionnés:", selectedProjects);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Projets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez et organisez vos projets DATALYS
            {isStale && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                (Données potentiellement obsolètes)
              </span>
            )}
          </p>
        </div>
        <Button
          color="primary"
          onClick={() => router.push('/tableaudebord/projet/ajouter')}
          startContent={<Plus className="h-4 w-4" />}
        >
          Nouveau Projet
        </Button>
      </div>

      {/* Table virtualisée haute performance */}
      {isLoading ? (
        <SkeletonTable rows={8} className="space-y-4" />
      ) : (
        <VirtualizedTable
          data={projects}
          columns={columns}
          onItemClick={handleProjectClick}
          onSelectionChange={handleSelectionChange}
          searchable={true}
          searchFields={["name", "description", "owner.name"]}
          sortable={true}
          exportable={true}
          refreshable={true}
          onRefresh={handleRefresh}
          height={600}
          virtual={projects.length > 100}
          emptyMessage="Aucun projet trouvé. Créez votre premier projet !"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg"
        />
      )}

    </div>
  );
};

export default OptimizedProjectList;