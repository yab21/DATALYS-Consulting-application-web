"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Tab, Tabs, Spinner, Chip, Button } from '@heroui/react';
import { ArrowLeft, User as UserIcon, Mail, Calendar, Crown, Eye, FileText, ArrowRight, ChevronDown, ChevronUp, ExternalLink, Info, Dot } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { UsersService, User } from '@/services/users';
import { projectsService, Project } from '@/services/projects';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import LoadingState from "@/components/UI/Loading/LoadingState";

interface VoirUtilisateurProps {
  id: string;
}

const MAX_DROPDOWN_ITEMS = 5;

const VoirUtilisateur: React.FC<VoirUtilisateurProps> = ({ id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const userId = parseInt(id);

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

  useEffect(() => { loadUserData(); }, [id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await UsersService.getUserById(userId);
      if (!userData) { setError('Utilisateur non trouvé'); return; }
      setUser(userData);
      loadProjectsForUser(userData);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setError(extractBackendMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsForUser = async (userData?: User) => {
    const currentUser = userData || user;
    if (!currentUser) return;
    try {
      setLoadingProjects(true);
      const allProjects = await projectsService.getActiveProjects();

      let userProjects: Project[];
      if (currentUser.role_id === 4) {
        // Partenaires : matcher par nom de société (user.name = nom du partenaire)
        const userName = currentUser.name.toLowerCase();
        userProjects = allProjects.filter((project) => {
          const projectPartnerName = (project as any).partner?.name || project.partner_name || '';
          return projectPartnerName.toLowerCase().includes(userName) ||
                 userName.includes(projectPartnerName.toLowerCase());
        });
      } else {
        // Admins et autres rôles : projets créés par cet utilisateur
        // created_by peut être string ou number dans l'API
        userProjects = allProjects.filter(
          (project) => Number((project as any).created_by) === currentUser.id
        );
      }

      setProjects(userProjects);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
    } finally {
      setLoadingProjects(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateShort = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const getRoleLabel = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Administrateur';
      case 5: return 'Partenaire';
      default: return 'Utilisateur';
    }
  };

  const getRoleColor = (roleId: number): "primary" | "secondary" | "warning" => {
    switch (roleId) {
      case 1: return 'primary';
      case 5: return 'secondary';
      default: return 'warning';
    }
  };

  // Dropdown
  const handleCardClick = (label: string) => setExpandedCard(prev => prev === label ? null : label);

  const renderDropdownContent = (label: string) => {
    if (!user) return null;
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
      default: return null;
    }
  };

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
            <UserIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erreur</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onPress={loadUserData} color="primary" variant="flat" size="sm">Réessayer</Button>
            <Button onPress={() => router.back()} variant="bordered" size="sm">Retour</Button>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Breadcrumb pageName="Utilisateur introuvable" />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Utilisateur introuvable</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">L&apos;utilisateur demandé n&apos;existe pas.</p>
          <Button onPress={() => router.back()} variant="flat" className="mt-6" size="sm">Retour</Button>
        </div>
      </>
    );
  }

  const statCards = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Projets",
      value: loadingProjects ? "..." : projects.length,
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderActive: "border-emerald-300 dark:border-emerald-700"
    }
  ];

  return (
    <>
      <Breadcrumb pageName={user.name} />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton retour */}
        <Button
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push('/tableaudebord/gestion-utilisateurs')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -ml-2"
        >
          Retour aux utilisateurs
        </Button>

        {/* Header utilisateur */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-[#4ba9b7] font-bold text-lg uppercase">
                  {user.name.slice(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                  {user.partner_name && (
                    <>
                      <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        {user.partner_name}
                      </span>
                    </>
                  )}
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateShort(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Chip color={getRoleColor(user.role_id)} variant="flat" size="sm" startContent={user.role_id === 1 ? <Crown className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}>
                {getRoleLabel(user.role_id)}
              </Chip>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                user.is_active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        {/* Stat cards avec dropdowns (partenaires uniquement) */}
        {statCards.length > 0 && (
        <div className="grid gap-4 grid-cols-1 max-w-md">
          {statCards.map((stat) => {
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
                        {stat.value === "..." ? (
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
                        {stat.label === "Projets" && projects.length > 0 && (
                          <div className="border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveTab('projects'); setExpandedCard(null); }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4ba9b7] hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                              Voir tout ({projects.length})
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
        )}

        {/* Onglets */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
            size="md"
            classNames={{
              tabList: "bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pt-2 gap-2",
              tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:border data-[selected=true]:border-gray-200 dark:data-[selected=true]:border-gray-600 data-[selected=true]:border-b-0 rounded-t-lg px-4 py-2.5 transition-colors",
              tabContent: "text-gray-500 dark:text-gray-400 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
            }}
          >
            {/* Vue d'ensemble */}
            <Tab
              key="overview"
              title={<div className="flex items-center gap-2"><Eye className="w-4 h-4" /><span>Vue d&apos;ensemble</span></div>}
            >
              <div className="p-6 sm:p-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#4ba9b7]" />
                      Informations de l&apos;utilisateur
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{user.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Rôle</dt>
                        <dd>
                          <Chip color={getRoleColor(user.role_id)} variant="flat" size="sm" startContent={user.role_id === 1 ? <Crown className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}>
                            {getRoleLabel(user.role_id)}
                          </Chip>
                        </dd>
                      </div>
                      {user.partner_name && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Partenaire</dt>
                          <dd className="text-sm font-semibold text-gray-900 dark:text-white">{user.partner_name}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date de création</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Dernière mise à jour</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.updated_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Statut</dt>
                        <dd>
                          <Chip color={user.is_active ? "success" : "danger"} variant="flat" size="sm">
                            {user.is_active ? "Actif" : "Inactif"}
                          </Chip>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            {/* Projets */}
            <Tab
              key="projects"
              title={<div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Projets ({projects.length})</span></div>}
            >
                <div className="p-6">
                  {loadingProjects ? (
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                  ) : projects.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-7 h-7 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aucun projet</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aucun projet associé à cet utilisateur</p>
                    </div>
                  )}
                </div>
              </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default VoirUtilisateur;
