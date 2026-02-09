"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Avatar, 
  Button, 
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Tooltip
} from "@heroui/react";
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus,
  Crown,
  User,
  Settings,
  Mail,
  Calendar,
  Shield,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { projectPartnersService, ProjectPartner } from "@/services/projectPartners";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { isTokenExpiredError } from "@/lib/api-interceptor";

interface ProjectTeamProps {
  projectId: string;
  projectName: string;
}

const ProjectTeam: React.FC<ProjectTeamProps> = ({ projectId, projectName }) => {
  const { user, isAdmin } = useAuth();
  const [teamMembers, setTeamMembers] = useState<ProjectPartner[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ProjectPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("tous");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    partnerId: "",
    permissionType: "read" as "read" | "write" | "admin",
    message: ""
  });

  // Charger les membres de l'équipe
  useEffect(() => {
    loadTeamMembers();
  }, [projectId]);

  // Filtrer les membres
  useEffect(() => {
    let filtered = [...teamMembers];

    // Filtrage par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(member =>
        member.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.partner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par rôle/permission
    if (roleFilter !== "tous") {
      filtered = filtered.filter(member => member.permission_type === roleFilter);
    }

    setFilteredMembers(filtered);
  }, [teamMembers, searchTerm, roleFilter]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      
      if (user?.id) {
        const members = await projectPartnersService.getProjectPartners(
          parseInt(projectId), 
          user.id
        );
        setTeamMembers(members);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors du chargement de l\'équipe:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!newMember.partnerId) return;

    try {
      if (user?.id) {
        await projectPartnersService.addPartnerToProject(
          parseInt(newMember.partnerId),
          parseInt(projectId),
          newMember.permissionType,
          user.id
        );
        
        // Recharger la liste des membres
        await loadTeamMembers();
        
        // Réinitialiser le formulaire
        setNewMember({
          partnerId: "",
          permissionType: "read",
          message: ""
        });
        
        setIsInviteModalOpen(false);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de l\'ajout du membre:', error);
    }
  };

  const handleRemoveMember = async (permissionId: number) => {
    if (!user?.id) return;
    
    try {
      await projectPartnersService.removePartnerFromProject(permissionId, user.id);
      await loadTeamMembers();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la suppression du membre:', error);
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "admin": return "danger";
      case "write": return "warning";
      case "read": return "success";
      default: return "default";
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "admin": return <Crown className="w-4 h-4" />;
      case "write": return <Edit className="w-4 h-4" />;
      case "read": return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case "admin": return "Administrateur";
      case "write": return "Lecture/Écriture";
      case "read": return "Lecture seule";
      default: return permission;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingState type="skeleton" skeletonVariant="table" />;
  }

  // Calcul des statistiques
  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.is_active).length,
    admin: teamMembers.filter(m => m.permission_type === "admin").length,
    write: teamMembers.filter(m => m.permission_type === "write").length,
    read: teamMembers.filter(m => m.permission_type === "read").length
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 min-h-[600px] space-y-8">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Équipe du projet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des membres et des permissions pour le projet "{projectName}"
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={loadTeamMembers}
          >
            Actualiser
          </Button>
          {(isAdmin() || user?.id) && (
            <Button
              color="primary"
              startContent={<UserPlus className="w-4 h-4" />}
              onPress={() => setIsInviteModalOpen(true)}
              className="font-medium"
            >
              Ajouter un membre
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques de l'équipe */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          </CardBody>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Actifs</p>
          </CardBody>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.admin}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Admin</p>
          </CardBody>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.write}</p>
            <p className="text-sm text-orange-600 dark:text-orange-400">Écriture</p>
          </CardBody>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.read}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Lecture</p>
          </CardBody>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-white dark:bg-gray-800">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Rechercher un membre..."
              startContent={<Search className="w-4 h-4 text-gray-400" />}
             
              onValueChange={setSearchTerm}
              className="flex-1"
            />
            
            <Select
              placeholder="Permission"
              selectedKeys={[roleFilter]}
              onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="tous">Toutes permissions</SelectItem>
              <SelectItem key="admin">Administrateur</SelectItem>
              <SelectItem key="write">Lecture/Écriture</SelectItem>
              <SelectItem key="read">Lecture seule</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Table des membres */}
      <Card className="bg-white dark:bg-gray-800">
        <CardBody>
          <Table aria-label="Table des membres de l'équipe">
            <TableHeader>
              <TableColumn>MEMBRE</TableColumn>
              <TableColumn>PERMISSION</TableColumn>
              <TableColumn>AJOUTÉ LE</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun membre trouvé pour ce projet">
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.partner_name || member.user_name}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {member.partner_name || member.user_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.partner_email || member.user_email}
                        </p>
                        {member.role_in_project && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {member.role_in_project}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getPermissionColor(member.permission_type) as any}
                      size="sm"
                      variant="flat"
                      startContent={getPermissionIcon(member.permission_type)}
                    >
                      {getPermissionLabel(member.permission_type)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(member.assigned_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Tooltip content="Envoyer un message">
                        <Button
                          variant="light"
                          size="sm"
                          isIconOnly
                          startContent={<MessageSquare className="w-4 h-4" />}
                        />
                      </Tooltip>
                      
                      {(isAdmin() || user?.id === member.assigned_by) && (
                        <>
                          <Tooltip content="Modifier les permissions">
                            <Button
                              variant="light"
                              size="sm"
                              isIconOnly
                              startContent={<Edit className="w-4 h-4" />}
                            />
                          </Tooltip>
                          
                          <Tooltip content="Retirer du projet">
                            <Button
                              variant="light"
                              size="sm"
                              isIconOnly
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => handleRemoveMember(member.id)}
                            />
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal d'ajout de membre */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Ajouter un membre au projet</h3>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="ID du partenaire"
              placeholder="Entrez l'ID du partenaire à ajouter"
              type="number"
             
              onValueChange={(value) => setNewMember(prev => ({ ...prev, partnerId: value }))}
              isRequired
            />
            
            <Select
              label="Niveau de permission"
              selectedKeys={[newMember.permissionType]}
              onSelectionChange={(keys) => setNewMember(prev => ({ 
                ...prev, 
                permissionType: Array.from(keys)[0] as any 
              }))}
            >
              <SelectItem key="read" startContent={<Shield className="w-4 h-4" />}>
                Lecture seule (consultation uniquement)
              </SelectItem>
              <SelectItem key="write" startContent={<Edit className="w-4 h-4" />}>
                Lecture/Écriture (consultation et modification)
              </SelectItem>
              <SelectItem key="admin" startContent={<Crown className="w-4 h-4" />}>
                Administrateur (accès complet)
              </SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsInviteModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleInviteMember}
              isDisabled={!newMember.partnerId.trim()}
              startContent={<Plus className="w-4 h-4" />}
            >
              Ajouter au projet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectTeam;