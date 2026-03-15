"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tab, Tabs, Spinner, Chip, Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { ArrowLeft, ArrowRight, Building, Mail, Phone, MapPin, Calendar, FileText, Folder as FolderIcon, Eye, AlertTriangle, Headphones, Search, Grid, List, ArrowDown, ArrowUp, HardDrive, Image, Video, Music, Archive, Code, FileSpreadsheet, Presentation, MoreVertical, Trash2, ChevronDown, ChevronUp, ExternalLink, Info, Dot } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { partnersService, Partner } from '@/services/partners';
import { projectsService, Project } from '@/services/projects';
import { filesService, ProjectFile } from '@/services/files';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import LoadingState from "@/components/UI/Loading/LoadingState";
import { PartnerStatsService, PartnerStats, PartnerIncident } from '@/services/partnerStats';
import { useSimpleNotifications } from '@/components/UI/Notifications/SimpleNotificationSystem';
import { useAuth } from '@/context/AuthContext';
import ProjectFileManager from '@/components/TableauDeBord/Projet/VoirProjet/ProjectFileManager';

interface VoirPartenaireProps {
  id: string;
}

const MAX_DROPDOWN_ITEMS = 5;

const VoirPartenaire: React.FC<VoirPartenaireProps> = ({ id }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [stats, setStats] = useState<PartnerStats>({
    projectsCount: 0,
    incidentsCount: 0,
    supportTicketsCount: 0,
    incidentsList: [],
    supportTicketsList: []
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Dropdown stat cards
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Gestionnaire de fichiers
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal suppression
  const { isOpen: isDeleteFileModalOpen, onOpen: onDeleteFileModalOpen, onClose: onDeleteFileModalClose } = useDisclosure();
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const partnerId = parseInt(id);

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

  // Icône de fichier
  const getFileIconComponent = (fileName: string): React.ReactElement => {
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) return <Image className="w-6 h-6 text-green-500" />;
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) return <Video className="w-6 h-6 text-purple-500" />;
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) return <Music className="w-6 h-6 text-pink-500" />;
    if (extension === 'pdf') return <FileText className="w-6 h-6 text-red-500" />;
    if (['doc', 'docx'].includes(extension)) return <FileText className="w-6 h-6 text-blue-600" />;
    if (['xls', 'xlsx', 'csv'].includes(extension)) return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    if (['ppt', 'pptx'].includes(extension)) return <Presentation className="w-6 h-6 text-orange-500" />;
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php'].includes(extension)) return <Code className="w-6 h-6 text-cyan-500" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return <Archive className="w-6 h-6 text-amber-500" />;
    return <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />;
  };

  // Corriger URL image
  const fixImageUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url || url.trim() === '') return undefined;
    const cleanUrl = url.trim();
    try {
      const urlObj = new URL(cleanUrl, 'https://placeholder.local');
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'example.com' || hostname === 'test.com' || hostname.includes('placeholder')) return undefined;
    } catch { /* URL relative */ }
    if (!/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanUrl)) return undefined;
    if (cleanUrl.includes('/files/serve/')) {
      if (cleanUrl.startsWith('https://applicationweb.datalysconsulting.com/files/serve/')) return cleanUrl;
      if (cleanUrl.startsWith('/files/serve/')) return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
      if (cleanUrl.includes('82.112.253.137:8082')) return cleanUrl.replace('http://82.112.253.137:8082', 'https://applicationweb.datalysconsulting.com');
      if (cleanUrl.includes('/api/files/serve/')) return cleanUrl.replace('/api/files/serve/', '/files/serve/');
    }
    if (cleanUrl.includes('localhost:8081') || cleanUrl.includes('82.112.253.137:8081')) {
      const pathMatch = cleanUrl.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${pathMatch[1]}`;
    }
    if (cleanUrl.startsWith('/uploads/logos/')) return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}${cleanUrl}`;
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('/uploads/') && !cleanUrl.startsWith('/files/serve/')) return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
    if (cleanUrl.startsWith('http://')) return cleanUrl.replace('http://', 'https://');
    return cleanUrl;
  }, []);

  // Chargement initial
  useEffect(() => { loadPartnerData(); }, [id]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);
      setLogoError(false);
      const partnerData = await partnersService.getPartnerById(partnerId);
      if (!partnerData) { setError('Partenaire non trouvé'); return; }
      setPartner(partnerData);
      loadPartnerStats(partnerData);
      // Charger les projets au montage pour les dropdowns
      loadProjectsForPartner(partnerData);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setError(extractBackendMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerStats = async (partnerData?: Partner) => {
    const currentPartner = partnerData || partner;
    if (!currentPartner) return;
    try {
      setLoadingStats(true);
      const statistics = await PartnerStatsService.getPartnerStatsWithCache(currentPartner.id, currentPartner.name);
      setStats(statistics);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadProjectsForPartner = async (partnerData?: Partner) => {
    const currentPartner = partnerData || partner;
    if (!currentPartner) return;
    try {
      setLoadingProjects(true);
      const allProjects = await projectsService.getActiveProjects();
      const partnerProjects = allProjects.filter(
        (project) => Number(project.partner_id) === Number(currentPartner.id)
      );
      setProjects(partnerProjects);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
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
        const projectFiles = await filesService.getFilesByCriteria(0, 100, { project_id: project.id });
        allFiles.push(...projectFiles);
      }
      setFiles(allFiles);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setError(extractBackendMessage(error));
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleTabChange = async (key: string) => {
    setActiveTab(key);
    if (key === 'documents' && files.length === 0 && projects.length > 0) await loadFiles();
  };

  const fixFileUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url) return undefined;
    let fixedUrl = url;
    if (fixedUrl.includes('/api/files/serve/')) fixedUrl = fixedUrl.replace('/api/files/serve/', '/files/serve/');
    if (fixedUrl.startsWith('/files/serve/')) fixedUrl = `https://applicationweb.datalysconsulting.com${fixedUrl}`;
    if (fixedUrl.includes('82.112.253.137:8082')) fixedUrl = fixedUrl.replace('http://82.112.253.137:8082', 'https://applicationweb.datalysconsulting.com');
    return fixedUrl;
  }, []);

  const handlePreviewFile = useCallback((file: ProjectFile) => {
    if (file.file_url) {
      const correctedUrl = fixFileUrl(file.file_url);
      if (correctedUrl) { window.open(correctedUrl, '_blank'); }
      else { showNotification({ title: 'Erreur', message: 'URL du fichier invalide', type: 'error' }); }
    } else {
      showNotification({ title: 'Erreur', message: 'URL du fichier non disponible', type: 'error' });
    }
  }, [showNotification, fixFileUrl]);

  const openDeleteFileModal = useCallback((file: ProjectFile) => {
    setFileToDelete(file);
    onDeleteFileModalOpen();
  }, [onDeleteFileModalOpen]);

  const confirmDeleteFile = useCallback(async () => {
    if (!fileToDelete || !user) return;
    try {
      setIsDeleting(true);
      await filesService.deleteFile(fileToDelete.id, user.id);
      showNotification({ title: 'Succès', message: `Fichier "${fileToDelete.name}" supprimé`, type: 'success' });
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      onDeleteFileModalClose();
      setFileToDelete(null);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      showNotification({ title: 'Erreur', message: extractBackendMessage(error), type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }, [fileToDelete, user, showNotification, onDeleteFileModalClose]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateShort = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;
    if (searchTerm.trim()) {
      filtered = files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'date': comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); break;
        case 'size': comparison = (a.size || 0) - (b.size || 0); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return filtered;
  }, [files, searchTerm, sortBy, sortOrder]);

  const fileStats = useMemo(() => ({
    totalFiles: files.length,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0)
  }), [files]);

  // Dropdown handlers
  const handleCardClick = (label: string) => setExpandedCard(prev => prev === label ? null : label);

  const handleViewAll = (label: string) => {
    switch (label) {
      case "Projets": setActiveTab('projects'); setExpandedCard(null); break;
      case "Incidents": router.push('/tableaudebord/incidents'); break;
      case "Support": router.push('/tableaudebord/support'); break;
    }
  };

  const renderDropdownContent = (label: string) => {
    switch (label) {
      case "Projets": {
        if (loadingProjects) return <div className="flex justify-center py-3"><Spinner size="sm" /></div>;
        const items = projects.slice(0, MAX_DROPDOWN_ITEMS);
        if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun projet</p>;
        return items.map(project => (
          <button
            key={project.id}
            onClick={(e) => { e.stopPropagation(); router.push(`/tableaudebord/projet/pageprojet/${project.id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <FileText className="w-4 h-4 text-[#4ba9b7] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{project.title}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{formatDateShort(project.created_at)}</span>
            </div>
            <Chip size="sm" color={project.is_active ? "success" : "warning"} variant="flat" className="h-5 text-[10px] flex-shrink-0">
              {project.is_active ? "Actif" : "Inactif"}
            </Chip>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ));
      }
      case "Incidents": {
        if (loadingStats) return <div className="flex justify-center py-3"><Spinner size="sm" /></div>;
        const incidentItems = stats.incidentsList.slice(0, MAX_DROPDOWN_ITEMS);
        if (incidentItems.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun incident</p>;
        return incidentItems.map((incident: PartnerIncident) => (
          <button
            key={incident.id}
            onClick={(e) => { e.stopPropagation(); router.push(`/tableaudebord/incidents/${incident.id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{incident.title}</span>
              <div className="flex items-center gap-1.5 mt-1">
                {incident.priority && (
                  <Chip size="sm" color={['P0','P1'].includes(incident.priority) ? 'danger' : incident.priority === 'P2' ? 'warning' : 'primary'} variant="flat" className="h-5 text-[10px]">
                    {incident.priority}
                  </Chip>
                )}
                {incident.status && (
                  <Chip size="sm" variant="flat" className="h-5 text-[10px]">
                    {incident.status}
                  </Chip>
                )}
              </div>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ));
      }
      case "Support": {
        if (loadingStats) return <div className="flex justify-center py-3"><Spinner size="sm" /></div>;
        const supportItems = stats.supportTicketsList.slice(0, MAX_DROPDOWN_ITEMS);
        if (supportItems.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 px-4 py-3">Aucun ticket de support</p>;
        return supportItems.map((ticket: PartnerIncident) => (
          <button
            key={ticket.id}
            onClick={(e) => { e.stopPropagation(); router.push(`/tableaudebord/support/${ticket.id}`); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group/item"
          >
            <Headphones className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{ticket.title}</span>
              {ticket.status && (
                <Chip size="sm" variant="flat" className="h-5 text-[10px] mt-1">
                  {ticket.status}
                </Chip>
              )}
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        ));
      }
      default: return null;
    }
  };

  const statisticsCards = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Projets",
      value: loadingStats ? "..." : stats.projectsCount,
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderActive: "border-blue-300 dark:border-blue-700"
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Incidents",
      value: loadingStats ? "..." : stats.incidentsCount,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderActive: "border-orange-300 dark:border-orange-700"
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      label: "Support",
      value: loadingStats ? "..." : stats.supportTicketsCount,
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderActive: "border-emerald-300 dark:border-emerald-700"
    }
  ];

  // --- RENDER ---

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement..." />
        <LoadingState type="skeleton" skeletonVariant="profile" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumb pageName="Erreur" />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erreur</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onPress={loadPartnerData} color="primary" variant="flat" size="sm">Réessayer</Button>
            <Button onPress={() => router.back()} variant="bordered" size="sm">Retour</Button>
          </div>
        </div>
      </>
    );
  }

  if (!partner) {
    return (
      <>
        <Breadcrumb pageName="Partenaire introuvable" />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Partenaire introuvable</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Le partenaire demandé n&apos;existe pas.</p>
          <Button onPress={() => router.back()} variant="flat" className="mt-6" size="sm">Retour</Button>
        </div>
      </>
    );
  }

  const fixedLogoUrl = fixImageUrl(partner.logo_url);
  const shouldShowLogo = fixedLogoUrl && !logoError;

  return (
    <>
      <Breadcrumb pageName={partner.name} />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton retour */}
        <Button
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push('/tableaudebord/partenaire/liste')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -ml-2"
        >
          Retour aux partenaires
        </Button>

        {/* Header partenaire */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="flex-shrink-0">
                {shouldShowLogo ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img
                      src={fixedLogoUrl}
                      alt={`Logo ${partner.name}`}
                      className="w-full h-full object-cover"
                      onError={() => setLogoError(true)}
                      onLoad={() => setLogoError(false)}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-xl flex items-center justify-center">
                    <span className="text-[#4ba9b7] font-bold text-lg uppercase">
                      {partner.name.slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {partner.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {partner.email}
                  </span>
                  {partner.phone && (
                    <>
                      <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {partner.phone}
                      </span>
                    </>
                  )}
                  {partner.address && (
                    <>
                      <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {partner.address}
                      </span>
                    </>
                  )}
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateShort(partner.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              partner.is_active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${partner.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {partner.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Stat cards avec dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statisticsCards.map((stat) => {
            const isExpanded = expandedCard === stat.label;
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
                        {loadingStats ? (
                          <div className="w-8 h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        ) : stat.value}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{stat.label}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      }
                    </div>
                  </div>
                </div>

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
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewAll(stat.label); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4ba9b7] hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            Voir tout
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Onglets */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => handleTabChange(key as string)}
            className="w-full"
            size="md"
            classNames={{
              tabList: "bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pt-2 gap-2",
              tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:border data-[selected=true]:border-gray-200 dark:data-[selected=true]:border-gray-600 data-[selected=true]:border-b-0 rounded-t-lg px-4 py-2.5 transition-colors",
              tabContent: "text-gray-500 dark:text-gray-400 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
            }}
          >
            {/* Onglet Vue d'ensemble */}
            <Tab
              key="overview"
              title={<div className="flex items-center gap-2"><Eye className="w-4 h-4" /><span>Vue d&apos;ensemble</span></div>}
            >
              <div className="p-6 sm:p-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#4ba9b7]" />
                      Informations du partenaire
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{partner.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Téléphone</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{partner.phone || 'Non renseigné'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Adresse</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{partner.address || 'Non renseignée'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date de création</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(partner.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Statut</dt>
                        <dd>
                          <Chip color={partner.is_active ? "success" : "danger"} variant="flat" size="sm">
                            {partner.is_active ? "Actif" : "Inactif"}
                          </Chip>
                        </dd>
                      </div>
                      {shouldShowLogo && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Logo</dt>
                          <dd>
                            <img
                              src={fixedLogoUrl}
                              alt={`Logo ${partner.name}`}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                              onError={() => setLogoError(true)}
                            />
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            {/* Onglet Projets */}
            <Tab
              key="projects"
              title={<div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Projets ({projects.length})</span></div>}
            >
              <div className="p-6">
                {loadingProjects ? (
                  <div className="flex justify-center py-8"><Spinner size="md" /></div>
                ) : projects.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{projects.length} projet{projects.length > 1 ? 's' : ''}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {projects.filter(p => p.is_active).length} actif{projects.filter(p => p.is_active).length > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {projects.filter(p => !p.is_active).length} inactif{projects.filter(p => !p.is_active).length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map(project => (
                        <div
                          key={project.id}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer group"
                          onClick={() => router.push(`/tableaudebord/projet/pageprojet/${project.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#4ba9b7]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-[#4ba9b7] transition-colors">
                                  {project.title}
                                </h4>
                                <Chip color={project.is_active ? "success" : "warning"} variant="flat" size="sm" className="flex-shrink-0 text-[10px]">
                                  {project.is_active ? "Actif" : "Inactif"}
                                </Chip>
                              </div>
                              {project.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDateShort(project.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aucun projet</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aucun projet associé à ce partenaire</p>
                  </div>
                )}
              </div>
            </Tab>

            {/* Onglet Documents */}
            <Tab
              key="documents"
              title={<div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Documents ({files.length})</span></div>}
            >
              <div className="p-6">
                {loadingFiles ? (
                  <div className="flex justify-center py-8"><Spinner size="md" /></div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {fileStats.totalFiles} fichier{fileStats.totalFiles !== 1 ? 's' : ''}
                      </span>
                      {fileStats.totalSize > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" />
                          {formatFileSize(fileStats.totalSize)}
                        </span>
                      )}
                    </div>

                    {/* Barre d'outils */}
                    <div className="flex items-center justify-between gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-1 max-w-sm">
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                          startContent={<Search className="w-4 h-4 text-gray-400" />}
                          size="sm"
                          classNames={{
                            input: "bg-transparent",
                            inputWrapper: "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tooltip content="Grille"><Button size="sm" variant={viewMode === 'grid' ? 'solid' : 'flat'} isIconOnly onPress={() => setViewMode('grid')}><Grid className="w-4 h-4" /></Button></Tooltip>
                        <Tooltip content="Liste"><Button size="sm" variant={viewMode === 'list' ? 'solid' : 'flat'} isIconOnly onPress={() => setViewMode('list')}><List className="w-4 h-4" /></Button></Tooltip>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button size="sm" variant="flat" endContent={<ArrowDown className="w-3 h-3" />}>Trier</Button>
                          </DropdownTrigger>
                          <DropdownMenu selectedKeys={[sortBy]} onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as any)} selectionMode="single">
                            <DropdownItem key="name">Nom</DropdownItem>
                            <DropdownItem key="date">Date</DropdownItem>
                            <DropdownItem key="size">Taille</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                        <Button size="sm" variant="flat" isIconOnly onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                          {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {filteredAndSortedFiles.length > 0 ? (
                      <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        : "space-y-2"
                      }>
                        {filteredAndSortedFiles.map(file => (
                          viewMode === 'grid' ? (
                            <div key={file.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group relative">
                              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-md shadow-md p-0.5 border border-gray-200 dark:border-gray-600">
                                  <button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" onClick={(e) => { e.stopPropagation(); handlePreviewFile(file); }} title="Voir">
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" onClick={(e) => { e.stopPropagation(); openDeleteFileModal(file); }} title="Supprimer">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-center" onClick={() => handlePreviewFile(file)}>
                                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                  {getFileIconComponent(file.name)}
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">{file.name}</h4>
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                  {(file.extension || file.size > 0) && (
                                    <p>{file.extension?.toUpperCase()}{file.extension && file.size > 0 && ' · '}{file.size > 0 && formatFileSize(file.size)}</p>
                                  )}
                                  <p>{formatDateShort(file.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={file.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-sm transition-all cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg" onClick={() => handlePreviewFile(file)}>
                                  {getFileIconComponent(file.name)}
                                </div>
                                <div className="flex-1 min-w-0" onClick={() => handlePreviewFile(file)}>
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{file.name}</h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    {file.extension && <span>{file.extension.toUpperCase()}</span>}
                                    {file.size > 0 && <span>{formatFileSize(file.size)}</span>}
                                    <span>{formatDateShort(file.created_at)}</span>
                                  </div>
                                </div>
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button size="sm" variant="light" isIconOnly className="text-gray-400"><MoreVertical className="w-4 h-4" /></Button>
                                  </DropdownTrigger>
                                  <DropdownMenu>
                                    <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={() => handlePreviewFile(file)}>Voir</DropdownItem>
                                    <DropdownItem key="delete" startContent={<Trash2 className="w-4 h-4" />} className="text-danger" color="danger" onPress={() => openDeleteFileModal(file)}>Supprimer</DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-7 h-7 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {searchTerm ? 'Aucun résultat' : 'Aucun document'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {searchTerm ? `Aucun fichier ne correspond à "${searchTerm}"` : 'Aucun document trouvé'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tab>

            {/* Onglet Dossiers */}
            <Tab
              key="folders"
              title={<div className="flex items-center gap-2"><FolderIcon className="w-4 h-4" /><span>Dossiers</span></div>}
            >
              <div className="p-6">
                {loadingProjects ? (
                  <div className="flex justify-center py-8"><Spinner size="md" /></div>
                ) : projects.length > 0 ? (
                  <>
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Sélectionnez un projet
                      </label>
                      <div className="max-w-md">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button variant="bordered" className="w-full justify-between text-left" endContent={<ArrowDown className="w-4 h-4 text-gray-400" />}>
                              {selectedProjectId
                                ? projects.find(p => String(p.id) === selectedProjectId)?.title || 'Projet sélectionné'
                                : 'Choisir un projet...'}
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            selectionMode="single"
                            selectedKeys={selectedProjectId ? [selectedProjectId] : []}
                            onSelectionChange={(keys) => setSelectedProjectId(Array.from(keys)[0] as string || null)}
                          >
                            {projects.map(project => (
                              <DropdownItem key={String(project.id)} textValue={project.title}>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#4ba9b7]" />
                                  <span>{project.title}</span>
                                  <Chip size="sm" color={project.is_active ? "success" : "warning"} variant="flat" className="ml-auto text-[10px]">
                                    {project.is_active ? "Actif" : "Inactif"}
                                  </Chip>
                                </div>
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>

                    {selectedProjectId ? (
                      <ProjectFileManager
                        key={selectedProjectId}
                        projectId={selectedProjectId}
                        projectName={projects.find(p => String(p.id) === selectedProjectId)?.title || ''}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FolderIcon className="w-7 h-7 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sélectionnez un projet</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choisissez un projet pour accéder à ses dossiers</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FolderIcon className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aucun projet</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aucun projet associé à ce partenaire</p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Modal suppression fichier */}
      <Modal isOpen={isDeleteFileModalOpen} onClose={onDeleteFileModalClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <span>Supprimer le fichier</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Cette action est irréversible. Le fichier sera définitivement supprimé.
                </p>
              </div>
              {fileToDelete && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Fichier :</strong> {fileToDelete.name}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDeleteFileModalClose} isDisabled={isDeleting}>Annuler</Button>
            <Button color="danger" onPress={confirmDeleteFile} isLoading={isDeleting}>Supprimer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VoirPartenaire;
