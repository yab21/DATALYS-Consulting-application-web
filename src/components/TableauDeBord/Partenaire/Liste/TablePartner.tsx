"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SecureStorage } from "@/lib/secure-storage";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody
} from "@nextui-org/react";
import { 
  Search, 
  Edit, 
  Trash2,
  Plus,
  Phone,
  Filter,
  Shield,
  Calendar,
  UserCheck,
  UserX,
  MoreVertical,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { partnersService, Partner, GetPartnersParams } from "@/services/partners";
import { projectsService } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import PartnerModals from "./PartnerModals";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";

// Interface pour la gestion des modals
interface ModalState {
  isOpen: boolean;
  type: 'edit' | 'delete' | 'view' | 'create' | null;
  partner: Partner | null;
}


// Interface pour les filtres
interface TableFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

// Interface pour les statistiques
interface PartnerStats {
  totalPartners: number;
  activePartners: number;
  inactivePartners: number;
  newPartners: number;
  partnersWithProjects: number;
  avgProjectsPerPartner: number;
}

// Interface pour la pagination côté serveur
interface PaginationState {
  page: number;
  rowsPerPage: number;
  total: number;
  totalPages: number;
}

const TablePartner: React.FC = () => {
  // États pour les données
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginatedPartners, setPaginatedPartners] = useState<Partner[]>([]);
  
  // États pour les statistiques
  const [stats, setStats] = useState<PartnerStats>({
    totalPartners: 0,
    activePartners: 0,
    inactivePartners: 0,
    newPartners: 0,
    partnersWithProjects: 0,
    avgProjectsPerPartner: 0
  });
  
  // États pour la pagination
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    rowsPerPage: 10,
    total: 0,
    totalPages: 0
  });
  
  // États pour les filtres
  const [filters, setFilters] = useState<TableFilters>({
    search: "",
    status: "all"
  });
  
  
  // États pour les modals
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    partner: null
  });
  
  
  
  // Gestion des erreurs d'images
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Système de notifications
  const { showNotification } = useSimpleNotifications();
  
  // Hook d'authentification
  const { 
    isAuthenticated, 
    isLoading: authLoading,
    isAdmin,
    hasPermission,
    canCreate
  } = useAuth();

  // Fonction utilitaire pour corriger les URLs d'images
  const fixImageUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url) return url;
    
    
    // Les URLs passent par le proxy pour éviter les mixed content
    if (url.includes('82.112.253.137:8082/files/serve/')) {
      const fixedUrl = url.replace('http://82.112.253.137:8082', '/api/proxy');
      return fixedUrl;
    }
    
    // Pour les URLs avec localhost:8081
    if (url.includes('localhost:8081')) {
      const pathMatch = url.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
      } else {
        return url.replace('localhost:8081', '')
                  .replace('/uploads/', `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/`);
      }
    }
    
    // Pour les URLs qui pointent déjà vers l'ancien serveur d'images
    if (url.includes('82.112.253.137:8081/uploads/') || url.includes('/uploads/')) {
      const pathMatch = url.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
      }
    }
    
    // Si l'URL est relative avec /uploads/
    if (url.startsWith('/uploads/logos/')) {
      const filename = url.replace('/uploads/logos/', '');
      return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
    }
    
    // Vérifier si l'URL pointe vers /files/serve/ (nouveau format d'upload)
    if (url.includes('/files/serve/')) {
      // Si c'est déjà un chemin /api/files/serve/, le garder tel quel
      if (url.startsWith('/api/files/serve/')) {
        return url;
      }
      // Sinon, ajouter le prefix /api/proxy
      if (url.startsWith('/files/serve/')) {
        return `/api/proxy${url}`;
      }
    }
    
    // Ignorer les URLs placeholder ou de test
    if (url.includes('example.com') || url.includes('placeholder')) {
      return undefined;
    }
    
    return url;
  }, []);

  // Gestion des erreurs d'images
  const handleImageError = useCallback((partnerId: number) => {
    setImageErrors(prev => new Set(prev).add(partnerId.toString()));
  }, []);

  // Validation d'URL d'image
  const isValidImageUrl = useCallback((url: string | undefined): boolean => {
    if (!url) return false;
    
    // Accepter les URLs relatives (commençant par /)
    if (url.startsWith('/')) return true;
    
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }, []);

  // Calculer les statistiques des partenaires
  const calculatePartnerStats = async (partners: Partner[]) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    try {
      // Charger les projets pour calculer les statistiques croisées
      const projects = await projectsService.getActiveProjects();
      
      const totalPartners = partners.length;
      const activePartners = partners.filter(p => p.is_active).length;
      const inactivePartners = partners.filter(p => !p.is_active).length;
      const newPartners = partners.filter(p => new Date(p.created_at) >= oneMonthAgo).length;
      const partnersWithProjects = projects.reduce((acc, project) => {
        if (project.partner_id) acc.add(project.partner_id);
        return acc;
      }, new Set()).size;
      const avgProjectsPerPartner = activePartners > 0 ? Math.round(projects.length / activePartners) : 0;
      
      return {
        totalPartners,
        activePartners,
        inactivePartners,
        newPartners,
        partnersWithProjects,
        avgProjectsPerPartner
      };
    } catch (error) {
      return {
        totalPartners: partners.length,
        activePartners: partners.filter(p => p.is_active).length,
        inactivePartners: partners.filter(p => !p.is_active).length,
        newPartners: 0,
        partnersWithProjects: 0,
        avgProjectsPerPartner: 0
      };
    }
  };

  // Chargement des données depuis l'API
  const loadPartners = useCallback(async () => {
    // Attendre que l'authentification soit chargée
    if (authLoading) {
      return;
    }

    const token = SecureStorage.getItem('authToken');

    if (!isAuthenticated) {
      setError("Vous devez être connecté pour voir les partenaires");
      setLoading(false);
      return;
    }

    // Vérification des permissions - Seuls les admins peuvent voir les partenaires
    if (!isAdmin()) {
      setError("Accès refusé. Seuls les administrateurs peuvent gérer les partenaires.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Token d'authentification manquant");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // S'assurer que le token est bien défini dans le service
      partnersService.setToken(token);
      
      // Préparer les paramètres de la requête
      const params: GetPartnersParams = {
        index: pagination.page - 1, // L'API commence à 0
        size: pagination.rowsPerPage,
        data: {}
      };

      // Ajouter les filtres de recherche
      if (filters.search.trim()) {
        params.data!.name = filters.search.trim();
      }

      // Ajouter le filtre de statut
      if (filters.status === 'active') {
        params.data!.is_active = true;
      } else if (filters.status === 'inactive') {
        params.data!.is_active = false;
      }

      const result = await partnersService.getPartners(params);
      
      if (result.items) {
        // Corriger les URLs d'images
        result.items.forEach((partner) => {
          if (partner.logo_url) {
            partner.logo_url = fixImageUrl(partner.logo_url);
          }
        });
        
        setPartners(result.items);
        
        // Calculer les statistiques étendues
        const extendedStats = await calculatePartnerStats(result.items);
        setStats(extendedStats);
        
        // Mettre à jour la pagination
        setPagination(prev => ({
          ...prev,
          total: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / prev.rowsPerPage)
        }));
      } else {
        setPartners([]);
        setStats({
          totalPartners: 0,
          activePartners: 0,
          inactivePartners: 0,
          newPartners: 0,
          partnersWithProjects: 0,
          avgProjectsPerPartner: 0
        });
        setPagination(prev => ({
          ...prev,
          total: 0,
          totalPages: 0
        }));
      }
    } catch (err) {
      setError(`Erreur lors du chargement des partenaires: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, isAdmin, pagination.page, pagination.rowsPerPage, filters, fixImageUrl]);

  // Effet pour charger les données au démarrage et lors des changements de filtres/pagination
  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // Pagination effect pour la pagination côté client
  useEffect(() => {
    const startIndex = (pagination.page - 1) * pagination.rowsPerPage;
    const endIndex = startIndex + pagination.rowsPerPage;
    setPaginatedPartners(partners.slice(startIndex, endIndex));
  }, [partners, pagination.page, pagination.rowsPerPage]);

  // Calculer le nombre total de pages côté client
  const totalPages = Math.ceil(partners.length / pagination.rowsPerPage);

  // Fonction pour gérer les changements de page
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);


  // Fonction pour gérer les changements de filtres
  const handleFilterChange = useCallback((key: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Retourner à la première page
  }, []);

  // Handlers pour les callbacks des modals
  const handleModalSuccess = useCallback((message: string) => {
    showNotification(simpleNotificationHelpers.success('Succès', message));
  }, [showNotification]);

  const handleModalError = useCallback((message: string) => {
    showNotification(simpleNotificationHelpers.error('Erreur', message));
  }, [showNotification]);




  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Stats skeleton - 4 cartes pour les partenaires */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse flex-1 max-w-md"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-40"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <Shield className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
          Accès Administrateur Requis
        </h3>
        <p className="text-red-600 dark:text-red-400">
          Seuls les administrateurs peuvent accéder à la gestion des partenaires.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <div className="mb-4 text-red-500">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mx-auto"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
          Erreur de chargement
        </h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <div className="mt-4 flex gap-3 justify-center">
          {error.includes("connecté") ? (
            <Link href="/connexion">
              <Button
                color="primary"
                className="bg-gradient-to-r from-blue-500 to-blue-600"
              >
                Se connecter
              </Button>
            </Link>
          ) : (
            <Button
              color="primary"
              onPress={() => window.location.reload()}
            >
              Réessayer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-[#4ba9b7]/15 via-white to-[#6bb6c7]/8 p-8 shadow-lg dark:border-gray-700 dark:from-[#4ba9b7]/25 dark:via-gray-800 dark:to-[#6bb6c7]/15"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Partenaires
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Administration de votre réseau de partenaires
            </p>
          </div>

          {canCreate() && hasPermission(Permission.CREATE_PARTNERS) && (
            <Button
              color="primary"
              size="lg"
              startContent={<Plus className="h-5 w-5" />}
              onPress={() => setModalState({ isOpen: true, type: 'create', partner: null })}
              className="bg-gradient-to-r from-[#4ba9b7] to-[#6bb6c7] px-6 py-3 font-semibold shadow-lg"
            >
              Nouveau Partenaire
            </Button>
          )}
        </div>
      </motion.div>

      {/* Statistiques étendues */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        {[
          {
            title: "Total Partenaires",
            value: stats.totalPartners,
            icon: <UserCheck className="h-5 w-5" />,
            color: "bg-[#4ba9b7]",
            textColor: "text-[#4ba9b7]"
          },
          {
            title: "Partenaires Actifs",
            value: stats.activePartners, 
            icon: <UserCheck className="h-5 w-5" />,
            color: "bg-green-500",
            textColor: "text-green-600"
          },
          {
            title: "Partenaires Inactifs",
            value: stats.inactivePartners,
            icon: <UserX className="h-5 w-5" />,
            color: "bg-orange-500",
            textColor: "text-orange-600"
          },
          {
            title: "Nouveaux ce Mois", 
            value: stats.newPartners,
            icon: <Plus className="h-5 w-5" />,
            color: "bg-blue-500",
            textColor: "text-blue-600"
          },
          {
            title: "Avec Projets",
            value: stats.partnersWithProjects,
            icon: <Shield className="h-5 w-5" />,
            color: "bg-purple-500", 
            textColor: "text-purple-600"
          },
          {
            title: "Projets Moyens",
            value: stats.avgProjectsPerPartner,
            icon: <Calendar className="h-5 w-5" />,
            color: "bg-indigo-500",
            textColor: "text-indigo-600"
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold ${stat.textColor} dark:text-white`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3 text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filtres */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un partenaire..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              className="max-w-md"
              size="lg"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtres:</span>
            </div>
            <Select
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleFilterChange('status', value || "all");
              }}
              className="min-w-[130px]"
              size="sm"
              placeholder="Statut"
            >
              <SelectItem key="all" value="all">
                Tous
              </SelectItem>
              <SelectItem key="active" value="active">
                Actifs
              </SelectItem>
              <SelectItem key="inactive" value="inactive">
                Inactifs
              </SelectItem>
            </Select>
            
            <Button
              variant="light"
              startContent={<RefreshCw className="h-4 w-4" />}
              onPress={loadPartners}
              size="sm"
            >
              Actualiser
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Table des partenaires */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table 
          aria-label="Table des partenaires"
          selectionMode="none"
          className="w-full"
          classNames={{
            wrapper: "min-h-[400px] shadow-none border border-gray-200 dark:border-gray-700 w-full",
            table: "min-h-[200px] w-full table-fixed",
            th: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm",
            td: "py-4 px-3",
          }}
          bottomContent={
            partners.length > 0 ? (
              <div className="flex w-full justify-between items-center px-2 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Affichage de {((pagination.page - 1) * pagination.rowsPerPage) + 1} à {Math.min(pagination.page * pagination.rowsPerPage, partners.length)} sur {partners.length} partenaires
                </span>
                {partners.length > 10 && (
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={pagination.page}
                    total={totalPages}
                    onChange={handlePageChange}
                  />
                )}
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn key="partner" width="30%">PARTENAIRE</TableColumn>
            <TableColumn key="phone" width="20%">TÉLÉPHONE</TableColumn>
            <TableColumn key="status" width="15%">STATUT</TableColumn>
            <TableColumn key="created" width="15%">CRÉÉ LE</TableColumn>
            <TableColumn key="actions" width="20%">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody 
            items={paginatedPartners}
            emptyContent="Aucun partenaire trouvé"
          >
            {(partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {isValidImageUrl(partner.logo_url) && !imageErrors.has(partner.id.toString()) ? (
                      <div className="w-12 h-12 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img
                          src={fixImageUrl(partner.logo_url)!}
                          alt={`Logo ${partner.name}`}
                          className="w-full h-full object-contain"
                          onError={() => handleImageError(partner.id)}
                        />
                      </div>
                    ) : (
                      <Avatar
                        size="md"
                        name={partner.name.charAt(0)}
                        className="bg-blue-500 text-white"
                      />
                    )}
                    <div className="flex flex-col">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{partner.name}</p>
                      <p className="font-medium text-sm text-gray-600 dark:text-gray-400">{partner.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {partner.phone_formatted || partner.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    className="capitalize"
                    color={partner.is_active ? "success" : "warning"}
                    size="sm"
                    variant="flat"
                  >
                    {partner.is_active ? "Actif" : "Inactif"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {new Date(partner.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light" 
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Actions du partenaire">
                      <DropdownItem
                        key="edit"
                        startContent={<Edit className="h-4 w-4" />}
                        onPress={() => setModalState({
                          isOpen: true,
                          type: 'edit',
                          partner
                        })}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        startContent={<Trash2 className="h-4 w-4" />}
                        color="danger"
                        onPress={() => setModalState({
                          isOpen: true,
                          type: 'delete',
                          partner
                        })}
                      >
                        Supprimer
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Modals */}
      <PartnerModals
        isOpen={modalState.isOpen}
        type={modalState.type}
        partner={modalState.partner}
        onClose={() => setModalState({ isOpen: false, type: null, partner: null })}
        onRefresh={loadPartners}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />
      
    </div>
  );
};

export default TablePartner;