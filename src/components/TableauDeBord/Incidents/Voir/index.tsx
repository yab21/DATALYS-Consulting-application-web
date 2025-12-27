"use client";

import React, { useState, useEffect } from "react";
import {
  Chip
} from "@heroui/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { ProfessionalCard, MetricCard, ProfessionalButton } from "@/components/UI/Professional";
import { Incident, IncidentsService } from "@/services/incidents";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { getContextualErrorMessage } from '@/lib/error-messages';
import { apiInterceptor } from '@/lib/api-interceptor';
import IncidentFiles from "./IncidentFiles";
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  ArrowLeft,
  Edit
} from "lucide-react";

interface IncidentDetailProps {
  incidentId: number;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ incidentId }) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useSimpleNotifications();

  // Charger les données de l'incident
  useEffect(() => {
    const loadIncidentData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Chargement des données de l'incident:", incidentId);
        
        // Récupérer tous les incidents et trouver celui qui correspond
        const response = await IncidentsService.getIncidentsByCriteria({
          index: 0,
          size: 1000, // Récupérer un grand nombre pour être sûr de trouver l'incident
          data: { is_active: true }
        });
        
        let incidentsData: Incident[] = [];
        if (response.code === 200 && response.items) {
          incidentsData = response.items;
        } else if (Array.isArray(response)) {
          incidentsData = response;
        }
        
        // Trouver l'incident spécifique
        const foundIncident = incidentsData.find((i: Incident) => i.id === incidentId);
        
        if (foundIncident) {
          setIncident(foundIncident);
          console.log("✅ Incident trouvé:", foundIncident);
        } else {
          console.error("❌ Incident non trouvé avec l'ID:", incidentId);
          showNotification({
            type: "error",
            title: "Incident non trouvé",
            message: `L'incident avec l'ID ${incidentId} n'existe pas ou n'est plus actif.`,
            duration: 5000,
          });
          
          // Rediriger vers la liste des incidents après 2 secondes
          setTimeout(() => {
            window.location.href = "/tableaudebord/incidents";
          }, 2000);
        }
        
      } catch (error) {
        console.error("❌ Erreur lors du chargement de l'incident:", error);
        
        // Vérifier d'abord si c'est une erreur de token expiré
        apiInterceptor.handleApiError(error);

        // Générer le message d'erreur approprié
        const errorMessage = getContextualErrorMessage(error, {
          operation: 'load',
          dataType: 'incidents',
          fallback: "Impossible de charger les données de l'incident"
        });

        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: errorMessage,
          duration: 5000,
        });
        
        // Rediriger vers la liste des incidents en cas d'erreur
        setTimeout(() => {
          window.location.href = "/tableaudebord/incidents";
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (incidentId) {
      loadIncidentData();
    }
  }, [incidentId, showNotification]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "nouveau": return "primary";
      case "en_cours": return "warning";
      case "en_attente": return "secondary";
      case "en_arbitrage": return "danger";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "nouveau": return "Nouveau";
      case "en_cours": return "En cours";
      case "en_attente": return "En attente";
      case "en_arbitrage": return "En arbitrage";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "danger";
      case "P1": return "warning";
      case "P2": return "primary";
      case "P3": return "success";
      case "P4": return "default";
      default: return "default";
    }
  };

  const getSLAStatusColor = (status: string) => {
    switch (status) {
      case "respecte": return "success";
      case "en_retard": return "danger";
      case "non_applicable": return "default";
      default: return "default";
    }
  };

  const getSLAStatusLabel = (status: string) => {
    switch (status) {
      case "respecte": return "Respecté";
      case "en_retard": return "En retard";
      case "non_applicable": return "Non applicable";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "nouveau": return <AlertTriangle className="h-4 w-4" />;
      case "en_cours": return <Clock className="h-4 w-4" />;
      case "en_attente": return <Clock className="h-4 w-4" />;
      case "en_arbitrage": return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Détail Incident" />
        <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={4} />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Détail Incident" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ba9b7] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Redirection en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName={`Incident ${incident.incident_number}`} />
      
      {/* Header avec informations principales */}
      <ProfessionalCard>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Informations principales */}
          <div className="flex items-start gap-6">
            {/* Icône de l'incident */}
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-[#4ba9b7]" />
            </div>
            
            {/* Détails */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {incident.title}
                </h1>
                <Chip
                  size="sm"
                  color={getStatusColor(incident.status)}
                  variant="flat"
                  startContent={getStatusIcon(incident.status)}
                >
                  {getStatusLabel(incident.status)}
                </Chip>
                <Chip
                  size="sm"
                  color={getPriorityColor(incident.priority)}
                  variant="flat"
                >
                  {incident.priority}
                </Chip>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>#{incident.incident_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Déclaré par: {incident.declarant_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Créé le {formatDate(incident.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Type: {incident.type}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/tableaudebord/incidents">
              <ProfessionalButton variant="outline" size="sm" startContent={<ArrowLeft className="h-4 w-4" />}>
                Retour à la liste
              </ProfessionalButton>
            </Link>
            <ProfessionalButton variant="outline" size="sm" startContent={<Edit className="h-4 w-4" />}>
              Modifier
            </ProfessionalButton>
          </div>
        </div>
      </ProfessionalCard>

      {/* Métriques de l'incident */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Priorité"
          value={incident.priority_label || incident.priority}
          subtitle={incident.priority_label}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant={getPriorityColor(incident.priority) as any}
        />
        
        <MetricCard
          title="SLA Prise en charge"
          value={incident.sla_prise_en_charge_status || "N/A"}
          subtitle="délai de réponse"
          icon={<Clock className="h-6 w-6" />}
          variant={getSLAStatusColor(incident.sla_prise_en_charge_status) as any}
        />
        
        <MetricCard
          title="SLA Résolution"
          value={incident.sla_resolution_status || "N/A"}
          subtitle="délai de résolution"
          icon={<CheckCircle className="h-6 w-6" />}
          variant={getSLAStatusColor(incident.sla_resolution_status) as any}
        />
        
        <MetricCard
          title="Refus"
          value={incident.refusal_count || 0}
          subtitle="nombre de refus"
          icon={<XCircle className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      {/* Section des fichiers directement sans tabs */}
      <IncidentFiles incidentId={incident.id} />
    </div>
  );
};

export default IncidentDetail;