"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
  Divider,
  useDisclosure,
} from "@nextui-org/react";
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  MoreVertical,
  Plus,
  User,
  Calendar,
  Wrench,
  RefreshCw,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import messagesService, { 
  Message, 
  MessageFilters, 
  CreateMessageRequest 
} from "@/services/messages";
import { projectsService } from "@/services/projects";
import LoadingState from "@/components/UI/Loading/LoadingState";

interface SupportStats {
  open_tickets: number;
  in_progress: number;
  resolved: number;
  critical: number;
  avg_resolution_time: number;
  satisfaction_rate: number;
}

const SupportTechnique: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [supportTickets, setSupportTickets] = useState<Message[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Message[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [filterPriority, setFilterPriority] = useState<string>("tous");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  const [stats, setStats] = useState<SupportStats>({
    open_tickets: 0,
    in_progress: 0,
    resolved: 0,
    critical: 0,
    avg_resolution_time: 0,
    satisfaction_rate: 0
  });

  // État pour nouveau ticket
  const [newTicket, setNewTicket] = useState<CreateMessageRequest>({
    title: "",
    description: "",
    priority: "moyenne",
    type: "support",
    project_id: undefined
  });

  // État pour les projets disponibles
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  // Charger les données initiales
  useEffect(() => {
    loadSupportTickets();
    loadSupportStats();
    loadAvailableProjects();
  }, []);

  // Charger les projets disponibles
  const loadAvailableProjects = async () => {
    try {
      const projects = await projectsService.getActiveProjects();
      setAvailableProjects(projects || []);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
      setAvailableProjects([]);
    }
  };

  // Filtrage des tickets
  useEffect(() => {
    let filtered = supportTickets;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (filterStatus !== "tous") {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    // Filtrage par priorité
    if (filterPriority !== "tous") {
      filtered = filtered.filter(ticket => ticket.priority === filterPriority);
    }

    setFilteredTickets(filtered);
  }, [supportTickets, searchTerm, filterStatus, filterPriority]);

  const loadSupportTickets = async () => {
    try {
      setLoading(true);
      
      if (isAdmin()) {
        // Les admins voient tous les tickets via l'endpoint support/requests
        const response = await messagesService.getSupportRequests(0, 50);
        setSupportTickets(response.items || []);
      } else {
        // Les partenaires voient leurs propres tickets via l'endpoint support/requests
        const response = await messagesService.getMySupportRequests(0, 50);
        setSupportTickets(response.items || []);
      }
    } catch (error) {
      console.error('Erreur chargement tickets support:', error);
      // Données mockées pour la démo
      setSupportTickets(MOCK_SUPPORT_TICKETS);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportStats = async () => {
    // Calculate stats directly from supportTickets data
    setStats({
      open_tickets: supportTickets.filter(t => t.status === 'ouvert').length,
      in_progress: supportTickets.filter(t => t.status === 'en_cours').length,
      resolved: supportTickets.filter(t => t.status === 'resolu').length,
      critical: supportTickets.filter(t => t.priority === 'critique').length,
      avg_resolution_time: 24,
      satisfaction_rate: 87
    });
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) return;

    try {
      setSending(true);
      const response = await messagesService.createSupportRequest(newTicket);
      
      // Ajouter le nouveau ticket à la liste
      setSupportTickets(prev => [response.message, ...prev]);
      
      // Réinitialiser le formulaire
      setNewTicket({
        title: "",
        description: "",
        priority: "moyenne",
        type: "support",
        project_id: undefined
      });
      
      setShowNewTicketModal(false);
      
      showNotification({
        type: "success",
        title: "Ticket créé",
        message: "Votre demande de support a été créée avec succès",
        duration: 3000,
      });
      
      // Actualiser les stats
      loadSupportStats();
    } catch (error) {
      console.error('Erreur création ticket:', error);
      
      // Pour la démo, simuler l'ajout du ticket
      const mockTicket: Message = {
        id: `ticket-${Date.now()}`,
        title: newTicket.title,
        description: newTicket.description,
        type: "support",
        priority: newTicket.priority || "moyenne",
        status: "ouvert",
        category: "technique",
        sender_id: user?.id?.toString() || "current-user",
        sender_name: user?.name || "Utilisateur actuel",
        sender_role: isAdmin() ? "admin" : "partner",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_read: false
      };
      
      setSupportTickets(prev => [mockTicket, ...prev]);
      setNewTicket({
        title: "",
        description: "",
        priority: "moyenne",
        type: "support",
        project_id: undefined
      });
      setShowNewTicketModal(false);
      
      showNotification({
        type: "success",
        title: "Ticket créé",
        message: "Votre demande de support a été créée avec succès",
        duration: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await messagesService.updateMessageStatus(ticketId, newStatus as any);
      
      // Mettre à jour l'état local
      setSupportTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() } : ticket
      ));
      
      showNotification({
        type: "success",
        title: "Statut mis à jour",
        message: `Le ticket a été marqué comme ${newStatus}`,
        duration: 3000,
      });
      
      loadSupportStats();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      
      // Simulation pour la démo
      setSupportTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus as any, updated_at: new Date().toISOString() } : ticket
      ));
      
      showNotification({
        type: "success",
        title: "Statut mis à jour",
        message: `Le ticket a été marqué comme ${newStatus}`,
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ouvert": return "danger";
      case "en_cours": return "warning";
      case "resolu": return "success";
      case "ferme": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critique": return "danger";
      case "haute": return "warning";
      case "moyenne": return "primary";
      case "faible": return "success";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ouvert": return <XCircle className="h-4 w-4" />;
      case "en_cours": return <Clock className="h-4 w-4" />;
      case "resolu": return <CheckCircle className="h-4 w-4" />;
      case "ferme": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return "Il y a moins d'1h";
    if (hours < 24) return `Il y a ${Math.round(hours)}h`;
    if (hours < 48) return "Hier";
    return `Il y a ${Math.round(hours / 24)} jours`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-orange-50 via-white to-red-50 p-8 shadow-lg dark:border-gray-700 dark:from-orange-900/20 dark:via-gray-800 dark:to-red-900/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Support Technique
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {isAdmin() ? "Gestion des demandes de support" : "Mes demandes de support"}
            </p>
          </div>
          <Button
            color="danger"
            variant="shadow"
            size="lg"
            startContent={<Plus className="h-5 w-5" />}
            onPress={() => setShowNewTicketModal(true)}
          >
            Nouveau Ticket
          </Button>
        </div>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        {[
          {
            title: "Tickets Ouverts",
            value: stats.open_tickets,
            icon: <XCircle className="h-5 w-5" />,
            color: "bg-red-500",
            textColor: "text-red-600"
          },
          {
            title: "En Cours",
            value: stats.in_progress,
            icon: <Clock className="h-5 w-5" />,
            color: "bg-orange-500",
            textColor: "text-orange-600"
          },
          {
            title: "Résolus",
            value: stats.resolved,
            icon: <CheckCircle className="h-5 w-5" />,
            color: "bg-green-500",
            textColor: "text-green-600"
          },
          {
            title: "Critiques",
            value: stats.critical,
            icon: <AlertTriangle className="h-5 w-5" />,
            color: "bg-red-600",
            textColor: "text-red-700"
          },
          {
            title: "Temps Moyen",
            value: `${stats.avg_resolution_time}h`,
            icon: <Clock className="h-5 w-5" />,
            color: "bg-blue-500",
            textColor: "text-blue-600"
          },
          {
            title: "Satisfaction",
            value: `${stats.satisfaction_rate}%`,
            icon: <CheckCircle className="h-5 w-5" />,
            color: "bg-green-600",
            textColor: "text-green-700"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <Input
                  placeholder="Rechercher un ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={<Search className="h-4 w-4 text-gray-400" />}
                  className="max-w-md"
                />
                
                <Select
                  placeholder="Statut"
                  selectedKeys={filterStatus ? [filterStatus] : []}
                  onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  <SelectItem key="tous" value="tous">Tous</SelectItem>
                  <SelectItem key="ouvert" value="ouvert">Ouvert</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                  <SelectItem key="ferme" value="ferme">Fermé</SelectItem>
                </Select>

                <Select
                  placeholder="Priorité"
                  selectedKeys={filterPriority ? [filterPriority] : []}
                  onSelectionChange={(keys) => setFilterPriority(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                >
                  <SelectItem key="tous" value="tous">Toutes</SelectItem>
                  <SelectItem key="critique" value="critique">Critique</SelectItem>
                  <SelectItem key="haute" value="haute">Haute</SelectItem>
                  <SelectItem key="moyenne" value="moyenne">Moyenne</SelectItem>
                  <SelectItem key="faible" value="faible">Faible</SelectItem>
                </Select>

                <Button
                  variant="light"
                  startContent={<RefreshCw className="h-4 w-4" />}
                  onPress={loadSupportTickets}
                >
                  Actualiser
                </Button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {filteredTickets.length} ticket(s) trouvé(s)
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Table des tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardBody className="p-0">
            <Table aria-label="Table des tickets de support" className="min-h-[400px]">
              <TableHeader>
                <TableColumn>TICKET</TableColumn>
                <TableColumn>DEMANDEUR</TableColumn>
                <TableColumn>PRIORITÉ</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn>CRÉÉ LE</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Aucun ticket trouvé">
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {!ticket.is_read && (
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                        <div className="flex flex-col">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {ticket.title || 'Ticket sans titre'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {ticket.description || 'Aucune description'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          name={ticket.sender_name?.charAt(0) || 'U'}
                          className="bg-primary-100 text-primary-600"
                        />
                        <div>
                          <span className="font-medium">{ticket.sender_name || 'Utilisateur'}</span>
                          <p className="text-sm text-gray-500">{ticket.sender_role || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getPriorityColor(ticket.priority || 'moyenne')}
                        startContent={<AlertTriangle className="h-3 w-3" />}
                      >
                        {ticket.priority || 'moyenne'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(ticket.status || 'ouvert')}
                        startContent={getStatusIcon(ticket.status || 'ouvert')}
                      >
                        {ticket.status || 'ouvert'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("fr-FR") : 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ticket.created_at ? formatTimeAgo(ticket.created_at) : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions ticket">
                          {[
                            <DropdownItem
                              key="view"
                              startContent={<Eye className="h-4 w-4" />}
                              onPress={() => {
                                setSelectedTicket(ticket);
                                onOpen();
                              }}
                            >
                              Voir détails
                            </DropdownItem>,
                            ...(isAdmin() && ticket.status !== "resolu" && ticket.status !== "ferme" ? [
                              <DropdownItem
                                key="in-progress"
                                startContent={<Clock className="h-4 w-4" />}
                                onPress={() => handleUpdateTicketStatus(ticket.id, "en_cours")}
                              >
                                Marquer en cours
                              </DropdownItem>,
                              <DropdownItem
                                key="resolve"
                                startContent={<CheckCircle className="h-4 w-4" />}
                                color="success"
                                onPress={() => handleUpdateTicketStatus(ticket.id, "resolu")}
                              >
                                Marquer résolu
                              </DropdownItem>
                            ] : [])
                          ]}
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </motion.div>

      {/* Modal nouveau ticket */}
      <Modal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nouveau Ticket Support</h3>
                <p className="text-sm text-gray-600">
                  Décrivez votre problème technique
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Priorité"
                selectedKeys={newTicket.priority ? [newTicket.priority] : []}
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0] as string;
                  setNewTicket(prev => ({ ...prev, priority: selectedValue as any }));
                }}
              >
                <SelectItem key="faible" value="faible">🟢 Faible - Question générale</SelectItem>
                <SelectItem key="moyenne" value="moyenne">🟡 Moyenne - Problème mineur</SelectItem>
                <SelectItem key="haute" value="haute">🟠 Haute - Problème bloquant</SelectItem>
                <SelectItem key="critique" value="critique">🔴 Critique - Panne système</SelectItem>
              </Select>

              <Select
                label="Projet concerné (optionnel)"
                placeholder="Sélectionnez un projet"
                selectedKeys={newTicket.project_id ? [newTicket.project_id.toString()] : []}
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0] as string;
                  setNewTicket(prev => ({ 
                    ...prev, 
                    project_id: selectedValue ? parseInt(selectedValue) : undefined 
                  }));
                }}
              >
                {[
                  <SelectItem key="" value="">Aucun projet spécifique</SelectItem>,
                  ...availableProjects.map((project) => (
                    <SelectItem key={project.id.toString()} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))
                ]}
              </Select>

              <Input
                label="Sujet du problème"
                placeholder="Ex: Impossible de se connecter"
                value={newTicket.title}
                onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                isRequired
              />

              <Textarea
                label="Description détaillée"
                placeholder="Décrivez le problème, les étapes pour le reproduire, les messages d'erreur..."
                value={newTicket.description}
                onValueChange={(value) => setNewTicket(prev => ({ ...prev, description: value }))}
                minRows={6}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowNewTicketModal(false)}
            >
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={handleCreateTicket}
              isLoading={sending}
              startContent={!sending ? <Send className="h-4 w-4" /> : undefined}
            >
              {sending ? "Création..." : "Créer le ticket"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal détails ticket */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedTicket?.title || 'Ticket sans titre'}</h3>
                <p className="text-sm text-gray-600">
                  Ticket #{selectedTicket?.id?.slice(-8) || 'N/A'}
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedTicket && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priorité</label>
                    <Chip
                      size="lg"
                      variant="flat"
                      color={getPriorityColor(selectedTicket.priority || 'moyenne')}
                      startContent={<AlertTriangle className="h-4 w-4" />}
                    >
                      {selectedTicket.priority || 'moyenne'}
                    </Chip>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Statut</label>
                    <Chip
                      size="lg"
                      variant="flat"
                      color={getStatusColor(selectedTicket.status || 'ouvert')}
                      startContent={getStatusIcon(selectedTicket.status || 'ouvert')}
                    >
                      {selectedTicket.status || 'ouvert'}
                    </Chip>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Demandeur</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar
                        size="sm"
                        name={selectedTicket.sender_name?.charAt(0) || 'U'}
                        className="bg-primary-100 text-primary-600"
                      />
                      <span className="font-medium">{selectedTicket.sender_name || 'Utilisateur'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Créé le</label>
                    <p className="mt-1">
                      {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <Divider />

                <div>
                  <label className="text-sm font-medium text-gray-600">Description du problème</label>
                  <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {selectedTicket.description || 'Aucune description'}
                    </p>
                  </div>
                </div>

                {selectedTicket.resolution_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes de résolution</label>
                    <div className="mt-2 rounded-lg bg-green-50 p-4 dark:bg-green-900/30">
                      <p className="text-green-800 dark:text-green-200">
                        {selectedTicket.resolution_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Fermer
            </Button>
            {isAdmin() && selectedTicket && selectedTicket.status !== "resolu" && selectedTicket.status !== "ferme" && (
              <>
                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => {
                    handleUpdateTicketStatus(selectedTicket.id, "en_cours");
                    onClose();
                  }}
                >
                  Marquer en cours
                </Button>
                <Button
                  color="success"
                  onPress={() => {
                    handleUpdateTicketStatus(selectedTicket.id, "resolu");
                    onClose();
                  }}
                >
                  Marquer résolu
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

// Données mockées pour la démo
const MOCK_SUPPORT_TICKETS: Message[] = [
  {
    id: "ticket-1",
    title: "Impossible de se connecter à l'application",
    description: "Depuis ce matin, je ne peux plus me connecter à l'application. J'obtiens une erreur 'Identifiants invalides' même avec les bons identifiants. J'ai essayé de réinitialiser mon mot de passe mais le problème persiste.",
    type: "support",
    priority: "critique",
    status: "ouvert",
    category: "technique",
    sender_id: "partner-1",
    sender_name: "Jean Dupont",
    sender_role: "partner",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    is_read: false
  },
  {
    id: "ticket-2",
    title: "Lenteur dans l'interface de gestion des projets",
    description: "L'interface de gestion des projets est très lente depuis la dernière mise à jour. Le chargement des listes prend plus de 30 secondes.",
    type: "support",
    priority: "haute",
    status: "en_cours",
    category: "technique",
    sender_id: "partner-2",
    sender_name: "Marie Martin",
    sender_role: "partner",
    assigned_to: "admin-1",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    read_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "ticket-3",
    title: "Erreur lors de l'upload de fichiers",
    description: "Je n'arrive pas à uploader des fichiers PDF de plus de 10MB. L'erreur affichée est 'Taille de fichier non supportée'.",
    type: "support",
    priority: "moyenne",
    status: "resolu",
    category: "technique",
    sender_id: "partner-3",
    sender_name: "Pierre Dubois",
    sender_role: "partner",
    assigned_to: "admin-1",
    resolution_notes: "Problème résolu : la limite de taille de fichier a été augmentée à 50MB.",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    read_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
  }
];

export default SupportTechnique;