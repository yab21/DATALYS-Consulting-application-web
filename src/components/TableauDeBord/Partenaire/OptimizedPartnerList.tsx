"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Phone, Mail, MapPin, Users, AlertCircle } from "lucide-react";
import { Button, Chip, Avatar, Card, CardBody } from "@heroui/react";
import { 
  useProjectCache,
  VirtualizedTable,
  SkeletonTable,
  useSimpleNotifications,
  simpleNotificationHelpers
} from "@/components/Optimizations";
import { useRouter } from "next/navigation";

// Types
interface Partner {
  id: string;
  nom: string;
  logo?: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  adresse: string;
  responsable: string;
  dateCreation: string;
  statut: "actif" | "inactif" | "suspendu";
  nombreProjets: number;
  nombreIncidents: number;
}

const OptimizedPartnerList: React.FC = () => {
  const router = useRouter();
  const { showNotification } = useSimpleNotifications();

  // Cache intelligent pour les partenaires
  const { 
    data: partners = [], 
    isLoading, 
    isStale,
    refetch 
  } = useProjectCache<Partner[]>("partners-list", async () => {
    const response = await fetch("/api/partners");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des partenaires");
    }
    return response.json();
  });

  // Données mockées pour la démo
  const mockPartners: Partner[] = [
    {
      id: "partner-1",
      nom: "TechCorp Solutions",
      logo: "/images/partners/techcorp.svg",
      secteur: "Technologie",
      description: "Spécialiste en solutions informatiques d'entreprise",
      email: "contact@techcorp.com",
      telephone: "+33 1 23 45 67 89",
      adresse: "123 Avenue des Champs-Élysées, Paris",
      responsable: "Jean Dupont",
      dateCreation: "2023-01-15T10:00:00Z",
      statut: "actif",
      nombreProjets: 8,
      nombreIncidents: 2,
    },
    {
      id: "partner-2", 
      nom: "GlobalBank",
      logo: "/images/partners/globalbank.svg",
      secteur: "Finance",
      description: "Institution bancaire internationale",
      email: "partenariat@globalbank.fr",
      telephone: "+33 1 98 76 54 32",
      adresse: "456 Rue de la Banque, La Défense",
      responsable: "Marie Martin",
      dateCreation: "2022-11-20T14:30:00Z",
      statut: "actif",
      nombreProjets: 12,
      nombreIncidents: 1,
    },
    {
      id: "partner-3",
      nom: "EcoLogistics",
      logo: "/images/partners/ecologistics.svg", 
      secteur: "Logistique",
      description: "Solutions logistiques durables",
      email: "info@ecologistics.com",
      telephone: "+33 2 11 22 33 44",
      adresse: "789 Boulevard Écologique, Lyon",
      responsable: "Pierre Durand",
      dateCreation: "2023-03-10T09:15:00Z",
      statut: "inactif",
      nombreProjets: 3,
      nombreIncidents: 0,
    },
    {
      id: "partner-4",
      nom: "MediHealth Plus",
      logo: "/images/partners/medihealth.svg",
      secteur: "Santé",
      description: "Plateforme de santé numérique",
      email: "contact@medihealth.fr",
      telephone: "+33 3 55 66 77 88",
      adresse: "321 Rue de la Santé, Strasbourg", 
      responsable: "Sophie Bernard",
      dateCreation: "2023-06-05T16:20:00Z",
      statut: "suspendu",
      nombreProjets: 2,
      nombreIncidents: 5,
    },
    {
      id: "partner-5",
      nom: "CloudScale Systems",
      logo: "/images/partners/cloudscale.svg",
      secteur: "Cloud Computing",
      description: "Solutions d'infrastructure cloud évolutives",
      email: "hello@cloudscale.io",
      telephone: "+33 4 77 88 99 00",
      adresse: "555 Tech Valley, Grenoble",
      responsable: "Luc Moreau",
      dateCreation: "2024-01-10T11:45:00Z",
      statut: "actif",
      nombreProjets: 15,
      nombreIncidents: 1,
    },
  ];

  // Utiliser les données mockées si l'API n'est pas disponible
  const displayPartners = Array.isArray(partners) && partners.length > 0 ? partners : mockPartners;

  // Configuration des colonnes pour la table virtualisée
  const columns = useMemo(() => [
    {
      key: "nom",
      label: "Partenaire", 
      sortable: true,
      searchable: true,
      width: 300,
      render: (value: string, partner: Partner) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={partner.logo}
            name={partner.nom}
            size="md"
            className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
            fallback={
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            }
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {partner.secteur}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "responsable",
      label: "Responsable",
      sortable: true,
      searchable: true,
      width: 200,
      render: (value: string, partner: Partner) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[150px]" title={partner.email}>
              {partner.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "statut",
      label: "Statut",
      sortable: true,
      width: 120,
      render: (value: string) => {
        const statusConfig = {
          actif: { color: "success", label: "Actif", icon: "✅" },
          inactif: { color: "warning", label: "Inactif", icon: "⏸️" },
          suspendu: { color: "danger", label: "Suspendu", icon: "🚫" },
        };
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.inactif;
        return (
          <Chip size="sm" color={config.color as any} variant="flat" className="gap-1">
            <span>{config.icon}</span>
            {config.label}
          </Chip>
        );
      },
    },
    {
      key: "nombreProjets",
      label: "Projets",
      sortable: true,
      width: 100,
      className: "text-center",
      render: (value: number) => (
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm font-medium">
            📊 {value}
          </span>
        </div>
      ),
    },
    {
      key: "nombreIncidents", 
      label: "Incidents",
      sortable: true,
      width: 100,
      className: "text-center",
      render: (value: number) => (
        <div className="text-center">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            value === 0 
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : value <= 2
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200" 
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}>
            {value === 0 ? "✅" : "⚠️"} {value}
          </span>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact", 
      width: 150,
      render: (value: any, partner: Partner) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-3 w-3" />
            <span className="truncate">{partner.telephone}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]" title={partner.adresse}>
              {partner.adresse.split(',')[0]}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "dateCreation",
      label: "Créé le",
      sortable: true,
      width: 120,
      render: (value: string) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(value).toLocaleDateString('fr-FR')}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 120,
      render: (value: any, partner: Partner) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onClick={() => handlePartnerAction(partner, 'view')}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400"
          >
            👁️
          </Button>
          <Button
            size="sm" 
            variant="light"
            isIconOnly
            onClick={() => handlePartnerAction(partner, 'edit')}
            className="text-gray-600 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400"
          >
            ✏️
          </Button>
          {partner.statut === 'suspendu' && (
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onClick={() => handlePartnerAction(partner, 'activate')}
              className="text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-400 dark:hover:text-orange-400"
            >
              🔄
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  // Gestion des actions sur les partenaires
  const handlePartnerAction = (partner: Partner, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/tableaudebord/partenaire/voir/${partner.id}`);
        break;
      case 'edit':
        router.push(`/tableaudebord/partenaire/modifier/${partner.id}`);
        break;
      case 'activate':
        showNotification(simpleNotificationHelpers.info(
          "Réactivation du partenaire",
          `Le partenaire "${partner.nom}" sera réactivé sous peu`
        ));
        break;
    }
  };

  const handleSelectionChange = (selectedPartners: Partner[]) => {
    console.log("Partenaires sélectionnés:", selectedPartners);
  };

  const handleRefresh = () => {
    refetch();
    showNotification(simpleNotificationHelpers.success(
      "Liste actualisée",
      "La liste des partenaires a été mise à jour"
    ));
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques rapides */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Titre et actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Partenaires
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez vos relations partenaires et suivez leur activité
              {isStale && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  (Données potentiellement obsolètes)
                </span>
              )}
            </p>
          </div>
          <Button
            color="primary"
            onClick={() => router.push('/tableaudebord/partenaire/ajouter')}
            startContent={<Plus className="h-4 w-4" />}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl"
          >
            Nouveau Partenaire
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
            <CardBody className="text-center p-4">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {displayPartners.filter(p => p.statut === 'actif').length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Partenaires Actifs</div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
            <CardBody className="text-center p-4">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {displayPartners.reduce((sum, p) => sum + p.nombreProjets, 0)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Projets Total</div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
            <CardBody className="text-center p-4">
              <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                {displayPartners.filter(p => p.statut === 'inactif').length}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Inactifs</div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800">
            <CardBody className="text-center p-4">
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                {displayPartners.reduce((sum, p) => sum + p.nombreIncidents, 0)}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">Incidents Total</div>
            </CardBody>
          </Card>
        </div>
      </motion.div>

      {/* Table virtualisée haute performance */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isLoading ? (
          <SkeletonTable rows={6} className="space-y-4" />
        ) : (
          <VirtualizedTable
            data={displayPartners as Partner[]}
            columns={columns}
            onItemClick={(partner) => router.push(`/tableaudebord/partenaire/voir/${partner.id}`)}
            onSelectionChange={handleSelectionChange}
            searchable={true}
            searchFields={["nom", "secteur", "responsable", "email"]}
            sortable={true}
            exportable={true}
            refreshable={true}
            onRefresh={handleRefresh}
            height={600}
            virtual={displayPartners.length > 50}
            emptyMessage="Aucun partenaire trouvé. Créez votre premier partenaire !"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          />
        )}
      </motion.div>
    </div>
  );
};

export default OptimizedPartnerList;