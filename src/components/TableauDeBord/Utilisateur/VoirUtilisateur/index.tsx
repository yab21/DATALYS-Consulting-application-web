"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Tab, Tabs, Spinner, Chip, Button, Avatar } from '@heroui/react';
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Calendar, Shield, Crown, Eye, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { UsersService, User } from '@/services/users';
import { projectsService, Project } from '@/services/projects';
import { extractBackendMessage } from '@/lib/error-handler';
import LoadingState from "@/components/UI/Loading/LoadingState";

interface VoirUtilisateurProps {
  id: string;
}

const VoirUtilisateur: React.FC<VoirUtilisateurProps> = ({ id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProjects, setLoadingProjects] = useState(false);

  const userId = parseInt(id);

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await UsersService.getUserById(userId);
      
      if (!userData) {
        setError('Utilisateur non trouvé');
        return;
      }

      setUser(userData);
    } catch (error) {
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!user || user.role_id !== 5) return; // Seulement pour les partenaires

    try {
      setLoadingProjects(true);
      if (user.partner_name) {
        const projectsData = await projectsService.getProjectsByPartner(user.partner_name);
        setProjects(projectsData);
      }
    } catch (error) {
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleTabChange = async (key: string) => {
    setActiveTab(key);
    
    if (key === 'projects' && projects.length === 0) {
      await loadProjects();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleLabel = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Administrateur';
      case 5: return 'Partenaire';
      default: return 'Utilisateur';
    }
  };

  const getRoleIcon = (roleId: number) => {
    switch (roleId) {
      case 1: return <Crown className="w-5 h-5" />;
      case 5: return <UserIcon className="w-5 h-5" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  const getRoleColor = (roleId: number): "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (roleId) {
      case 1: return 'primary';
      case 5: return 'secondary';
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement de l'utilisateur..." />
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
              onPress={loadUserData}
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

  if (!user) {
    return (
      <>
        <Breadcrumb pageName="Utilisateur introuvable" />
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600">Utilisateur introuvable</h3>
          <p className="text-gray-400 mt-2">L'utilisateur demandé n'existe pas ou vous n'y avez pas accès.</p>
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
      <Breadcrumb pageName={`Utilisateur: ${user.name}`} />
      
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton de retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push('/tableaudebord/gestion-utilisateurs')}
            className="font-medium"
          >
            Retour à la gestion des utilisateurs
          </Button>
        </div>

        {/* En-tête de l'utilisateur amélioré */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4ba9b7]/5 via-transparent to-blue-500/5 dark:from-[#4ba9b7]/10 dark:to-blue-500/10"></div>
          <CardHeader className="relative pb-8 pt-8 bg-gradient-to-r from-[#4ba9b7]/10 via-transparent to-blue-500/10 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col gap-8 w-full">
              {/* Header principal */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#4ba9b7] to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[#4ba9b7]/25">
                      <Avatar
                        size="lg"
                        name={user.name}
                        className="bg-gradient-to-br from-[#4ba9b7] to-[#6bb6c7] text-white font-bold text-xl"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                      {user.name}
                    </h1>
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Créé le {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip
                    color={getRoleColor(user.role_id)}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                    startContent={getRoleIcon(user.role_id)}
                  >
                    {getRoleLabel(user.role_id)}
                  </Chip>
                  <Chip
                    color={user.is_active ? "success" : "danger"}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                  >
                    {user.is_active ? "Actif" : "Inactif"}
                  </Chip>
                </div>
              </div>

              {/* Statistiques de l'utilisateur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rôle</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getRoleLabel(user.role_id)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user.is_active ? "Actif" : "Inactif"}
                      </p>
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
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Shield className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Rôle</p>
                          <Chip
                            color={getRoleColor(user.role_id)}
                            variant="flat"
                            size="sm"
                            startContent={getRoleIcon(user.role_id)}
                          >
                            {getRoleLabel(user.role_id)}
                          </Chip>
                        </div>
                      </div>
                      
                      {user.partner_name && (
                        <div className="flex items-start space-x-3">
                          <UserIcon className="text-gray-400 mt-1" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Partenaire</p>
                            <p className="font-medium">{user.partner_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Date de création</p>
                          <p className="font-medium">{formatDate(user.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Clock className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Dernière mise à jour</p>
                          <p className="font-medium">{formatDate(user.updated_at)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <UserIcon className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Statut</p>
                          <Chip
                            color={user.is_active ? "success" : "danger"}
                            variant="flat"
                            size="sm"
                          >
                            {user.is_active ? "Actif" : "Inactif"}
                          </Chip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab 
                key="permissions" 
                title={
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <span>Permissions</span>
                  </div>
                }
              >
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        {getRoleIcon(user.role_id)}
                        Permissions du rôle {getRoleLabel(user.role_id)}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {user.role_id === 1 ? (
                          // Permissions Administrateur
                          [
                            'Gestion complète des utilisateurs',
                            'Gestion des partenaires',
                            'Administration du système',
                            'Accès aux rapports et statistiques',
                            'Configuration des paramètres',
                            'Supervision de tous les projets'
                          ].map((permission, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">{permission}</span>
                            </div>
                          ))
                        ) : user.role_id === 5 ? (
                          // Permissions Partenaire
                          [
                            'Accès aux projets associés',
                            'Gestion des documents du partenaire',
                            'Consultation des dossiers',
                            'Création de tickets de support',
                            'Vue des incidents liés',
                            'Profil utilisateur'
                          ].map((permission, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">{permission}</span>
                            </div>
                          ))
                        ) : (
                          // Autres rôles
                          <div className="text-gray-500">Permissions non définies pour ce rôle</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              {user.role_id === 5 && (
                <Tab 
                  key="projects" 
                  title={
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5" />
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
                        <UserIcon className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500">Aucun projet associé à cet utilisateur</p>
                      </div>
                    )}
                  </div>
                </Tab>
              )}
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default VoirUtilisateur;