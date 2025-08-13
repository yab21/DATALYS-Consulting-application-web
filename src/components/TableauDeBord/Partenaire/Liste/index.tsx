"use client";

import React, { useState, useEffect } from "react";
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
  useDisclosure,
} from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import LoadingState from "@/components/UI/Loading/LoadingState";

// Types
interface Partner {
  id: string;
  nom: string;
  logo: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  adresse: string;
  responsable: string;
  dateCreation: Date;
  statut: "actif" | "inactif" | "suspendu";
  nombreProjets: number;
  nombreIncidents: number;
}

// Données mockées des partenaires
const MOCK_PARTNERS: Partner[] = [
  {
    id: "partner-1",
    nom: "TechCorp Solutions",
    logo: "/images/partners/techcorp.png",
    secteur: "Technologie",
    description: "Spécialiste en solutions informatiques d'entreprise",
    email: "contact@techcorp.com",
    telephone: "+33 1 23 45 67 89",
    adresse: "123 Avenue des Champs-Élysées, Paris",
    responsable: "Jean Dupont",
    dateCreation: new Date("2023-01-15"),
    statut: "actif",
    nombreProjets: 12,
    nombreIncidents: 3,
  },
  {
    id: "partner-2",
    nom: "GlobalBank",
    logo: "/images/partners/globalbank.png",
    secteur: "Finance",
    description: "Institution bancaire internationale",
    email: "partenariat@globalbank.fr",
    telephone: "+33 1 98 76 54 32",
    adresse: "456 Rue de la Banque, La Défense",
    responsable: "Marie Martin",
    dateCreation: new Date("2022-11-20"),
    statut: "actif",
    nombreProjets: 8,
    nombreIncidents: 1,
  },
  {
    id: "partner-3",
    nom: "EcoLogistics",
    logo: "/images/partners/ecologistics.png",
    secteur: "Logistique",
    description: "Solutions logistiques durables",
    email: "info@ecologistics.com",
    telephone: "+33 2 11 22 33 44",
    adresse: "789 Boulevard Écologique, Lyon",
    responsable: "Pierre Durand",
    dateCreation: new Date("2023-03-10"),
    statut: "inactif",
    nombreProjets: 5,
    nombreIncidents: 0,
  },
  {
    id: "partner-4",
    nom: "MediHealth Plus",
    logo: "/images/partners/medihealth.png",
    secteur: "Santé",
    description: "Plateforme de santé numérique",
    email: "contact@medihealth.fr",
    telephone: "+33 3 55 66 77 88",
    adresse: "321 Rue de la Santé, Strasbourg",
    responsable: "Sophie Bernard",
    dateCreation: new Date("2023-06-05"),
    statut: "actif",
    nombreProjets: 15,
    nombreIncidents: 2,
  },
];

const ListePartenaires: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("tous");
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Simulation du chargement des données
  useEffect(() => {
    const loadPartners = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPartners(MOCK_PARTNERS);
      setLoading(false);
    };

    loadPartners();
  }, []);

  // Filtrage des partenaires
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.secteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.responsable.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = selectedSector === "tous" || partner.secteur === selectedSector;
    
    return matchesSearch && matchesSector;
  });

  // Obtenir les secteurs uniques
  const sectors = Array.from(new Set(partners.map(p => p.secteur)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif": return "success";
      case "inactif": return "warning";
      case "suspendu": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "actif": return "Actif";
      case "inactif": return "Inactif";
      case "suspendu": return "Suspendu";
      default: return status;
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Liste des Partenaires" />
        <LoadingState
          type="skeleton"
          skeletonVariant="card"
          skeletonCount={6}
        />
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Liste des Partenaires" />
      
      <div className="mx-auto max-w-7xl">
        {/* Header avec statistiques */}
        <motion.div
          className="mb-6 rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark dark:text-white">
                Gestion des Partenaires
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip size="sm" variant="flat" color="primary">
                  {partners.length} partenaires
                </Chip>
                <Chip size="sm" variant="flat" color="success">
                  {partners.filter(p => p.statut === "actif").length} actifs
                </Chip>
                <Chip size="sm" variant="flat" color="secondary">
                  {partners.reduce((sum, p) => sum + p.nombreProjets, 0)} projets
                </Chip>
              </div>
            </div>
            
            <Link href="/tableaudebord/partenaire/ajouter">
              <Button
                color="primary"
                className="font-medium"
                startContent={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                }
              >
                Nouveau Partenaire
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Filtres */}
        <motion.div
          className="mb-6 rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              placeholder="Rechercher un partenaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              startContent={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              }
            />
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedSector === "tous" ? "solid" : "flat"}
                onClick={() => setSelectedSector("tous")}
              >
                Tous
              </Button>
              {sectors.map((sector) => (
                <Button
                  key={sector}
                  size="sm"
                  variant={selectedSector === sector ? "solid" : "flat"}
                  onClick={() => setSelectedSector(sector)}
                >
                  {sector}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Grille des partenaires */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardBody className="p-6">
                  <div className="flex flex-col h-full">
                    {/* Logo et statut */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {partner.logo ? (
                          <Image
                            src={partner.logo}
                            alt={partner.nom}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-400">
                            {partner.nom.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(partner.statut)}
                      >
                        {getStatusText(partner.statut)}
                      </Chip>
                    </div>

                    {/* Informations */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">
                        {partner.nom}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {partner.secteur}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 line-clamp-2">
                        {partner.description}
                      </p>
                      
                      {/* Métriques */}
                      <div className="flex justify-between items-center text-sm mb-4">
                        <div className="text-center">
                          <div className="font-semibold text-primary-600">
                            {partner.nombreProjets}
                          </div>
                          <div className="text-xs text-gray-500">Projets</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">
                            {partner.nombreIncidents}
                          </div>
                          <div className="text-xs text-gray-500">Incidents</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/tableaudebord/partenaire/${partner.id}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="w-full"
                        >
                          Voir Détails
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        onClick={() => {
                          setSelectedPartner(partner);
                          onOpen();
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredPartners.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-gray-400 mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Aucun partenaire trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </motion.div>
        )}
      </div>

      {/* Modal de prévisualisation */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {selectedPartner && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {selectedPartner.logo ? (
                      <Image
                        src={selectedPartner.logo}
                        alt={selectedPartner.nom}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-lg font-bold text-gray-400">
                        {selectedPartner.nom.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPartner.nom}</h3>
                    <p className="text-sm text-gray-500">{selectedPartner.secteur}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPartner.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Email</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPartner.email}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Téléphone</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPartner.telephone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Responsable</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPartner.responsable}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
                      <div className="text-lg font-semibold text-primary-600">{selectedPartner.nombreProjets}</div>
                      <div className="text-xs text-gray-500">Projets actifs</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex-1">
                      <div className="text-lg font-semibold text-orange-600">{selectedPartner.nombreIncidents}</div>
                      <div className="text-xs text-gray-500">Incidents ouverts</div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Fermer
                </Button>
                <Link href={`/tableaudebord/partenaire/${selectedPartner.id}`}>
                  <Button color="primary">
                    Voir Détails Complets
                  </Button>
                </Link>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ListePartenaires;