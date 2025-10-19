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
  Textarea,
  Select,
  SelectItem,
  useDisclosure,
} from "@nextui-org/react";
import { AlertTriangle, Plus } from "lucide-react";
import { IncidentsService, type CreateIncidentData } from "@/services/incidents";
import { type Project } from "@/services/projects";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";

interface CreateIncidentModalProps {
  partnerId: string;
  partnerName: string;
  projects: Project[];
  onIncidentCreated?: () => void;
}

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  partnerId,
  partnerName,
  projects,
  onIncidentCreated,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { showNotification } = useSimpleNotifications();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateIncidentData>({
    title: "",
    description: "",
    type: "incident",
    priority: "P2",
    status: "nouveau",
    category: "technique",
    impact: "genant",
    domain: "application",
    declarant_name: partnerName, // Pré-rempli avec le nom du partenaire
    user_id: 0,
    project_id: 0,
    is_active: true,
    is_read: false,
    resolution_notes: ""
  });

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      console.log("🔧 Modal ouvert, projets disponibles:", projects);
      setFormData({
        title: "",
        description: "",
        type: "incident",
        priority: "P2",
        status: "nouveau",
        category: "technique",
        impact: "genant",
        domain: "application",
        declarant_name: partnerName,
        user_id: 0,
        project_id: 0,
        is_active: true,
        is_read: false,
        resolution_notes: ""
      });
    }
  }, [isOpen, partnerName, projects]);

  const handleCreateIncident = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log("🚀 Création d'incident avec données:", formData);
      await IncidentsService.createIncident(formData);
      
      onClose();
      showNotification(simpleNotificationHelpers.success(
        "Incident créé avec succès",
        `L'incident "${formData.title}" a été signalé`
      ));
      
      // Recharger les incidents
      onIncidentCreated?.();
      
    } catch (error: any) {
      console.error("❌ Erreur création incident:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur de création",
        error.message || "Impossible de créer l'incident"
      ));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.description.trim() && formData.project_id > 0;

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        startContent={<Plus className="h-4 w-4" />}
        className="bg-[#4ba9b7] hover:bg-[#3d8b96] text-white"
        size="sm"
      >
        Signaler incident
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white dark:bg-gray-900",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#4ba9b7]/10 p-2">
                <AlertTriangle className="h-5 w-5 text-[#4ba9b7]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Signaler un incident
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Partenaire: {partnerName}
                </p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titre de l'incident"
                placeholder="Ex: Problème de connectivité serveur..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                isRequired
                variant="bordered"
                classNames={{
                  label: "text-gray-700 dark:text-gray-300",
                  input: "text-gray-900 dark:text-white",
                  inputWrapper: "border-gray-200 dark:border-gray-700"
                }}
              />
              
              <Textarea
                label="Description détaillée"
                placeholder="Décrivez le problème rencontré, les symptômes observés, l'impact sur le projet..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                minRows={4}
                isRequired
                variant="bordered"
                classNames={{
                  label: "text-gray-700 dark:text-gray-300",
                  input: "text-gray-900 dark:text-white",
                  inputWrapper: "border-gray-200 dark:border-gray-700"
                }}
              />
              
              <Select
                label="Projet concerné"
                placeholder={projects.length > 0 ? "Sélectionnez le projet impacté" : "Aucun projet disponible"}
                selectedKeys={formData.project_id > 0 ? new Set([formData.project_id.toString()]) : new Set()}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  console.log("🎯 Projet sélectionné:", selectedKey);
                  setFormData(prev => ({ 
                    ...prev, 
                    project_id: parseInt(selectedKey) || 0
                  }));
                }}
                isRequired
                isDisabled={projects.length === 0}
                variant="bordered"
                classNames={{
                  label: "text-gray-700 dark:text-gray-300",
                  trigger: "border-gray-200 dark:border-gray-700",
                  value: "text-gray-900 dark:text-white"
                }}
              >
                {projects.filter(p => p.is_active && !p.is_deleted).map((project) => (
                  <SelectItem key={project.title}>
                    {project.title}
                  </SelectItem>
                ))}
              </Select>
              
              {projects.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  ⚠️ Aucun projet actif trouvé pour ce partenaire. Veuillez d'abord créer un projet.
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Priorité"
                  selectedKeys={new Set([formData.priority || "P2"])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFormData(prev => ({ 
                      ...prev, 
                      priority: selectedKey as any || "P2"
                    }));
                  }}
                  variant="bordered"
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300",
                    trigger: "border-gray-200 dark:border-gray-700",
                    value: "text-gray-900 dark:text-white"
                  }}
                >
                  <SelectItem key="P0">🔴 P0 - Critique</SelectItem>
                  <SelectItem key="P1">🟠 P1 - Haute</SelectItem>
                  <SelectItem key="P2">🟡 P2 - Moyenne</SelectItem>
                  <SelectItem key="P3">🟢 P3 - Faible</SelectItem>
                  <SelectItem key="P4">⚪ P4 - Très faible</SelectItem>
                </Select>
                
                <Select
                  label="Statut initial"
                  selectedKeys={new Set([formData.status || "nouveau"])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFormData(prev => ({ 
                      ...prev, 
                      status: selectedKey as any || "nouveau"
                    }));
                  }}
                  variant="bordered"
                  classNames={{
                    label: "text-gray-700 dark:text-gray-300",
                    trigger: "border-gray-200 dark:border-gray-700",
                    value: "text-gray-900 dark:text-white"
                  }}
                >
                  <SelectItem key="nouveau">🔵 Nouveau</SelectItem>
                  <SelectItem key="en_cours">🟡 En cours</SelectItem>
                  <SelectItem key="en_attente">⚪ En attente</SelectItem>
                  <SelectItem key="en_arbitrage">🟣 En arbitrage</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button
              variant="light"
              onPress={onClose}
              isDisabled={loading}
              className="text-gray-600 dark:text-gray-400"
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateIncident}
              isLoading={loading}
              isDisabled={!isFormValid}
              className="bg-[#4ba9b7] hover:bg-[#3d8b96] text-white"
            >
              {loading ? "Création..." : "Créer l'incident"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateIncidentModal;