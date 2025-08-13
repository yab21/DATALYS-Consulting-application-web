"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import DataTable, { Column } from "@/components/UI/DataTable/DataTable";
import { useNotifications } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@nextui-org/react";

interface Project {
  id: string;
  chefDeProjet: string;
  societe: string;
  intitule: string;
  domaine: string[];
  createdAt: Date;
  statut: "en_cours" | "termine" | "en_attente" | "suspendu";
  progression?: number;
  budget?: number;
  visibilite: "public" | "prive" | "restreint";
}

const GestionProjet = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const router = useRouter();

  // Charger les données mockées
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler chargement

      const mockProjects: Project[] = [
        {
          id: "1",
          intitule: "Migration Cloud AWS",
          societe: "TechCorp Solutions",
          chefDeProjet: "Marie Martin",
          domaine: ["itcloud", "security"],
          createdAt: new Date("2024-01-15"),
          statut: "en_cours",
          progression: 65,
          budget: 150000,
          visibilite: "public",
        },
        {
          id: "2",
          intitule: "Sécurisation Réseau",
          societe: "GlobalBank",
          chefDeProjet: "Pierre Durand",
          domaine: ["security"],
          createdAt: new Date("2023-11-20"),
          statut: "termine",
          progression: 100,
          budget: 75000,
          visibilite: "prive",
        },
        {
          id: "3",
          intitule: "Infrastructure DataCenter",
          societe: "EcoLogistics",
          chefDeProjet: "Sophie Bernard",
          domaine: ["datacenter"],
          createdAt: new Date("2024-02-10"),
          statut: "en_attente",
          progression: 15,
          budget: 200000,
          visibilite: "restreint",
        },
        {
          id: "4",
          intitule: "Audit Sécurité",
          societe: "MediHealth Plus",
          chefDeProjet: "Jean Dupont",
          domaine: ["consulting", "security"],
          createdAt: new Date("2024-01-05"),
          statut: "en_cours",
          progression: 40,
          budget: 80000,
          visibilite: "public",
        },
      ];

      setProjects(mockProjects);
      setLoading(false);
    };

    loadProjects();
  }, []);

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
              className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full"
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
      type: "currency",
      render: (value) => value ? `${value.toLocaleString('fr-FR')} €` : "-",
    },
    {
      key: "createdAt",
      label: "Date de création",
      type: "date",
      sortable: true,
    },
  ];

  // Actions sur les lignes
  const handleRowAction = (projectId: string, action: string) => {
    const project = projects.find(p => p.id === projectId);
    
    switch (action) {
      case "view":
        router.push(`/tableaudebord/projet/pageprojet/${projectId}`);
        break;
      case "edit":
        router.push(`/tableaudebord/projet/modifier/${projectId}`);
        break;
      case "delete":
        handleDeleteProject(projectId);
        break;
    }
  };

  // Suppression d'un projet
  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le projet "${project.intitule}" ? Cette action est irréversible.`
    );

    if (confirmed) {
      try {
        // Simulation de suppression
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
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

  return (
    <>
      <Breadcrumb pageName="Gestion de projet" />
      <div className="mt-5 w-full max-w-full">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">
              Gestion des Projets
            </h1>
            <p className="text-default-400 mt-1">
              Gérez tous vos projets DATALYS Consulting
            </p>
          </div>
          <Link href="/tableaudebord/projet/ajouter">
            <Button
              color="primary"
              startContent={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              }
            >
              Nouveau Projet
            </Button>
          </Link>
        </div>

        <DataTable
          data={projects}
          columns={columns}
          loading={loading}
          actions={actions}
          onRowAction={handleRowAction}
          title="Liste des Projets"
          subtitle={`${projects.length} projet${projects.length > 1 ? 's' : ''} au total`}
          searchPlaceholder="Rechercher un projet..."
          pageSize={10}
          className="w-full"
        />
      </div>
    </>
  );
};

export default GestionProjet;
