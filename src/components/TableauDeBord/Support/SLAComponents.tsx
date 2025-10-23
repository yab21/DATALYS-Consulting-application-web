"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Chip, Progress, Badge } from "@nextui-org/react";
import { Clock, AlertTriangle, CheckCircle, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { PriorityConfig, calculateSLAStatus } from "@/config/ticketContexts";

interface SLACountdownProps {
  ticket: any;
  priorityConfig: PriorityConfig;
  compact?: boolean;
}

/**
 * Composant compteur SLA temps réel avec couleurs
 */
export const SLACountdown: React.FC<SLACountdownProps> = ({ 
  ticket, 
  priorityConfig, 
  compact = false 
}) => {
  const [slaStatus, setSlaStatus] = useState(() => calculateSLAStatus(ticket, priorityConfig));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSlaStatus(calculateSLAStatus(ticket, priorityConfig));
    }, 60000); // Mise à jour chaque minute

    return () => clearInterval(interval);
  }, [ticket, priorityConfig]);

  if (!priorityConfig.sla) {
    return null;
  }

  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return "Expiré";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours}h`;
    }
    
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'exceeded') => {
    switch (status) {
      case 'ok': return 'success';
      case 'warning': return 'warning';
      case 'exceeded': return 'danger';
      default: return 'default';
    }
  };

  const getProgressValue = () => {
    const { resolution } = priorityConfig.sla!;
    const elapsed = resolution - slaStatus.timeRemaining;
    return Math.min(100, (elapsed / resolution) * 100);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Timer size={14} className={
          slaStatus.resolutionStatus === 'ok' ? 'text-green-500' :
          slaStatus.resolutionStatus === 'warning' ? 'text-yellow-500' : 'text-red-500'
        } />
        <span className={`text-sm font-medium ${
          slaStatus.resolutionStatus === 'ok' ? 'text-green-600' :
          slaStatus.resolutionStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {formatTime(slaStatus.timeRemaining)}
        </span>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Temps de résolution SLA</h4>
          <Chip 
            color={getStatusColor(slaStatus.resolutionStatus)}
            size="sm"
            variant="flat"
          >
            {slaStatus.isOverdue ? 'Dépassé' : 'Dans les temps'}
          </Chip>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Temps restant</span>
              <span className={`font-medium ${
                slaStatus.resolutionStatus === 'ok' ? 'text-green-600' :
                slaStatus.resolutionStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {formatTime(slaStatus.timeRemaining)}
              </span>
            </div>
            <Progress 
              value={getProgressValue()}
              color={getStatusColor(slaStatus.resolutionStatus)}
              size="sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Prise en charge</span>
              <div className="flex items-center gap-1 mt-1">
                {slaStatus.interventionStatus === 'ok' ? 
                  <CheckCircle size={12} className="text-green-500" /> :
                  <AlertTriangle size={12} className="text-red-500" />
                }
                <span className={
                  slaStatus.interventionStatus === 'ok' ? 'text-green-600' : 'text-red-600'
                }>
                  {slaStatus.interventionStatus === 'ok' ? 'Respecté' : 'Dépassé'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Objectif résolution</span>
              <div className="mt-1 font-medium text-gray-700">
                {formatTime(priorityConfig.sla.resolution)}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

interface SLAMetricsProps {
  tickets: any[];
  context: 'support';
}

/**
 * Composant métriques SLA et KPI
 */
export const SLAMetrics: React.FC<SLAMetricsProps> = ({ tickets }) => {
  const calculateMetrics = () => {
    if (!tickets.length) return null;

    const resolvedTickets = tickets.filter(t => t.status === 'resolu');
    const totalTickets = tickets.length;
    
    // Taux de tickets résolus dans les SLA
    const slaCompliantTickets = resolvedTickets.filter(ticket => {
      // Logique de calcul du respect des SLA
      // À implémenter selon la logique métier
      return true; // Placeholder
    });
    
    const slaComplianceRate = totalTickets > 0 ? (slaCompliantTickets.length / totalTickets) * 100 : 0;
    
    // Délai moyen de résolution par priorité
    const delayByPriority = ['P1', 'P2', 'P3', 'P4'].map(priority => {
      const priorityTickets = resolvedTickets.filter(t => t.priority === priority);
      if (!priorityTickets.length) return { priority, avgTime: 0 };
      
      const totalTime = priorityTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.updated_at); // ou resolved_at si disponible
        return sum + (resolved.getTime() - created.getTime());
      }, 0);
      
      const avgTime = Math.floor(totalTime / priorityTickets.length / (1000 * 60)); // en minutes
      
      return { priority, avgTime };
    });

    return {
      slaComplianceRate,
      delayByPriority,
      totalTickets,
      resolvedTickets: resolvedTickets.length,
      activeTickets: tickets.filter(t => ['en_cours', 'en_attente'].includes(t.status)).length
    };
  };

  const metrics = calculateMetrics();

  if (!metrics) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <p className="text-gray-500">Aucune donnée disponible pour les métriques SLA</p>
        </CardBody>
      </Card>
    );
  }

  const formatMinutes = (minutes: number): string => {
    if (minutes === 0) return "N/A";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours}h`;
    }
    
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Taux de conformité SLA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-l-4 border-l-green-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conformité SLA</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.slaComplianceRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tickets actifs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets actifs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.activeTickets}
                </p>
              </div>
              <Clock className="text-blue-500" size={24} />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Tickets résolus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-l-4 border-l-purple-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets résolus</p>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.resolvedTickets}
                </p>
              </div>
              <CheckCircle className="text-purple-500" size={24} />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Total tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-l-4 border-l-gray-500">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total tickets</p>
                <p className="text-2xl font-bold text-gray-600">
                  {metrics.totalTickets}
                </p>
              </div>
              <Timer className="text-gray-500" size={24} />
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Délais moyens par priorité */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="md:col-span-2 lg:col-span-4"
      >
        <Card>
          <CardBody className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Délai moyen de résolution par priorité
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.delayByPriority.map(({ priority, avgTime }) => (
                <div key={priority} className="text-center">
                  <Badge
                    color={
                      priority === 'P1' ? 'danger' :
                      priority === 'P2' ? 'warning' :
                      priority === 'P3' ? 'primary' : 'default'
                    }
                    variant="flat"
                    className="mb-2"
                  >
                    {priority}
                  </Badge>
                  <p className="text-lg font-semibold">
                    {formatMinutes(avgTime)}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

/**
 * Composant satisfaction client (placeholder pour intégration future)
 */
export const ClientSatisfactionMetrics: React.FC = () => {
  // Placeholder pour les métriques de satisfaction client
  // À implémenter avec les vraies données
  return (
    <Card>
      <CardBody className="p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Satisfaction Client
        </h4>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600 mb-1">8.5/10</p>
          <p className="text-sm text-gray-500">Note moyenne post-résolution</p>
          <div className="mt-3 text-xs text-gray-400">
            Basé sur 45 évaluations ce mois
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const SLAComponentsExports = { SLACountdown, SLAMetrics, ClientSatisfactionMetrics };
export default SLAComponentsExports;