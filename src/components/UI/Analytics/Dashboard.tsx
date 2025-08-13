"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Button,
  Chip,
  Progress,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  cn,
} from '@nextui-org/react';
import { motion } from 'framer-motion';
import { ProtectedComponent } from '../PermissionManager/PermissionManager';

// Types pour les analytics
export interface MetricData {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: 'number' | 'percentage' | 'currency' | 'time';
  trend: 'up' | 'down' | 'stable';
  color: 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
  icon: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  };
  period: string;
}

export interface TimeRange {
  label: string;
  value: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Dernières 24h', value: '24h', days: 1 },
  { label: '7 derniers jours', value: '7d', days: 7 },
  { label: '30 derniers jours', value: '30d', days: 30 },
  { label: '3 derniers mois', value: '3m', days: 90 },
  { label: '6 derniers mois', value: '6m', days: 180 },
  { label: 'Année en cours', value: '1y', days: 365 },
];

interface AnalyticsDashboardProps {
  className?: string;
  compactMode?: boolean;
  showExportButton?: boolean;
  onExport?: (data: any) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className,
  compactMode = false,
  showExportButton = true,
  onExport,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Données mockées - en production, ces données viendraient d'APIs
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);

  // Charger les données selon la période sélectionnée
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simuler chargement

      // Données mockées pour les métriques
      const mockMetrics: MetricData[] = [
        {
          id: 'projects',
          label: 'Projets Actifs',
          value: 24,
          previousValue: 20,
          format: 'number',
          trend: 'up',
          color: 'primary',
          icon: '📊',
        },
        {
          id: 'partners',
          label: 'Partenaires',
          value: 12,
          previousValue: 10,
          format: 'number',
          trend: 'up',
          color: 'success',
          icon: '🤝',
        },
        {
          id: 'incidents',
          label: 'Incidents Ouverts',
          value: 3,
          previousValue: 8,
          format: 'number',
          trend: 'down',
          color: 'warning',
          icon: '⚠️',
        },
        {
          id: 'completion',
          label: 'Taux de Completion',
          value: 87.5,
          previousValue: 82.3,
          format: 'percentage',
          trend: 'up',
          color: 'success',
          icon: '✅',
        },
        {
          id: 'revenue',
          label: 'Chiffre d\'Affaires',
          value: 125000,
          previousValue: 115000,
          format: 'currency',
          trend: 'up',
          color: 'primary',
          icon: '💰',
        },
        {
          id: 'response_time',
          label: 'Temps de Réponse Moyen',
          value: 2.4,
          previousValue: 3.1,
          format: 'time',
          trend: 'down',
          color: 'success',
          icon: '⚡',
        },
      ];

      // Données mockées pour les graphiques
      const mockCharts: ChartData[] = [
        {
          id: 'projects_timeline',
          title: 'Évolution des Projets',
          type: 'line',
          data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
            datasets: [{
              label: 'Projets créés',
              data: [5, 8, 12, 6, 10, 9],
              color: '#3B82F6',
            }, {
              label: 'Projets terminés',
              data: [3, 6, 8, 7, 8, 11],
              color: '#10B981',
            }],
          },
          period: selectedTimeRange,
        },
        {
          id: 'partners_distribution',
          title: 'Répartition par Secteur',
          type: 'pie',
          data: {
            labels: ['Technologie', 'Finance', 'Santé', 'Logistique', 'Autre'],
            datasets: [{
              label: 'Partenaires',
              data: [35, 25, 20, 15, 5],
              color: '#8B5CF6',
            }],
          },
          period: selectedTimeRange,
        },
        {
          id: 'incidents_trend',
          title: 'Tendance des Incidents',
          type: 'bar',
          data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            datasets: [{
              label: 'Incidents créés',
              data: [12, 8, 6, 4],
              color: '#F59E0B',
            }, {
              label: 'Incidents résolus',
              data: [10, 9, 7, 5],
              color: '#10B981',
            }],
          },
          period: selectedTimeRange,
        },
        {
          id: 'performance',
          title: 'Performance Système',
          type: 'area',
          data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
              label: 'CPU (%)',
              data: [45, 52, 68, 75, 82, 65],
              color: '#EF4444',
            }, {
              label: 'Mémoire (%)',
              data: [60, 58, 72, 69, 74, 68],
              color: '#3B82F6',
            }],
          },
          period: selectedTimeRange,
        },
      ];

      setMetrics(mockMetrics);
      setCharts(mockCharts);
      setIsLoading(false);
    };

    loadData();
  }, [selectedTimeRange]);

  // Formatage des valeurs
  const formatValue = (value: number, format: MetricData['format']): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(1)}h`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  // Calcul du pourcentage de changement
  const getChangePercentage = (current: number, previous?: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Rendu d'une métrique
  const renderMetric = (metric: MetricData, index: number) => {
    const changePercentage = getChangePercentage(metric.value, metric.previousValue);
    const changeIcon = metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️';
    
    return (
      <motion.div
        key={metric.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">{metric.icon}</div>
              <Chip
                size="sm"
                color={metric.color}
                variant="flat"
                className="text-xs"
              >
                {changeIcon} {Math.abs(changePercentage).toFixed(1)}%
              </Chip>
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {formatValue(metric.value, metric.format)}
              </p>
              <p className="text-small text-default-400">{metric.label}</p>
              
              {metric.previousValue && (
                <p className="text-xs text-default-300">
                  vs {formatValue(metric.previousValue, metric.format)} précédemment
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    );
  };

  // Rendu simplifié d'un graphique (mock)
  const renderChart = (chart: ChartData, index: number) => {
    return (
      <motion.div
        key={chart.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center w-full">
              <h4 className="font-semibold text-medium">{chart.title}</h4>
              <Chip size="sm" variant="flat">
                {chart.type}
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {/* Placeholder pour les graphiques - en production, utiliser une lib comme Chart.js ou Recharts */}
            <div className="h-48 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950/20 dark:to-secondary-950/20 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-3xl">📈</div>
                <p className="text-sm text-default-400">Graphique {chart.type}</p>
                <div className="flex gap-2 justify-center">
                  {chart.data.datasets.map((dataset, i) => (
                    <Chip key={i} size="sm" variant="flat" style={{ color: dataset.color }}>
                      {dataset.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Données tabulaires en fallback */}
            <div className="mt-4 space-y-2">
              {chart.data.datasets.map((dataset, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{dataset.label}</span>
                  <div className="flex gap-1">
                    {dataset.data.slice(0, 3).map((value, j) => (
                      <span key={j} className="text-xs text-default-400">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    );
  };

  // Interface d'export
  const handleExport = () => {
    const exportData = {
      timeRange: selectedTimeRange,
      metrics,
      charts,
      exportedAt: new Date().toISOString(),
    };
    
    if (onExport) {
      onExport(exportData);
    } else {
      // Export par défaut en JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedTimeRange}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ProtectedComponent requiredPermission="view_analytics">
      <div className={cn("w-full space-y-6", className)}>
        {/* En-tête avec contrôles */}
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">Tableau de Bord Analytics</h2>
                <p className="text-small text-default-400">
                  Vue d'ensemble des performances et métriques système
                </p>
              </div>
              
              <div className="flex gap-3">
                <Select
                  size="sm"
                  placeholder="Période"
                  selectedKeys={[selectedTimeRange]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setSelectedTimeRange(value);
                  }}
                  className="min-w-40"
                >
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </Select>
                
                {showExportButton && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<span>📊</span>}
                      >
                        Exporter
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu onAction={handleExport}>
                      <DropdownItem key="json">Format JSON</DropdownItem>
                      <DropdownItem key="csv">Format CSV</DropdownItem>
                      <DropdownItem key="pdf">Rapport PDF</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
                
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  isLoading={isLoading}
                  onPress={() => {
                    setSelectedTimeRange(selectedTimeRange); // Force reload
                  }}
                >
                  🔄
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contenu principal avec onglets */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="w-full"
        >
          <Tab key="overview" title="Vue d'ensemble">
            <div className="space-y-6">
              {/* Métriques principales */}
              <div className={cn(
                "grid gap-4",
                compactMode 
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              )}>
                {metrics.map((metric, index) => renderMetric(metric, index))}
              </div>

              {/* Graphiques principaux */}
              <div className={cn(
                "grid gap-6",
                compactMode 
                  ? "grid-cols-1 lg:grid-cols-2"
                  : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-2"
              )}>
                {charts.slice(0, 4).map((chart, index) => renderChart(chart, index))}
              </div>
            </div>
          </Tab>

          <Tab key="projects" title="Projets">
            <div className="space-y-6">
              {/* Métriques spécifiques aux projets */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.filter(m => ['projects', 'completion'].includes(m.id))
                  .map((metric, index) => renderMetric(metric, index))}
              </div>

              {/* Graphiques projets */}
              <div className="grid gap-6 lg:grid-cols-2">
                {charts.filter(c => c.id.includes('project'))
                  .map((chart, index) => renderChart(chart, index))}
              </div>
            </div>
          </Tab>

          <Tab key="partners" title="Partenaires">
            <div className="space-y-6">
              {/* Métriques partenaires */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.filter(m => ['partners', 'revenue'].includes(m.id))
                  .map((metric, index) => renderMetric(metric, index))}
              </div>

              {/* Graphiques partenaires */}
              <div className="grid gap-6 lg:grid-cols-2">
                {charts.filter(c => c.id.includes('partner'))
                  .map((chart, index) => renderChart(chart, index))}
              </div>
            </div>
          </Tab>

          <Tab key="system" title="Système">
            <div className="space-y-6">
              {/* Métriques système */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.filter(m => ['incidents', 'response_time'].includes(m.id))
                  .map((metric, index) => renderMetric(metric, index))}
              </div>

              {/* Monitoring système */}
              <div className="grid gap-6 lg:grid-cols-2">
                {charts.filter(c => ['incidents_trend', 'performance'].includes(c.id))
                  .map((chart, index) => renderChart(chart, index))}
              </div>

              {/* Alertes système */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Alertes Système</h4>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-950/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-warning">⚠️</span>
                        <div>
                          <p className="text-sm font-medium">Usage mémoire élevé</p>
                          <p className="text-xs text-default-400">Serveur principal - 78% utilisé</p>
                        </div>
                      </div>
                      <Progress value={78} color="warning" size="sm" className="w-20" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-950/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-success">✅</span>
                        <div>
                          <p className="text-sm font-medium">Sauvegarde terminée</p>
                          <p className="text-xs text-default-400">Dernière sauvegarde - il y a 2h</p>
                        </div>
                      </div>
                      <Chip size="sm" color="success" variant="flat">OK</Chip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </ProtectedComponent>
  );
};

export default AnalyticsDashboard;