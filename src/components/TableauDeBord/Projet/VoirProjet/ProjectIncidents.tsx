"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Button, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea
} from "@nextui-org/react";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { IncidentsService } from "@/services/incidents";
import { useAuth } from "@/context/AuthContext";
import LoadingState from "@/components/UI/Loading/LoadingState";

interface ProjectIncidentsProps {
  projectId: string;
  projectName: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "nouveau" | "ouvert" | "en_cours" | "resolu" | "ferme";
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  created_by: string;
  project_id?: string;
}

const ProjectIncidents: React.FC<ProjectIncidentsProps> = ({ projectId, projectName }) => {
  const { user, isAdmin } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [priorityFilter, setPriorityFilter] = useState("tous");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    priority: "P2" as const
  });

  // Charger les incidents du projet
  useEffect(() => {
    loadProjectIncidents();
  }, [projectId]);

  // Filtrer les incidents
  useEffect(() => {
    let filtered = [...incidents];

    // Filtrage par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== "tous") {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Filtrage par priorité
    if (priorityFilter !== "tous") {
      filtered = filtered.filter(incident => incident.priority === priorityFilter);
    }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, statusFilter, priorityFilter]);

  const loadProjectIncidents = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'API d'incidents avec filtrage par projet
      const response = await IncidentsService.getIncidentsByCriteria({
        data: {
          project_id: parseInt(projectId),
          is_active: true
        }
      });

      if (response.code === 200 && response.items) {
        setIncidents(response.items);
      } else {
        setIncidents([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncident.title.trim() || !newIncident.description.trim()) return;

    try {
      const incidentData = {
        title: newIncident.title,
        description: newIncident.description,
        priority: newIncident.priority,
        project_id: parseInt(projectId),
        user_id: user?.id || 0,
        status: "nouveau" as const,
        type: "technique" as const,
        category: "technique",
        impact: "moyenne",
        domain: "application",
        declarant_name: user?.name || user?.email || "Utilisateur",
        is_active: true
      };

      const response = await IncidentsService.createIncident(incidentData);
      
      if (response.code === 200 || response.code === 201) {
        // Recharger la liste
        await loadProjectIncidents();
        
        // Réinitialiser le formulaire
        setNewIncident({
          title: "",
          description: "",
          priority: "P2"
        });
        
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'incident:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "danger";
      case "P1": return "warning";
      case "P2": return "primary";
      case "P3": return "success";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "nouveau": return "primary";
      case "ouvert": return "warning";
      case "en_cours": return "secondary";
      case "resolu": return "success";
      case "ferme": return "default";
      default: return "default";
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
    total: incidents.length,
    nouveau: incidents.filter(i => i.status === "nouveau").length,
    enCours: incidents.filter(i => i.status === "en_cours").length,
    resolu: incidents.filter(i => i.status === "resolu").length,
    critique: incidents.filter(i => i.priority === "P0").length
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 min-h-[600px] space-y-8">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Incidents du projet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des incidents et problèmes liés au projet "{projectName}"
          </p>
        </div>
        {(isAdmin() || user?.id) && (
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsCreateModalOpen(true)}
            className="font-medium"
          >
            Créer un incident
          </Button>
        )}
      </div>

      {/* Statistiques des incidents */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          </CardBody>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.nouveau}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Nouveaux</p>
          </CardBody>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.enCours}</p>
            <p className="text-sm text-orange-600 dark:text-orange-400">En cours</p>
          </CardBody>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolu}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Résolus</p>
          </CardBody>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critique}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Critiques</p>
          </CardBody>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-white dark:bg-gray-800">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Rechercher un incident..."
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex-1"
            />
            
            <Select
              placeholder="Statut"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="tous">Tous les statuts</SelectItem>
              <SelectItem key="nouveau">Nouveau</SelectItem>
              <SelectItem key="ouvert">Ouvert</SelectItem>
              <SelectItem key="en_cours">En cours</SelectItem>
              <SelectItem key="resolu">Résolu</SelectItem>
              <SelectItem key="ferme">Fermé</SelectItem>
            </Select>
            
            <Select
              placeholder="Priorité"
              selectedKeys={[priorityFilter]}
              onSelectionChange={(keys) => setPriorityFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="tous">Toutes priorités</SelectItem>
              <SelectItem key="P0">P0 - Critique</SelectItem>
              <SelectItem key="P1">P1 - Élevée</SelectItem>
              <SelectItem key="P2">P2 - Moyenne</SelectItem>
              <SelectItem key="P3">P3 - Faible</SelectItem>
            </Select>

            <Button
              variant="flat"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={loadProjectIncidents}
            >
              Actualiser
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table des incidents */}
      <Card className="bg-white dark:bg-gray-800">
        <CardBody>
          <Table aria-label="Table des incidents du projet">
            <TableHeader>
              <TableColumn>INCIDENT</TableColumn>
              <TableColumn>PRIORITÉ</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn>CRÉÉ LE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun incident trouvé pour ce projet">
              {filteredIncidents.map((incident, index) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {incident.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {incident.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getPriorityColor(incident.priority) as any}
                      size="sm"
                      variant="flat"
                    >
                      {incident.priority}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(incident.status) as any}
                      size="sm"
                      variant="flat"
                    >
                      {incident.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(incident.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="light"
                      size="sm"
                      startContent={<Eye className="w-4 h-4" />}
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal de création d'incident */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold">Créer un nouvel incident</h3>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Titre de l'incident"
              placeholder="Décrivez brièvement le problème"
              value={newIncident.title}
              onValueChange={(value) => setNewIncident(prev => ({ ...prev, title: value }))}
              isRequired
            />
            
            <Textarea
              label="Description détaillée"
              placeholder="Décrivez le problème en détail..."
              value={newIncident.description}
              onValueChange={(value) => setNewIncident(prev => ({ ...prev, description: value }))}
              rows={4}
              isRequired
            />
            
            <Select
              label="Priorité"
              selectedKeys={[newIncident.priority]}
              onSelectionChange={(keys) => setNewIncident(prev => ({ 
                ...prev, 
                priority: Array.from(keys)[0] as any 
              }))}
            >
              <SelectItem key="P0">P0 - Critique (système inutilisable)</SelectItem>
              <SelectItem key="P1">P1 - Élevée (fonctionnalité majeure impactée)</SelectItem>
              <SelectItem key="P2">P2 - Moyenne (problème mineur)</SelectItem>
              <SelectItem key="P3">P3 - Faible (amélioration ou suggestion)</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateIncident}
              isDisabled={!newIncident.title.trim() || !newIncident.description.trim()}
            >
              Créer l'incident
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectIncidents;