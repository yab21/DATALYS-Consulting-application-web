"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
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
} from "@heroui/react";
import { motion } from "framer-motion";
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  RefreshCw,
  Plus,
  Headphones
} from "lucide-react";
import { useRouter } from 'next/navigation';

import { IncidentsService, type Incident, type IncidentCriteria } from "@/services/incidents";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpiredError } from "@/lib/api-interceptor";

const GestionSupport: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { user } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const router = useRouter();

  // Chargement des données
  useEffect(() => {
    loadData();
  }, []);

  // Filtrage des incidents
  useEffect(() => {
    filterIncidents();
  }, [incidents, searchTerm, filterStatus, filterPriority]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const criteria: IncidentCriteria = {
        index: 0,
        size: 100,
        data: {
          type: 'support' // Filtrer pour les tickets de support
        }
      };

      const response = await IncidentsService.getIncidentsByCriteria(criteria);
      let apiIncidents: Incident[] = [];

      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          apiIncidents = response;
        } else if (response.data && Array.isArray(response.data)) {
          apiIncidents = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          apiIncidents = response.items;
        }
      }

      console.log('📊 Tickets support chargés:', apiIncidents.length);
      setIncidents(apiIncidents);
      
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors du chargement des tickets support:', error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur de chargement",
        "Impossible de charger les tickets de support"
      ));
    } finally {
      setLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = [...incidents];

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.title?.toLowerCase().includes(term) ||
        incident.description?.toLowerCase().includes(term) ||
        incident.incident_number?.toLowerCase().includes(term)
      );
    }

    // Filtrage par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter(incident => incident.status === filterStatus);
    }

    // Filtrage par priorité
    if (filterPriority !== "all") {
      filtered = filtered.filter(incident => incident.priority === filterPriority);
    }

    setFilteredIncidents(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'danger';
      case 'P2': return 'warning';
      case 'P3': return 'primary';
      case 'P4': return 'default';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'P1': return 'Critique';
      case 'P2': return 'Élevée';
      case 'P3': return 'Moyenne';
      case 'P4': return 'Faible';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau': return 'primary';
      case 'en_cours': return 'warning';
      case 'en_attente': return 'secondary';
      case 'resolu': return 'success';
      case 'en_arbitrage': return 'danger';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'resolu': return 'Résolu';
      case 'en_arbitrage': return 'En arbitrage';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewTicket = (ticketId: number) => {
    router.push(`/tableaudebord/support/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header amélioré */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-[#4ba9b7] rounded-xl flex items-center justify-center shadow-lg">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Support Technique</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gestion des demandes de support clients avec SLA</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            color="primary"
            startContent={<RefreshCw size={16} />}
            onClick={loadData}
            isLoading={loading}
          >
            Actualiser
          </Button>
          
          <Button
            color="success"
            startContent={<Plus size={16} />}
          >
            Nouveau Ticket
          </Button>
        </div>
      </motion.div>

      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total tickets</p>
                <p className="text-2xl font-bold text-blue-600">{incidents.length}</p>
              </div>
              <Timer className="text-blue-500" size={24} />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {incidents.filter(t => t.status === 'en_cours').length}
                </p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Résolus</p>
                <p className="text-2xl font-bold text-green-600">
                  {incidents.filter(t => t.status === 'resolu').length}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critiques</p>
                <p className="text-2xl font-bold text-red-600">
                  {incidents.filter(t => t.priority === 'P1').length}
                </p>
              </div>
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher tickets..."
             
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search size={16} />}
              className="w-full"
            />
            
            <Input
              placeholder="Filtrer par statut"
             
              onChange={(e) => setFilterStatus(e.target.value || "all")}
            />
            
            <Input
              placeholder="Filtrer par priorité"
             
              onChange={(e) => setFilterPriority(e.target.value || "all")}
            />

            <div className="flex items-center gap-2">
              <Chip color="primary" variant="flat">
                {filteredIncidents.length} résultat(s)
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tableau des tickets */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Liste des tickets de support">
            <TableHeader>
              <TableColumn>NUMÉRO</TableColumn>
              <TableColumn>TITRE</TableColumn>
              <TableColumn>PRIORITÉ</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn>CRÉÉ LE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun ticket trouvé">
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {incident.incident_number}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p 
                        className="font-medium cursor-pointer hover:text-[#4ba9b7] transition-colors"
                        onClick={() => handleViewTicket(incident.id)}
                      >
                        {incident.title}
                      </p>
                      {incident.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {incident.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getPriorityColor(incident.priority)}
                      size="sm"
                      variant="flat"
                    >
                      {getPriorityLabel(incident.priority)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(incident.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusLabel(incident.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {formatDate(incident.created_at)}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={14} />}
                          onPress={() => handleViewTicket(incident.id)}
                        >
                          Voir détails
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={14} />}
                        >
                          Modifier
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<XCircle size={14} />}
                        >
                          Supprimer
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default GestionSupport;