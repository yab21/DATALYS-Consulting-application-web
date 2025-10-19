"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Divider,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { 
  Save, 
  X, 
  AlertTriangle,
  FolderOpen,
  Calendar,
  Users,
  Eye,
  Edit,
  FolderPlus,
} from "lucide-react";
import { projectsService, Project, CreateProjectFormData } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";

interface ProjectModalsProps {
  isOpen: boolean;
  type: 'edit' | 'delete' | 'view' | 'create' | null;
  project: Project | null;
  onClose: () => void;
  onRefresh: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface EditFormData {
  title: string;
  partner_id: number;
  is_active: boolean;
}

interface CreateFormData {
  title: string;
  partner_id: number;
  is_active: boolean;
}

const ProjectModals: React.FC<ProjectModalsProps> = ({
  isOpen,
  type,
  project,
  onClose,
  onRefresh,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  
  // États pour le formulaire de modification
  const [editForm, setEditForm] = useState<EditFormData>({
    title: '',
    partner_id: 0,
    is_active: true
  });
  
  // États pour le formulaire de création
  const [createForm, setCreateForm] = useState<CreateFormData>({
    title: '',
    partner_id: 0,
    is_active: true
  });
  
  const [editLoading, setEditLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [partners, setPartners] = useState<Array<{id: number, name: string}>>([]);

  // Charger la liste des partenaires
  useEffect(() => {
    const loadPartners = async () => {
      try {
        const partnersMap = await projectsService.getPartnersMap();
        const partnersList = Array.from(partnersMap.entries()).map(([id, name]) => ({
          id: parseInt(id),
          name
        }));
        setPartners(partnersList);
      } catch (error) {
        console.error('Erreur lors du chargement des partenaires:', error);
      }
    };

    if ((type === 'edit' || type === 'create') && isOpen) {
      loadPartners();
    }
  }, [type, isOpen]);

  // Initialiser le formulaire avec les données du projet
  useEffect(() => {
    if (project && type === 'edit') {
      setEditForm({
        title: project.title,
        partner_id: project.partner_id || 0,
        is_active: project.is_active
      });
    }
  }, [project, type]);

  // Réinitialiser le formulaire de création quand le modal s'ouvre
  useEffect(() => {
    if (type === 'create' && isOpen) {
      setCreateForm({
        title: '',
        partner_id: 0,
        is_active: true
      });
    }
  }, [type, isOpen]);

  // Gestion des changements dans le formulaire de modification
  const handleEditFormChange = (field: keyof EditFormData, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Gestion des changements dans le formulaire de création
  const handleCreateFormChange = (field: keyof CreateFormData, value: any) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour modifier un projet
  const handleEditSubmit = async () => {
    if (!project || !user) return;

    setEditLoading(true);
    try {
      const result = await projectsService.updateProject(
        project.id,
        editForm.title,
        editForm.title,
        '', // description vide
        editForm.partner_id,
        editForm.is_active,
        user.id,
        user.email
      );
      
      if (result) {
        onSuccess?.('Projet modifié avec succès');
        onRefresh();
        onClose();
      } else {
        onError?.('Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      
      let errorMessage = 'Erreur lors de la modification';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour supprimer un projet
  const handleDeleteSubmit = async () => {
    if (!project || !user) return;

    setDeleteLoading(true);
    try {
      const result = await projectsService.deleteProject(project.id, project.title, user.id, user.email);
      
      if (result) {
        onSuccess?.('Projet supprimé avec succès');
        onRefresh();
        onClose();
      } else {
        onError?.('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Validation du formulaire de modification
  const isEditFormValid = () => {
    return editForm.title.trim() && editForm.partner_id > 0;
  };

  // Validation du formulaire de création
  const isCreateFormValid = () => {
    return createForm.title.trim() && createForm.partner_id > 0;
  };

  // Fonction pour créer un projet
  const handleCreateSubmit = async () => {
    if (!user) return;

    setCreateLoading(true);
    try {
      const projectData: CreateProjectFormData = {
        title: createForm.title,
        partner_id: createForm.partner_id
      };
      
      const result = await projectsService.createProject(
        projectData,
        user.id,
        user.email
      );
      
      if (result) {
        onSuccess?.('Projet créé avec succès');
        onRefresh();
        onClose();
        // Réinitialiser le formulaire
        setCreateForm({
          title: '',
          partner_id: 0,
          is_active: true
        });
      } else {
        onError?.('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      
      let errorMessage = 'Erreur lors de la création';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  if (!project && type !== 'create') return null;

  // Modal de visualisation
  if (type === 'view' && project) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        scrollBehavior="inside"
        placement="center"
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[85vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg dark:border-gray-600">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{project.partner_name}</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <Card>
                <CardBody className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Titre du projet</p>
                        <p className="font-medium">{project.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Partenaire</p>
                        <p className="font-medium">{project.partner_name || 'Non assigné'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                        <Chip
                          color={project.is_active ? "success" : "warning"}
                          size="sm"
                          variant="flat"
                        >
                          {project.is_active ? "Actif" : "Inactif"}
                        </Chip>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Créé le</p>
                        <p className="font-medium">
                          {new Date(project.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dernière modification</p>
                      <p className="font-medium">
                        {new Date(project.updated_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de modification
  if (type === 'edit' && project) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        placement="center"
        isDismissable={!editLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[90vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <h3 className="text-xl font-bold">Modifier le projet</h3>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              {/* Informations du projet */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Informations du projet</h4>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Titre du projet"
                    placeholder="Ex: Migration Data Center, Sécurisation réseau entreprise"
                    value={editForm.title}
                    onValueChange={(value) => handleEditFormChange('title', value)}
                    startContent={<Edit className="h-4 w-4" />}
                    isRequired
                  />
                  
                  <Select
                    label="Partenaire"
                    placeholder="Sélectionner un partenaire"
                    selectedKeys={editForm.partner_id ? [editForm.partner_id.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedId = Array.from(keys)[0] as string;
                      if (selectedId) {
                        handleEditFormChange('partner_id', parseInt(selectedId));
                      }
                    }}
                    startContent={<Users className="h-4 w-4" />}
                    isRequired
                  >
                    {partners.map((partner) => (
                      <SelectItem key={partner.id.toString()} value={partner.id.toString()}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={editLoading}
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              onPress={handleEditSubmit}
              isLoading={editLoading}
              isDisabled={!isEditFormValid()}
              startContent={!editLoading ? <Save className="h-4 w-4" /> : undefined}
            >
              {editLoading ? 'Modification...' : 'Modifier'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de suppression
  if (type === 'delete' && project) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        placement="center"
        isDismissable={!deleteLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Supprimer le projet
                </h3>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Êtes-vous sûr de vouloir supprimer le projet <strong>{project.title}</strong> ?
              </p>
              
              <Card className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Attention
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Cette action est irréversible. Le projet sera définitivement supprimé 
                        ainsi que toutes ses données associées.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteSubmit}
              isLoading={deleteLoading}
              startContent={!deleteLoading ? <X className="h-4 w-4" /> : undefined}
            >
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de création
  if (type === 'create') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        placement="center"
        isDismissable={!createLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[90vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#4ba9b7]/10 p-2">
                <FolderPlus className="h-5 w-5 text-[#4ba9b7]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nouveau Projet</h3>
                <p className="text-sm text-gray-600">Créer un nouveau projet</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <Input
                label="Titre du projet"
                placeholder="Ex: Migration Data Center, Sécurisation réseau entreprise"
                value={createForm.title}
                onValueChange={(value) => handleCreateFormChange('title', value)}
                startContent={<Edit className="h-4 w-4" />}
                isRequired
                size="sm"
              />
              
              <Select
                label="Partenaire"
                placeholder="Sélectionner un partenaire"
                selectedKeys={createForm.partner_id ? [createForm.partner_id.toString()] : []}
                onSelectionChange={(keys) => {
                  const selectedId = Array.from(keys)[0] as string;
                  if (selectedId) {
                    handleCreateFormChange('partner_id', parseInt(selectedId));
                  }
                }}
                startContent={<Users className="h-4 w-4" />}
                isRequired
                size="sm"
              >
                {partners.map((partner) => (
                  <SelectItem key={partner.id.toString()} value={partner.id.toString()}>
                    {partner.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={createLoading}
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              onPress={handleCreateSubmit}
              isLoading={createLoading}
              isDisabled={!isCreateFormValid()}
              startContent={!createLoading ? <Save className="h-4 w-4" /> : undefined}
            >
              {createLoading ? 'Création...' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return null;
};

export default ProjectModals;