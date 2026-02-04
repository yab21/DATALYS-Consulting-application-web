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
  Select,
  SelectItem,
} from "@heroui/react";
import { 
  Save, 
  X, 
  Upload,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Globe,
  UserPlus
} from "lucide-react";
import { Partner, UpdatePartnerFormData, CreatePartnerData, CreatePartnerFormData, partnersService } from "@/services/partners";
import { useAuth } from "@/context/AuthContext";
import { extractBackendMessage } from "@/lib/error-handler";
import { validateFileImmediately } from '@/lib/upload-security-immediate';

interface PartnerModalsProps {
  isOpen: boolean;
  type: 'edit' | 'delete' | 'view' | 'create' | null;
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
  country_code: string;
  address: string;
  logo?: File;
}

interface CreateFormData {
  name: string;
  email: string;
  phone: string;
  country_code: string;
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
    country_code: '+237',
    address: '',
    logo: undefined
  });
  
  // États pour le formulaire de création
  const [createForm, setCreateForm] = useState<CreateFormData>({
    name: '',
    email: '',
    phone: '',
    country_code: '+237',
    address: '',
    logo: undefined
  });
  
  const [editLoading, setEditLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [createLogoPreview, setCreateLogoPreview] = useState<string | null>(null);
  const [removeExistingLogo, setRemoveExistingLogo] = useState(false);
  

  // Initialiser le formulaire avec les données du partenaire
  useEffect(() => {
    if (partner && type === 'edit') {
      setEditForm({
        name: partner?.name || '',
        email: partner?.email || '',
        phone: partner?.phone || '',
        country_code: partner?.country_code || '+237', // Utiliser le country_code existant ou valeur par défaut
        address: partner?.address || '',
        logo: undefined
      });
      setLogoPreview(null);
      setRemoveExistingLogo(false);
    }
  }, [partner, type]);

  // Fonction utilitaire pour corriger les URLs d'images
  const fixImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    
    if (url.includes('82.112.253.137:8082/files/serve/')) {
      return url.replace('http://82.112.253.137:8082', '/api');
    }
    
    if (url.includes('localhost:8081')) {
      const pathMatch = url.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
      } else {
        return url.replace('localhost:8081', '')
                  .replace('/uploads/', `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/`);
      }
    }
    
    if (url.includes('82.112.253.137:8081/uploads/') || url.includes('/uploads/')) {
      const pathMatch = url.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
      }
    }
    
    if (url.startsWith('/uploads/logos/')) {
      const filename = url.replace('/uploads/logos/', '');
      return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
    }
    
    return url;
  };

  // Gestion des changements dans le formulaire
  const handleEditFormChange = (field: keyof EditFormData, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Gestion de l'upload de logo pour l'édition
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation de sécurité du fichier
      const validation = validateFileImmediately(file);
      if (!validation.valid) {
        onError?.(validation.error || "Fichier non autorisé");
        event.target.value = '';
        return;
      }

      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        onError?.("Seuls les fichiers image sont autorisés pour le logo");
        event.target.value = '';
        return;
      }

      setEditForm(prev => ({ ...prev, logo: file }));

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour supprimer le logo d'édition
  const handleRemoveEditLogo = () => {
    if (logoPreview) {
      // Cas 1: Supprimer un nouveau logo uploadé
      setEditForm(prev => ({ ...prev, logo: undefined }));
      setLogoPreview(null);
      // Réinitialiser l'input file
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } else {
      // Cas 2: Marquer le logo existant pour suppression
      setRemoveExistingLogo(true);
    }
  };

  // Gestion de l'upload de logo pour la création
  const handleCreateLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation de sécurité du fichier
      const validation = validateFileImmediately(file);
      if (!validation.valid) {
        onError?.(validation.error || "Fichier non autorisé");
        event.target.value = '';
        return;
      }

      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        onError?.("Seuls les fichiers image sont autorisés pour le logo");
        event.target.value = '';
        return;
      }

      setCreateForm(prev => ({ ...prev, logo: file }));

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setCreateLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour supprimer le logo de création
  const handleRemoveCreateLogo = () => {
    setCreateForm(prev => ({ ...prev, logo: undefined }));
    setCreateLogoPreview(null);
    // Réinitialiser l'input file
    const fileInput = document.getElementById('create-logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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
        country_code: editForm.country_code,
        address: editForm.address,
        logo: editForm.logo
      };

      // Si l'utilisateur a choisi de supprimer le logo existant, on n'envoie pas de logo
      if (removeExistingLogo && !editForm.logo) {
        // Note: L'API pourrait ne pas supporter la suppression de logo
        // Dans ce cas, on garde le logo existant
        console.log('⚠️ Suppression de logo demandée, mais pas encore supportée par l\'API');
      }

      console.log('🔄 Modal - Données de modification:', {
        partnerId: partner.id,
        partnerIdType: typeof partner.id,
        userId: user.id,
        updateData,
        partner
      });

      const result = await partnersService.updatePartner(partner.id, updateData, user.id);
      
      if (result.code === 200 || result.code === 201) {
        const successMessage = extractBackendMessage(result) || result.message?.message;
        onSuccess?.(successMessage);
        if (result.logoUploadError) {
          // Log warning au lieu d'une notification d'erreur pour les problèmes de logo
          console.warn('⚠️ Problème logo:', result.logoUploadError);
        }
        onRefresh();
        onClose();
      } else {
        onError?.(extractBackendMessage(result) || result.message?.message);
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      
      onError?.(extractBackendMessage(error));
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
      
      if (result.code === 200 || result.code === 201) {
        const successMessage = extractBackendMessage(result) || result.message?.message;
        onSuccess?.(successMessage);
        onRefresh();
        onClose();
      } else {
        onError?.(extractBackendMessage(result) || result.message?.message);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      
      onError?.(extractBackendMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Gestion des changements dans le formulaire de création
  const handleCreateFormChange = (field: keyof CreateFormData, value: any) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour créer un partenaire
  const handleCreateSubmit = async () => {
    if (!user) return;

    setCreateLoading(true);
    try {
      const partnerData: CreatePartnerFormData = {
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone,
        country_code: createForm.country_code,
        address: createForm.address,
        is_active: true,
        logo: createForm.logo
      };
      
      const result = await partnersService.createPartner(partnerData, user.id);
      
      if (result.code === 200 || result.code === 201) {
        const successMessage = extractBackendMessage(result) || result.message?.message;
        onSuccess?.(successMessage);
        if (result.logoUploadError) {
          // Utiliser warning au lieu d'error pour les problèmes de logo
          console.warn('⚠️ Problème logo:', result.logoUploadError);
        }
        onRefresh();
        onClose();
        // Réinitialiser le formulaire
        setCreateForm({
          name: '',
          email: '',
          phone: '',
          country_code: '+237',
          address: '',
          logo: undefined
        });
        setCreateLogoPreview(null);
      } else {
        onError?.(extractBackendMessage(result) || result.message?.message);
      }
    } catch (error) {
      console.error('Erreur création:', error);

      // Afficher la notification d'erreur
      onError?.(extractBackendMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  // Validation du formulaire de création
  const isCreateFormValid = () => {
    return createForm.name.trim() && 
           createForm.email.trim() && 
           createForm.phone.trim() && 
           createForm.country_code.trim() && 
           createForm.address.trim();
  };

  // Réinitialiser le formulaire de création quand le modal s'ouvre
  useEffect(() => {
    if (type === 'create' && isOpen) {
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        country_code: '+237',
        address: '',
        logo: undefined
      });
      setCreateLogoPreview(null);
    }
  }, [type, isOpen]);

  // Validation du formulaire
  const isFormValid = () => {
    return editForm.name.trim() && 
           editForm.email.trim() && 
           editForm.phone.trim() && 
           editForm.country_code.trim() && 
           editForm.address.trim();
  };

  // Liste des codes pays
  const COUNTRY_CODES = [
    { code: "+237", name: "Cameroun", flag: "🇨🇲" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+1", name: "États-Unis", flag: "🇺🇸" },
    { code: "+44", name: "Royaume-Uni", flag: "🇬🇧" },
    { code: "+49", name: "Allemagne", flag: "🇩🇪" },
    { code: "+34", name: "Espagne", flag: "🇪🇸" },
    { code: "+39", name: "Italie", flag: "🇮🇹" },
    { code: "+41", name: "Suisse", flag: "🇨🇭" },
    { code: "+32", name: "Belgique", flag: "🇧🇪" },
    { code: "+225", name: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "+221", name: "Sénégal", flag: "🇸🇳" },
    { code: "+212", name: "Maroc", flag: "🇲🇦" },
    { code: "+213", name: "Algérie", flag: "🇩🇿" },
    { code: "+216", name: "Tunisie", flag: "🇹🇳" },
  ];

  if (!partner && type !== 'create') return null;

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
                {partner?.logo_url ? (
                  <img
                    src={fixImageUrl(partner?.logo_url)!}
                    alt={partner?.name}
                    className="h-full w-full object-cover p-2"
                  />
                ) : (
                  <div className="text-2xl font-bold text-gray-500 dark:text-gray-200">
                    {partner?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {partner?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{partner?.email}</p>
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
                        <p className="font-medium">{partner?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                        <p className="font-medium">{partner?.phone_formatted || partner?.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                        <p className="font-medium">{partner?.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                        <Chip
                          color={partner?.is_active ? "success" : "warning"}
                          size="sm"
                          variant="flat"
                        >
                          {partner?.is_active ? "Actif" : "Inactif"}
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
                        {new Date(partner?.created_at || '').toLocaleDateString('fr-FR', {
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
                      <>
                        <img
                          src={logoPreview}
                          alt="Aperçu"
                          className="h-full w-full object-cover"
                        />
                        {/* Bouton pour supprimer le logo */}
                        <button
                          type="button"
                          onClick={handleRemoveEditLogo}
                          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg border-2 border-white z-10"
                          title="Supprimer le logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : partner && partner.logo_url && fixImageUrl(partner.logo_url) && !removeExistingLogo ? (
                      <>
                        <img
                          src={fixImageUrl(partner.logo_url)!}
                          alt={partner?.name}
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
                        {/* Bouton pour supprimer le logo existant */}
                        <button
                          type="button"
                          onClick={handleRemoveEditLogo}
                          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg border-2 border-white z-10"
                          title="Supprimer le logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                    <div 
                      className="fallback-logo absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-400"
                      style={{ display: (logoPreview || (partner && partner.logo_url && fixImageUrl(partner.logo_url) && !removeExistingLogo)) ? 'none' : 'flex' }}
                    >
                      {partner ? partner?.name?.charAt(0).toUpperCase() : 'P'}
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
                
                <Select
                  label="Code pays"
                  placeholder="Sélectionner un code pays"
                  selectedKeys={editForm.country_code ? [editForm.country_code] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    handleEditFormChange('country_code', value);
                  }}
                  startContent={<Globe className="h-4 w-4" />}
                  isRequired
                  renderValue={(items) => {
                    return items.map((item) => {
                      const country = COUNTRY_CODES.find(c => c.code === item.key);
                      return (
                        <div key={item.key} className="flex items-center gap-2">
                          <span>{country?.flag}</span>
                          <span>{country?.code}</span>
                        </div>
                      );
                    });
                  }}
                >
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                        <span className="text-gray-500">{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                
                <Input
                  label="Téléphone"
                  placeholder="123456789"
                  value={editForm.phone}
                  onValueChange={(value) => handleEditFormChange('phone', value)}
                  startContent={<Phone className="h-4 w-4" />}
                  isRequired
                  description={`Format: ${editForm.country_code}123456789`}
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
                Êtes-vous sûr de vouloir supprimer le partenaire <strong>{partner?.name}</strong> ?
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

  // Modal de création
  if (type === 'create') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        placement="center"
        isDismissable={!createLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[90vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#4ba9b7]/10 p-2">
                <UserPlus className="h-5 w-5 text-[#4ba9b7]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Nouveau Partenaire</h3>
                <p className="text-sm text-gray-600">Créer un nouveau partenaire</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Logo (optionnel)</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                    {createLogoPreview ? (
                      <>
                        <img
                          src={createLogoPreview}
                          alt="Aperçu"
                          className="h-full w-full object-cover"
                        />
                        {/* Bouton pour supprimer le logo */}
                        <button
                          type="button"
                          onClick={handleRemoveCreateLogo}
                          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg border-2 border-white z-10"
                          title="Supprimer le logo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-xl font-bold text-gray-400">
                        P
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCreateLogoChange}
                      className="hidden"
                      id="create-logo-upload"
                    />
                    <label
                      htmlFor="create-logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <Upload className="h-4 w-4" />
                      Choisir un logo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
                  </div>
                </div>
              </div>

              <Divider />

              <Input
                label="Nom du partenaire"
                placeholder="Nom de l'entreprise ou organisation"
               
                onValueChange={(value) => handleCreateFormChange('name', value)}
                startContent={<User className="h-4 w-4" />}
                isRequired
                size="sm"
              />
              
              <Input
                label="Adresse email"
                placeholder="contact@example.com"
                type="email"
               
                onValueChange={(value) => handleCreateFormChange('email', value)}
                startContent={<Mail className="h-4 w-4" />}
                isRequired
                size="sm"
              />
              
              <div className="flex gap-3">
                <Select
                  label="Code pays"
                  placeholder="Sélectionner"
                  selectedKeys={createForm.country_code ? [createForm.country_code] : []}
                  onSelectionChange={(keys) => {
                    const selectedCode = Array.from(keys)[0] as string;
                    if (selectedCode) {
                      handleCreateFormChange('country_code', selectedCode);
                    }
                  }}
                  startContent={<Globe className="h-4 w-4" />}
                  isRequired
                  size="sm"
                  className="w-36"
                  renderValue={(items) => {
                    return items.map((item) => {
                      const country = COUNTRY_CODES.find(c => c.code === item.key);
                      return (
                        <div key={item.key} className="flex items-center gap-2">
                          <span>{country?.flag}</span>
                          <span>{country?.code}</span>
                        </div>
                      );
                    });
                  }}
                >
                  {COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                        <span className="text-gray-500">{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                
                <Input
                  label="Numéro de téléphone"
                  placeholder="123456789"
                 
                  onValueChange={(value) => handleCreateFormChange('phone', value)}
                  startContent={<Phone className="h-4 w-4" />}
                  isRequired
                  size="sm"
                  className="flex-1"
                />
              </div>
              
              <Input
                label="Adresse"
                placeholder="123 Rue Example, Ville, Pays"
               
                onValueChange={(value) => handleCreateFormChange('address', value)}
                startContent={<MapPin className="h-4 w-4" />}
                isRequired
                size="sm"
              />
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={createLoading}
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              onPress={handleCreateSubmit}
              isLoading={createLoading}
              isDisabled={!isCreateFormValid()}
              startContent={!createLoading ? <Save className="h-4 w-4" /> : undefined}
            >
              {createLoading ? 'Création...' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return null;
};

export default PartnerModals;