'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  CardBody, 
  Select, 
  SelectItem,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  X, 
  Save, 
  BookmarkPlus,
  Clock,
  FileText,
  Users,
  FolderOpen,
  AlertCircle,
  Building
} from 'lucide-react';
import { searchService, SearchFilters, SearchResult, SearchOptions } from '@/services/search';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';

interface AdvancedSearchProps {
  onResults?: (results: SearchResult[], total: number) => void;
  onLoading?: (loading: boolean) => void;
  initialFilters?: SearchFilters;
  className?: string;
}

const ENTITY_TYPES = [
  { key: 'all', label: 'Tout', icon: Search },
  { key: 'projects', label: 'Projets', icon: FolderOpen },
  { key: 'files', label: 'Fichiers', icon: FileText },
  { key: 'folders', label: 'Dossiers', icon: FolderOpen },
  { key: 'partners', label: 'Partenaires', icon: Building },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'incidents', label: 'Incidents', icon: AlertCircle }
];

const STATUS_OPTIONS = [
  { key: 'all', label: 'Tous les statuts' },
  { key: 'actif', label: 'Actif' },
  { key: 'inactif', label: 'Inactif' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'termine', label: 'Terminé' },
  { key: 'ouvert', label: 'Ouvert' },
  { key: 'ferme', label: 'Fermé' }
];

const PRIORITY_OPTIONS = [
  { key: 'all', label: 'Toutes les priorités' },
  { key: 'basse', label: 'Basse' },
  { key: 'moyenne', label: 'Moyenne' },
  { key: 'haute', label: 'Haute' },
  { key: 'critique', label: 'Critique' }
];

export default function AdvancedSearch({ 
  onResults, 
  onLoading, 
  initialFilters = {},
  className = ''
}: AdvancedSearchProps) {
  const { isPartner } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { isOpen: isSaveModalOpen, onOpen: onSaveModalOpen, onClose: onSaveModalClose } = useDisclosure();
  const [saveName, setSaveName] = useState('');

  // Debounce pour la recherche automatique
  const debouncedQuery = useDebounce(filters.query || '', 500);

  // Options de recherche
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    index: 0,
    size: 20,
    sort_by: 'updated_at',
    sort_order: 'desc'
  });

  // Effectuer la recherche
  const performSearch = useCallback(async () => {
    if (!debouncedQuery && Object.keys(filters).length === 1) {
      setResults([]);
      setTotal(0);
      onResults?.([], 0);
      return;
    }

    setLoading(true);
    onLoading?.(true);

    try {
      const response = await searchService.globalSearch(filters, searchOptions);
      setResults(response.results);
      setTotal(response.total);
      onResults?.(response.results, response.total);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
      setTotal(0);
      onResults?.([], 0);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }, [debouncedQuery, filters, searchOptions, onResults, onLoading]);

  // Déclencher la recherche quand les filtres changent
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Mettre à jour les filtres
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || value === '' ? undefined : value
    }));
    setSearchOptions(prev => ({ ...prev, index: 0 })); // Reset pagination
  };

  // Effacer tous les filtres
  const clearFilters = () => {
    setFilters({});
    setSelectedTags([]);
    setSearchOptions(prev => ({ ...prev, index: 0 }));
  };

  // Ajouter un tag de filtre
  const addFilterTag = (label: string, value: string) => {
    if (!selectedTags.includes(label)) {
      setSelectedTags(prev => [...prev, label]);
    }
  };

  // Supprimer un tag de filtre
  const removeFilterTag = (label: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== label));
    // Aussi supprimer le filtre correspondant
    // Cette logique peut être améliorée selon vos besoins
  };

  // Sauvegarder la recherche
  const saveSearch = async () => {
    if (!saveName.trim()) return;

    try {
      await searchService.saveSearch(saveName, filters);
      onSaveModalClose();
      setSaveName('');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Filtrer les types d'entités selon les permissions
  const availableEntityTypes = ENTITY_TYPES.filter(type => {
    if (type.key === 'all') return true;
    if (isPartner() && ['partners', 'users'].includes(type.key)) return false;
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche principale */}
      <Card>
        <CardBody className="p-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Rechercher dans tous vos contenus..."
             
              onChange={(e) => updateFilter('query', e.target.value)}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              className="flex-1"
              size="lg"
            />
            
            <Button
              variant={showAdvanced ? "solid" : "bordered"}
              color={showAdvanced ? "primary" : "default"}
              onPress={() => setShowAdvanced(!showAdvanced)}
              startContent={<Filter className="w-4 h-4" />}
            >
              Filtres
            </Button>
            
            <Button
              variant="bordered"
              onPress={onSaveModalOpen}
              startContent={<Save className="w-4 h-4" />}
              isDisabled={Object.keys(filters).length === 0}
            >
              Sauvegarder
            </Button>
            
            {loading && <Spinner size="sm" />}
          </div>

          {/* Tags des filtres actifs */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTags.map((tag) => (
                <Chip
                  key={tag}
                  onClose={() => removeFilterTag(tag)}
                  variant="flat"
                  color="primary"
                  size="sm"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Filtres avancés */}
      {showAdvanced && (
        <Card>
          <CardBody className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Type d'entité */}
              <Select
                label="Type de contenu"
                placeholder="Sélectionner un type"
                selectedKeys={filters.entityType ? new Set([filters.entityType]) : new Set(['all'])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateFilter('entityType', value);
                }}
              >
                {availableEntityTypes.map((type) => (
                  <SelectItem key={type.key}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </Select>

              {/* Statut */}
              <Select
                label="Statut"
                placeholder="Sélectionner un statut"
                selectedKeys={filters.status ? new Set([filters.status]) : new Set(['all'])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateFilter('status', value);
                }}
              >
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.key}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>

              {/* Priorité */}
              <Select
                label="Priorité"
                placeholder="Sélectionner une priorité"
                selectedKeys={filters.priority ? new Set([filters.priority]) : new Set(['all'])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateFilter('priority', value);
                }}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <SelectItem key={priority.key}>
                    {priority.label}
                  </SelectItem>
                ))}
              </Select>

              {/* Date de début */}
              <Input
                label="Date de début"
                type="date"
               
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                startContent={<Calendar className="w-4 h-4 text-gray-400" />}
              />

              {/* Date de fin */}
              <Input
                label="Date de fin"
                type="date"
               
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                startContent={<Calendar className="w-4 h-4 text-gray-400" />}
              />

              {/* Actif/Inactif */}
              <Select
                label="État"
                placeholder="Actif/Inactif"
                selectedKeys={filters.is_active !== undefined ? new Set([filters.is_active.toString()]) : new Set(['all'])}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  updateFilter('is_active', value === 'true' ? true : value === 'false' ? false : undefined);
                }}
              >
                <SelectItem key="all">Tous</SelectItem>
                <SelectItem key="true">Actif</SelectItem>
                <SelectItem key="false">Inactif</SelectItem>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                {total > 0 && `${total} résultat${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="light"
                  color="danger"
                  onPress={clearFilters}
                  startContent={<X className="w-4 h-4" />}
                  size="sm"
                >
                  Effacer
                </Button>
                
                <Button
                  color="primary"
                  onPress={performSearch}
                  startContent={<Search className="w-4 h-4" />}
                  size="sm"
                  isLoading={loading}
                >
                  Rechercher
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de sauvegarde */}
      <Modal isOpen={isSaveModalOpen} onClose={onSaveModalClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5" />
              Sauvegarder la recherche
            </div>
          </ModalHeader>
          <ModalBody>
            <Input
              label="Nom de la recherche"
              placeholder="Entrer un nom pour cette recherche"
             
              onChange={(e) => setSaveName(e.target.value)}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onSaveModalClose}>
              Annuler
            </Button>
            <Button 
              color="primary" 
              onPress={saveSearch}
              isDisabled={!saveName.trim()}
            >
              Sauvegarder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}