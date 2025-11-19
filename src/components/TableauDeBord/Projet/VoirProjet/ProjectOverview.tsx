"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  Clock,
  Target,
  FolderOpen,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { projectFilesService } from "@/services/projectFiles";
import { IncidentsService } from "@/services/incidents";
import { projectPartnersService } from "@/services/projectPartners";
import { useAuth } from "@/context/AuthContext";

interface ProjectOverviewProps {
  project: {
    id: string;
    intitule: string;
    societe: string;
    chefDeProjet: string;
    createdAt: Date;
    statut: "en_cours" | "termine" | "en_attente" | "suspendu";
    progression?: number;
    description?: string;
  };
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  const { user } = useAuth();
  
  // Calculs de statistiques basées sur les données disponibles
  const projectAge = Math.floor((new Date().getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // État pour les vraies statistiques du projet
  const [projectStats, setProjectStats] = useState({
    filesCount: 0,
    foldersCount: 0,
    incidentsCount: 0,
    teamMembersCount: 0,
    lastActivity: "Il y a 2 heures",
    loading: true
  });

  // Charger les vraies statistiques du projet
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        console.log('🔄 [DEBUG FIX] - Début du chargement des statistiques pour le projet', project.id);
        
        // CORRECTION: Vider le cache avant de compter pour avoir des données fraîches
        projectFilesService.clearStatsCache();
        console.log('🗑️ [DEBUG FIX] - Cache des statistiques vidé');
        
        // Récupérer tous les dossiers du projet
        console.log('🔍 [DEBUG FIX] - Récupération des dossiers du projet', project.id);
        const folders = await projectFilesService.getFolders(null, Number(project.id));
        const foldersCount = folders.length;
        
        console.log('📁 [DEBUG FIX] - Dossiers trouvés:', {
          count: foldersCount,
          folders: folders.map(f => ({ id: f.id, name: f.name }))
        });

        // Compter tous les fichiers dans tous les dossiers
        let totalFiles = 0;
        const folderFileCounts: { [folderId: number]: number } = {};
        
        console.log('🔍 [DEBUG FIX] - Début du comptage des fichiers dans', folders.length, 'dossiers');
        
        // Compter les fichiers dans chaque dossier
        for (const folder of folders) {
          try {
            console.log(`🔍 [DEBUG FIX] - Comptage fichiers pour dossier "${folder.name}" (ID: ${folder.id})`);
            const files = await projectFilesService.getFiles(folder.id, Number(project.id));
            const fileCount = files.length;
            totalFiles += fileCount;
            folderFileCounts[folder.id] = fileCount;
            
            console.log(`✅ [DEBUG FIX] - Dossier "${folder.name}": ${fileCount} fichier(s) trouvé(s)`);
            
            if (fileCount > 0) {
              console.log('📁 [DEBUG FIX] - Détail des fichiers:', files.map(f => ({
                id: f.id,
                name: f.original_name,
                folder_id: f.folder_id
              })));
            }
          } catch (error) {
            console.error(`❌ [DEBUG FIX] - Erreur lors du comptage des fichiers du dossier "${folder.name}" (ID: ${folder.id}):`, error);
            folderFileCounts[folder.id] = 0;
          }
        }
        
        console.log('📊 [DEBUG FIX] - Résumé du comptage des fichiers:', {
          totalFolders: folders.length,
          totalFiles,
          detailByFolder: folderFileCounts
        });

        // Compter également les fichiers à la racine (sans dossier parent)
        // CORRECTION: Ne pas essayer de compter les fichiers racine avec null
        // car l'API ne gère pas correctement cette situation
        console.log('🔍 [DEBUG FIX] - Éviter le comptage des fichiers racine avec null folder_id');
        // Les fichiers racine seront comptés différemment si nécessaire

        // Charger les vraies données d'incidents
        console.log('🔍 [DEBUG FIX] - Chargement des incidents pour le projet', project.id);
        let incidentsCount = 0;
        try {
          const incidentsResponse = await IncidentsService.getIncidentsByCriteria({
            data: {
              project_id: parseInt(project.id),
              is_active: true
            }
          });
          
          if (incidentsResponse.code === 200 && incidentsResponse.items) {
            incidentsCount = incidentsResponse.items.length;
            console.log('✅ [DEBUG FIX] - Incidents trouvés:', incidentsCount);
          }
        } catch (error) {
          console.warn('❌ [DEBUG FIX] - Erreur lors du chargement des incidents:', error);
        }

        // Charger les vraies données d'équipe
        console.log('🔍 [DEBUG FIX] - Chargement de l\'équipe pour le projet', project.id);
        let teamMembersCount = 0;
        try {
          if (user?.id) {
            console.log('🔍 [DEBUG FIX] - Tentative de récupération équipe avec userId:', user.id, 'projectId:', parseInt(project.id));
            const teamMembers = await projectPartnersService.getProjectPartners(
              parseInt(project.id), 
              user.id
            );
            teamMembersCount = teamMembers.length;
            console.log('✅ [DEBUG FIX] - Membres d\'équipe trouvés:', teamMembersCount, teamMembers);
          } else {
            console.warn('❌ [DEBUG FIX] - Pas d\'utilisateur connecté pour charger l\'équipe');
          }
        } catch (error) {
          console.error('❌ [DEBUG FIX] - Erreur détaillée lors du chargement de l\'équipe:', {
            error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : null,
            userId: user?.id,
            projectId: project.id
          });
          
          // Pour l'instant, on met 0 au lieu d'une valeur factice
          teamMembersCount = 0;
          console.log('⚠️ [DEBUG FIX] - Équipe définie à 0 à cause de l\'erreur API');
        }

        console.log('✅ [DEBUG FIX] - Statistiques finales calculées:', {
          projectId: project.id,
          foldersCount,
          filesCount: totalFiles,
          incidentsCount,
          teamMembersCount,
          message: `Projet: ${foldersCount} dossiers, ${totalFiles} fichiers, ${incidentsCount} incidents, ${teamMembersCount} membres d'équipe`
        });

        setProjectStats(prev => ({
          ...prev,
          filesCount: totalFiles,
          foldersCount,
          incidentsCount,
          teamMembersCount,
          loading: false
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques du projet:', error);
        setProjectStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (project.id) {
      fetchProjectStats();
    }
  }, [project.id, user?.id]);

  const statisticsCards = [
    {
      icon: <FolderOpen className="w-6 h-6" />,
      label: "Dossiers",
      value: projectStats.loading ? "..." : projectStats.foldersCount,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: "Fichiers",
      value: projectStats.loading ? "..." : projectStats.filesCount,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      label: "Incidents",
      value: projectStats.incidentsCount,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: "Équipe",
      value: projectStats.teamMembersCount,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header avec design moderne - nettoyé */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#4ba9b7] to-[#3d8b96] rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Vue d'ensemble
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Aperçu complet et détaillé du projet
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-12">
        {/* Statistiques harmonisées avec le style du dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statisticsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <span className={`${stat.iconColor}`}>
                    {stat.icon}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {projectStats.loading ? (
                      <div className="w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informations détaillées harmonisées */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Carte des informations principales */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="xl:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4ba9b7] to-[#3d8b96] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Informations du projet
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Détails essentiels et métadonnées
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-[#4ba9b7]" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Nom du projet</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {project.intitule}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#4ba9b7]" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Partenaire</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {project.societe}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[#4ba9b7]" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Créé le</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {project.createdAt.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-[#4ba9b7]" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Durée</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {projectAge} jour{projectAge !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Activité récente harmonisée */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#4ba9b7] to-[#3d8b96] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Activité récente
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Actions et événements
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex items-center justify-center flex-1">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-[#4ba9b7]" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Historique complet
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Consultez l'onglet "Activité" pour voir tous les événements du projet
                  </p>
                  <div className="inline-flex items-center gap-2 text-[#4ba9b7] font-medium">
                    <span>Voir l'activité</span>
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Description du projet si disponible */}
        {project.description && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4ba9b7] to-[#3d8b96] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Description du projet
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Informations détaillées
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;