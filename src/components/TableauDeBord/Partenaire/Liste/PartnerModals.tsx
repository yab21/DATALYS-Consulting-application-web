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
  Card,
  CardBody,
  Chip,
  Divider,
} from "@nextui-org/react";
import { 
  Save, 
  X, 
  Upload,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User
} from "lucide-react";
import { Partner, UpdatePartnerFormData, partnersService } from "@/services/partners";
import { useAuth } from "@/context/AuthContext";

interface PartnerModalsProps {
  isOpen: boolean;
  type: 'edit' | 'delete' | 'view' | null;
  partner: Partner | null;
  onClose: () => void;
  onRefresh: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: File;
}

const PartnerModals: React.FC<PartnerModalsProps> = ({
  isOpen,
  type,
  partner,
  onClose,
  onRefresh,
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  
  // États pour le formulaire de modification
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: undefined
  });
  
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Initialiser le formulaire avec les données du partenaire
  useEffect(() => {
    if (partner && type === 'edit') {
      setEditForm({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        address: partner.address,
        logo: undefined
      });
      setLogoPreview(null);
    }
  }, [partner, type]);

  // Fonction utilitaire pour corriger les URLs d'images
  const fixImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    
    if (url.includes('82.112.253.137:8082/files/serve/')) {
      return url.replace('http://82.112.253.137:8082', '/api/proxy');
    }
    
    if (url.includes('localhost:8081')) {
      const pathMatch = url.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `/api/proxy/files/serve/logos/${filename}`;
      } else {
        return url.replace('localhost:8081', '')
                  .replace('/uploads/', '/api/proxy/files/serve/');
      }
    }
    
    if (url.includes('82.112.253.137:8081/uploads/')) {
      const pathMatch = url.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `/api/proxy/files/serve/logos/${filename}`;
      }
    }
    
    if (url.startsWith('/uploads/logos/')) {
      const filename = url.replace('/uploads/logos/', '');
      return `/api/proxy/files/serve/logos/${filename}`;
    }
    
    return url;
  };

  // Gestion des changements dans le formulaire
  const handleEditFormChange = (field: keyof EditFormData, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Gestion de l'upload de logo
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, logo: file }));
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour modifier un partenaire
  const handleEditSubmit = async () => {
    if (!partner || !user) return;

    setEditLoading(true);
    try {
      const updateData: UpdatePartnerFormData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        logo: editForm.logo
      };

      console.log('🔄 Modal - Données de modification:', {
        partnerId: partner.id,
        partnerIdType: typeof partner.id,
        userId: user.id,
        updateData,
        partner
      });

      const result = await partnersService.updatePartner(partner.id, updateData, user.id);
      
      if (result.code === 200) {
        onSuccess?.('Partenaire modifié avec succès');
        if (result.logoUploadError) {
          onError?.(`Attention: ${result.logoUploadError}`);
        }
        onRefresh();
        onClose();
      } else {
        onError?.(result.message?.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      
      // Afficher directement le message de l'API
      let errorMessage = 'Erreur lors de la modification';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour supprimer un partenaire
  const handleDeleteSubmit = async () => {
    if (!partner || !user) return;

    setDeleteLoading(true);
    try {
      const result = await partnersService.deletePartner(partner.id, user.id);
      
      if (result.code === 200) {
        onSuccess?.('Partenaire supprimé avec succès');
        onRefresh();
        onClose();
      } else {
        onError?.(result.message?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      
      // Afficher directement le message de l'API
      let errorMessage = 'Erreur lors de la suppression';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Validation du formulaire
  const isFormValid = () => {
    return editForm.name.trim() && 
           editForm.email.trim() && 
           editForm.phone.trim() && 
           editForm.address.trim();
  };

  if (!partner) return null;

  // Modal de visualisation
  if (type === 'view') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        scrollBehavior="inside"
        placement="center"
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[85vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                {partner.logo_url ? (
                  <img
                    src={fixImageUrl(partner.logo_url)!}
                    alt={partner.name}
                    className="h-full w-full object-cover p-2"
                  />
                ) : (
                  <div className="text-2xl font-bold text-gray-500 dark:text-gray-200">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {partner.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{partner.email}</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <Card>
                <CardBody className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium">{partner.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                        <p className="font-medium">{partner.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                        <p className="font-medium">{partner.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                        <Chip
                          color={partner.is_active ? "success" : "warning"}
                          size="sm"
                          variant="flat"
                        >
                          {partner.is_active ? "Actif" : "Inactif"}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Créé le</p>
                      <p className="font-medium">
                        {new Date(partner.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de modification
  if (type === 'edit') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        placement="center"
        isDismissable={!editLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[90vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <h3 className="text-xl font-bold">Modifier le partenaire</h3>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Aperçu"
                        className="h-full w-full object-cover"
                      />
                    ) : partner && partner.logo_url && fixImageUrl(partner.logo_url) ? (
                      <img
                        src={fixImageUrl(partner.logo_url)!}
                        alt={partner.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-logo');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="fallback-logo absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-400"
                      style={{ display: (logoPreview || (partner && partner.logo_url && fixImageUrl(partner.logo_url))) ? 'none' : 'flex' }}
                    >
                      {partner ? partner.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <Upload className="h-4 w-4" />
                      Changer le logo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Formulaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom"
                  placeholder="Nom du partenaire"
                  value={editForm.name}
                  onValueChange={(value) => handleEditFormChange('name', value)}
                  isRequired
                />
                
                <Input
                  label="Email"
                  placeholder="email@example.com"
                  type="email"
                  value={editForm.email}
                  onValueChange={(value) => handleEditFormChange('email', value)}
                  isRequired
                />
                
                <Input
                  label="Téléphone"
                  placeholder="+33 1 23 45 67 89"
                  value={editForm.phone}
                  onValueChange={(value) => handleEditFormChange('phone', value)}
                  isRequired
                />
              </div>
              
              <Input
                label="Adresse"
                placeholder="Adresse complète"
                value={editForm.address}
                onValueChange={(value) => handleEditFormChange('address', value)}
                isRequired
              />
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={editLoading}
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              onPress={handleEditSubmit}
              isLoading={editLoading}
              isDisabled={!isFormValid()}
              startContent={!editLoading ? <Save className="h-4 w-4" /> : undefined}
            >
              {editLoading ? 'Modification...' : 'Modifier'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de suppression
  if (type === 'delete') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        placement="center"
        isDismissable={!deleteLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Supprimer le partenaire
                </h3>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Êtes-vous sûr de vouloir supprimer le partenaire <strong>{partner.name}</strong> ?
              </p>
              
              <Card className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Attention
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Cette action est irréversible. Le partenaire sera définitivement supprimé 
                        ainsi que toutes ses données associées.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteSubmit}
              isLoading={deleteLoading}
              startContent={!deleteLoading ? <X className="h-4 w-4" /> : undefined}
            >
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return null;
};

export default PartnerModals;