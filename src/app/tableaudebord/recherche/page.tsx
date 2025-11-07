'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardBody, CardHeader, Divider, Button, Chip, Tabs, Tab } from '@nextui-org/react';
import { Clock, Bookmark, TrendingUp } from 'lucide-react';
import AdvancedSearch from '@/components/Search/AdvancedSearch';
import SearchResults from '@/components/Search/SearchResults';
import { SearchResult } from '@/services/search';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RecherchePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<{name: string, query: string}[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPartner } = useAuth();

  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
    
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }

    // Vérifier s'il y a des paramètres de recherche dans l'URL
    const queryParam = searchParams.get('q');
    if (queryParam) {
      // Auto-lancer la recherche avec le paramètre d'URL
      addToRecentSearches(queryParam);
    }
  }, [searchParams]);

  const handleSearchResults = useCallback((results: SearchResult[], total: number, query?: string) => {
    setSearchResults(results);
    setTotalResults(total);
    setCurrentPage(1); // Reset to first page on new search
    
    // Ajouter aux recherches récentes si une requête existe
    if (query && query.trim()) {
      addToRecentSearches(query);
    }
  }, []);

  const addToRecentSearches = (query: string) => {
    const recent = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  };

  const handleQuickSearch = (query: string) => {
    // Trigger search with the quick query
    addToRecentSearches(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Ici, vous pourriez relancer la recherche avec la nouvelle page
    // Pour l'instant, on garde simple avec pagination côté client
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Redirection vers la page appropriée selon le type de résultat
    switch (result.type) {
      case 'project':
        router.push(`/tableaudebord/projet`);
        break;
      case 'file':
        // Ouvrir le fichier ou aller à sa page de détails
        if (result.file_path) {
          window.open(`/api/files/serve/${result.file_path}`, '_blank');
        }
        break;
      case 'folder':
        router.push(`/tableaudebord/lesdossiers`);
        break;
      case 'partner':
        if (!isPartner()) {
          router.push(`/tableaudebord/partenaires`);
        }
        break;
      case 'user':
        if (!isPartner()) {
          router.push(`/tableaudebord/gestion-utilisateurs`);
        }
        break;
      case 'incident':
        router.push(`/tableaudebord/incidents`);
        break;
      default:
        console.log('Type de résultat non géré:', result.type);
    }
  }, [router, isPartner]);

  // Filtrer les résultats selon l'onglet sélectionné
  const filteredResults = selectedTab === 'all' 
    ? searchResults 
    : searchResults.filter(result => result.type === selectedTab);

  // Compter les résultats par type
  const resultCounts = searchResults.reduce((acc, result) => {
    acc[result.type] = (acc[result.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Recherche Avancée
        </h1>
        <p className="text-gray-600">
          Recherchez dans tous vos projets, fichiers, dossiers et communications
        </p>
      </div>

      {/* Recherches rapides */}
      {(recentSearches.length > 0 || savedSearches.length > 0) && (
        <div className="mb-6">
          <Card>
            <CardBody className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recherches récentes */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recherches récentes
                      </h3>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={clearRecentSearches}
                      >
                        Effacer
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((query, index) => (
                        <Chip
                          key={index}
                          variant="flat"
                          color="primary"
                          className="cursor-pointer"
                          onClick={() => handleQuickSearch(query)}
                        >
                          {query}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recherches sauvegardées */}
                {savedSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Recherches sauvegardées
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map((search, index) => (
                        <Chip
                          key={index}
                          variant="flat"
                          color="secondary"
                          className="cursor-pointer"
                          onClick={() => handleQuickSearch(search.query)}
                        >
                          {search.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Interface de recherche */}
      <div className="mb-6">
        <AdvancedSearch
          onResults={handleSearchResults}
          onLoading={handleLoadingChange}
          initialFilters={{ query: searchParams.get('q') || '' }}
        />
      </div>

      <Divider className="my-6" />

      {/* Résultats de recherche avec onglets */}
      <div>
        {searchResults.length > 0 && (
          <div className="mb-4">
            <Tabs 
              selectedKey={selectedTab} 
              onSelectionChange={(key) => setSelectedTab(key as string)}
              color="primary"
              variant="underlined"
            >
              <Tab 
                key="all" 
                title={
                  <div className="flex items-center gap-2">
                    <span>Tous</span>
                    <Chip size="sm" variant="flat">{totalResults}</Chip>
                  </div>
                }
              />
              {Object.entries(resultCounts).map(([type, count]) => (
                <Tab 
                  key={type}
                  title={
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{type === 'file' ? 'Fichiers' : type === 'project' ? 'Projets' : type === 'folder' ? 'Dossiers' : type === 'incident' ? 'Incidents' : type === 'partner' ? 'Partenaires' : type === 'user' ? 'Utilisateurs' : type}</span>
                      <Chip size="sm" variant="flat">{count}</Chip>
                    </div>
                  }
                />
              ))}
            </Tabs>
          </div>
        )}

        <SearchResults
          results={filteredResults}
          total={selectedTab === 'all' ? totalResults : filteredResults.length}
          loading={loading}
          currentPage={currentPage}
          pageSize={20}
          onPageChange={handlePageChange}
          onResultClick={handleResultClick}
        />
      </div>

      {/* Suggestions et aide si aucun résultat */}
      {!loading && searchResults.length === 0 && totalResults === 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Conseils de recherche</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium mb-2 text-primary">Recherche textuelle :</h4>
                <ul className="space-y-1">
                  <li>• Utilisez des mots-clés pertinents</li>
                  <li>• Essayez des termes plus généraux</li>
                  <li>• Vérifiez l'orthographe</li>
                  <li>• Utilisez des synonymes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-primary">Filtres avancés :</h4>
                <ul className="space-y-1">
                  <li>• Sélectionnez un type de contenu spécifique</li>
                  <li>• Utilisez les filtres de date</li>
                  <li>• Filtrez par statut ou priorité</li>
                  <li>• Combinez plusieurs filtres</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-primary">Recherches populaires :</h4>
                <div className="flex flex-wrap gap-2">
                  {['documents', 'projets', 'incidents', 'dossiers'].map((term) => (
                    <Chip
                      key={term}
                      variant="flat"
                      color="secondary"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleQuickSearch(term)}
                    >
                      {term}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}