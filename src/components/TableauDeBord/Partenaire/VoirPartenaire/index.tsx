"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Tab, Tabs, Spinner, Chip, Button } from '@heroui/react';
import { ArrowLeft, Building, Mail, Phone, MapPin, Calendar, User, FileText, Folder as FolderIcon, Eye, AlertTriangle, Headphones } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { partnersService, Partner } from '@/services/partners';
import { projectsService, Project } from '@/services/projects';
import { filesService, ProjectFile } from '@/services/files';
import { foldersService, Folder } from '@/services/folders';
import { extractBackendMessage } from '@/lib/error-handler';
import LoadingState from "@/components/UI/Loading/LoadingState";
import { PartnerStatsService, PartnerStats } from '@/services/partnerStats';

interface VoirPartenaireProps {
  id: string;
}

const VoirPartenaire: React.FC<VoirPartenaireProps> = ({ id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [stats, setStats] = useState<PartnerStats>({
    projectsCount: 0,
    incidentsCount: 0,
    supportTicketsCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const partnerId = parseInt(id);

  // Function pour corriger les URLs d'images
  const fixImageUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url || url.trim() === '') return undefined;
    
    // Nettoyer l'URL
    const cleanUrl = url.trim();
    
    // Ignorer les URLs placeholder ou de test
    if (cleanUrl.includes('example.com') || cleanUrl.includes('placeholder') || cleanUrl.includes('test.com')) {
      return undefined;
    }
    
    // Vérifier que l'URL se termine bien par un nom de fichier
    const hasFileExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanUrl);
    if (!hasFileExtension) {
      console.warn('URL sans extension de fichier détectée:', cleanUrl);
      return undefined;
    }
    
    // Nouveau format d'upload via /files/serve/ avec backend HTTPS direct
    if (cleanUrl.includes('/files/serve/')) {
      // Si c'est déjà une URL complète HTTPS, la garder telle quelle
      if (cleanUrl.startsWith('https://applicationweb.datalysconsulting.com/files/serve/')) {
        return cleanUrl;
      }
      
      // Si c'est un chemin /files/serve/, le convertir en URL complète HTTPS
      if (cleanUrl.startsWith('/files/serve/')) {
        return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
      }
      
      // URLs avec ancien domaine - convertir vers HTTPS SANS /api
      if (cleanUrl.includes('82.112.253.137:8082')) {
        return cleanUrl.replace('http://82.112.253.137:8082', 'https://applicationweb.datalysconsulting.com');
      }
      
      // Si l'URL contient déjà /api/files/serve/, la corriger en enlevant /api
      if (cleanUrl.includes('/api/files/serve/')) {
        return cleanUrl.replace('/api/files/serve/', '/files/serve/');
      }
    }
    
    // URLs avec ancien localhost - convertir vers HTTPS
    if (cleanUrl.includes('localhost:8081') || cleanUrl.includes('82.112.253.137:8081')) {
      const pathMatch = cleanUrl.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
      }
    }
    
    // URLs relatives /uploads/ - utiliser l'ancien système d'images statiques
    if (cleanUrl.startsWith('/uploads/logos/')) {
      const filename = cleanUrl.replace('/uploads/logos/', '');
      return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
    }
    
    // URLs relatives backend - convertir vers URL complète HTTPS
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('/uploads/') && !cleanUrl.startsWith('/files/serve/')) {
      return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
    }
    
    // URLs déjà complètes avec HTTP - convertir vers HTTPS
    if (cleanUrl.startsWith('http://')) {
      return cleanUrl.replace('http://', 'https://');
    }
    
    // URLs HTTPS déjà valides
    if (cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    
    // Fallback pour URLs inconnues
    return cleanUrl;
  }, []);

  useEffect(() => {
    loadPartnerData();
  }, [id]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLogoError(false); // Reset logo error when loading new partner

      const partnerData = await partnersService.getPartnerById(partnerId);
      if (!partnerData) {
        setError('Partenaire non trouvé');
        return;
      }

      setPartner(partnerData);
      
      // Charger les statistiques après avoir récupéré les données du partenaire
      loadPartnerStats(partnerData);
    } catch (error) {
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerStats = async (partnerData?: Partner) => {
    const currentPartner = partnerData || partner;
    if (!currentPartner) return;

    try {
      setLoadingStats(true);
      
      const statistics = await PartnerStatsService.getPartnerStatsWithCache(
        currentPartner.id, 
        currentPartner.name
      );
      
      setStats(statistics);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      // Garder les valeurs par défaut en cas d'erreur
    } finally {
      setLoadingStats(false);
    }
  };

  const loadProjects = async () => {
    if (!partner) return;

    try {
      setLoadingProjects(true);
      const projectsData = await projectsService.getProjectsByPartner(partner.name);
      setProjects(projectsData);
    } catch (error) {
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadFiles = async () => {
    if (!partner || projects.length === 0) return;

    try {
      setLoadingFiles(true);
      const allFiles: ProjectFile[] = [];
      
      for (const project of projects) {
        const projectFiles = await filesService.getFilesByCriteria(0, 100, {
          project_id: project.id
        });
        allFiles.push(...projectFiles);
      }

      setFiles(allFiles);
    } catch (error) {
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadFolders = async () => {
    if (!partner || projects.length === 0) return;

    try {
      setLoadingFolders(true);
      const allFolders: Folder[] = [];
      
      for (const project of projects) {
        const projectFolders = await foldersService.getFoldersByProject(
          project.id,
          null,
          1 // userId placeholder
        );
        allFolders.push(...projectFolders);
      }

      setFolders(allFolders);
    } catch (error) {
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleTabChange = async (key: string) => {
    setActiveTab(key);
    
    switch (key) {
      case 'projects':
        if (projects.length === 0) {
          await loadProjects();
        }
        break;
      case 'documents':
        if (files.length === 0 && projects.length === 0) {
          await loadProjects();
        }
        if (files.length === 0 && projects.length > 0) {
          await loadFiles();
        }
        break;
      case 'folders':
        if (folders.length === 0 && projects.length === 0) {
          await loadProjects();
        }
        if (folders.length === 0 && projects.length > 0) {
          await loadFolders();
        }
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement du partenaire..." />
        <LoadingState type="skeleton" skeletonVariant="profile" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumb pageName="Erreur" />
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button
              onPress={loadPartnerData}
              color="primary"
              variant="solid"
            >
              Réessayer
            </Button>
            <Button
              onPress={() => router.back()}
              variant="bordered"
            >
              Retour
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!partner) {
    return (
      <>
        <Breadcrumb pageName="Partenaire introuvable" />
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600">Partenaire introuvable</h3>
          <p className="text-gray-400 mt-2">Le partenaire demandé n'existe pas ou vous n'y avez pas accès.</p>
          <Button
            onPress={() => router.back()}
            variant="bordered"
            startContent={<ArrowLeft size={16} />}
            className="mt-4"
          >
            Retour
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`Partenaire: ${partner.name}`} />
      
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton de retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push('/tableaudebord/partenaire/liste')}
            className="font-medium"
          >
            Retour à la gestion des partenaires
          </Button>
        </div>

        {/* En-tête du partenaire amélioré */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4ba9b7]/5 via-transparent to-blue-500/5 dark:from-[#4ba9b7]/10 dark:to-blue-500/10"></div>
          <CardHeader className="relative pb-8 pt-8 bg-gradient-to-r from-[#4ba9b7]/10 via-transparent to-blue-500/10 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col gap-8 w-full">
              {/* Header principal */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {(() => {
                      const fixedLogoUrl = fixImageUrl(partner.logo_url);
                      const shouldShowLogo = fixedLogoUrl && !logoError;
                      
                      return shouldShowLogo ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                          <img
                            src={fixedLogoUrl}
                            alt={`Logo ${partner.name}`}
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.error(`Erreur chargement logo pour ${partner.name}:`, fixedLogoUrl);
                              setLogoError(true);
                            }}
                            onLoad={() => {
                              // Reset logo error if image loads successfully
                              setLogoError(false);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-[#4ba9b7] to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[#4ba9b7]/25">
                          <span className="text-white font-bold text-xl uppercase">
                            {partner.name.slice(0, 2)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                      {partner.name}
                    </h1>
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">{partner.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Créé le {formatDate(partner.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip
                    color={partner.is_active ? "success" : "danger"}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                  >
                    {partner.is_active ? "Actif" : "Inactif"}
                  </Chip>
                </div>
              </div>

              {/* Statistiques du partenaire */}
              <div className="space-y-4">
                {/* Première ligne : Informations de contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#4ba9b7]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Téléphone</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {partner.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#4ba9b7]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Adresse</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {partner.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deuxième ligne : Statistiques métier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Projets</p>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {loadingStats ? <Spinner size="sm" /> : stats.projectsCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Incidents</p>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {loadingStats ? <Spinner size="sm" /> : stats.incidentsCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Support</p>
                        <div className="text-xl font-semibold text-gray-900 dark:text-white">
                          {loadingStats ? <Spinner size="sm" /> : stats.supportTicketsCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal avec onglets améliorés */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => handleTabChange(key as string)}
              className="w-full"
              size="lg"
              classNames={{
                tabList: "bg-gray-50 dark:bg-gray-700 p-3 gap-3",
                tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-600 data-[selected=true]:shadow-md transition-all duration-200 rounded-lg px-4 py-3",
                tabContent: "text-gray-600 dark:text-gray-300 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
              }}
            >
              <Tab 
                key="overview" 
                title={
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5" />
                    <span>Vue d'ensemble</span>
                  </div>
                }
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Mail className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{partner.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Phone className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Téléphone</p>
                          <p className="font-medium">{partner.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <MapPin className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Adresse</p>
                          <p className="font-medium">{partner.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Date de création</p>
                          <p className="font-medium">{formatDate(partner.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <User className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Statut</p>
                          <Chip
                            color={partner.is_active ? "success" : "danger"}
                            variant="flat"
                            size="sm"
                          >
                            {partner.is_active ? "Actif" : "Inactif"}
                          </Chip>
                        </div>
                      </div>
                      
                      {(() => {
                        const fixedLogoUrl = fixImageUrl(partner.logo_url);
                        const shouldShowLogo = fixedLogoUrl && !logoError;
                        
                        return shouldShowLogo ? (
                          <div className="flex items-start space-x-3">
                            <Building className="text-gray-400 mt-1" size={20} />
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Logo</p>
                              <img 
                                src={fixedLogoUrl} 
                                alt={`Logo ${partner.name}`}
                                className="w-16 h-16 object-cover rounded-lg border"
                                onError={() => {
                                  console.error(`Erreur chargement logo dans Vue d'ensemble pour ${partner.name}:`, fixedLogoUrl);
                                  setLogoError(true);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-3">
                            <Building className="text-gray-400 mt-1" size={20} />
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Logo</p>
                              <div className="w-16 h-16 bg-gradient-to-br from-[#4ba9b7] to-blue-600 rounded-lg flex items-center justify-center border">
                                <span className="text-white font-bold text-xl uppercase">
                                  {partner.name.slice(0, 2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab 
                key="projects" 
                title={
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <span>Projets ({projects.length})</span>
                  </div>
                }
              >
                <div className="p-6">
                  {loadingProjects ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{project.title}</h4>
                              {project.description && (
                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Créé le {formatDate(project.created_at)}
                              </p>
                            </div>
                            <Chip
                              color={project.is_active ? "success" : "warning"}
                              variant="flat"
                              size="sm"
                            >
                              {project.is_active ? "Actif" : "Inactif"}
                            </Chip>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-500">Aucun projet associé à ce partenaire</p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab 
                key="documents" 
                title={
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <span>Documents ({files.length})</span>
                  </div>
                }
              >
                <div className="p-6">
                  {loadingFiles ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  ) : files.length > 0 ? (
                    <div className="space-y-3">
                      {files.map((file) => (
                        <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{file.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>{file.extension.toUpperCase()}</span>
                                <span>{formatFileSize(file.size)}</span>
                                <span>{formatDate(file.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-500">Aucun document trouvé pour ce partenaire</p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab 
                key="folders" 
                title={
                  <div className="flex items-center gap-3">
                    <FolderIcon className="w-5 h-5" />
                    <span>Dossiers ({folders.length})</span>
                  </div>
                }
              >
                <div className="p-6">
                  {loadingFolders ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  ) : folders.length > 0 ? (
                    <div className="space-y-3">
                      {folders.map((folder) => (
                        <div key={folder.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{folder.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>Chemin: {folder.path}</span>
                                <span>{formatDate(folder.created_at)}</span>
                              </div>
                            </div>
                            <Chip
                              color={folder.is_active ? "success" : "warning"}
                              variant="flat"
                              size="sm"
                            >
                              {folder.is_active ? "Actif" : "Inactif"}
                            </Chip>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FolderIcon className="mx-auto text-gray-400 mb-3" size={48} />
                      <p className="text-gray-500">Aucun dossier trouvé pour ce partenaire</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default VoirPartenaire;