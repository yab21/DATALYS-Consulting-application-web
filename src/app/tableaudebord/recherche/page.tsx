'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardBody, CardHeader, Divider } from '@nextui-org/react';
import AdvancedSearch from '@/components/Search/AdvancedSearch';
import SearchResults from '@/components/Search/SearchResults';
import { SearchResult } from '@/services/search';
import { useRouter } from 'next/navigation';

export default function RecherchePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const handleSearchResults = useCallback((results: SearchResult[], total: number) => {
    setSearchResults(results);
    setTotalResults(total);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

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
        router.push(`/tableaudebord/projet/${result.id}`);
        break;
      case 'file':
        // Ouvrir le fichier ou aller à sa page de détails
        if (result.file_path) {
          window.open(`/api/files/serve/${result.file_path}`, '_blank');
        }
        break;
      case 'folder':
        router.push(`/tableaudebord/lesdossiers?folder=${result.id}`);
        break;
      case 'partner':
        router.push(`/tableaudebord/partenaires/${result.id}`);
        break;
      case 'user':
        router.push(`/tableaudebord/utilisateur/${result.id}`);
        break;
      case 'incident':
        router.push(`/tableaudebord/incidents/${result.id}`);
        break;
      default:
        console.log('Type de résultat non géré:', result.type);
    }
  }, [router]);

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

      {/* Interface de recherche */}
      <div className="mb-6">
        <AdvancedSearch
          onResults={handleSearchResults}
          onLoading={handleLoadingChange}
        />
      </div>

      <Divider className="my-6" />

      {/* Résultats de recherche */}
      <div>
        <SearchResults
          results={searchResults}
          total={totalResults}
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
            <h3 className="text-lg font-semibold">Conseils de recherche</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium mb-2">Recherche textuelle :</h4>
                <ul className="space-y-1">
                  <li>• Utilisez des mots-clés pertinents</li>
                  <li>• Essayez des termes plus généraux</li>
                  <li>• Vérifiez l'orthographe</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Filtres avancés :</h4>
                <ul className="space-y-1">
                  <li>• Sélectionnez un type de contenu spécifique</li>
                  <li>• Utilisez les filtres de date</li>
                  <li>• Filtrez par statut ou priorité</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}