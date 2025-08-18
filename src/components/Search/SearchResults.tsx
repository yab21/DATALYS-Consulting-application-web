'use client';

import React from 'react';
import { 
  Card, 
  CardBody, 
  Chip, 
  Button,
  Avatar,
  Pagination,
  Spinner
} from '@nextui-org/react';
import { 
  FileText, 
  FolderOpen, 
  Users, 
  Building, 
  AlertCircle,
  Calendar,
  User,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react';
import { SearchResult } from '@/services/search';
import { formatBytes, formatDate } from '@/lib/utils';

interface SearchResultsProps {
  results: SearchResult[];
  total: number;
  loading?: boolean;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'project':
      return FolderOpen;
    case 'file':
      return FileText;
    case 'folder':
      return FolderOpen;
    case 'partner':
      return Building;
    case 'user':
      return Users;
    case 'incident':
      return AlertCircle;
    default:
      return FileText;
  }
};

const getTypeColor = (type: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  switch (type) {
    case 'project':
      return 'primary';
    case 'file':
      return 'secondary';
    case 'folder':
      return 'default';
    case 'partner':
      return 'success';
    case 'user':
      return 'warning';
    case 'incident':
      return 'danger';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority?: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  switch (priority?.toLowerCase()) {
    case 'critique':
      return 'danger';
    case 'haute':
      return 'warning';
    case 'moyenne':
      return 'primary';
    case 'basse':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusColor = (status?: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  switch (status?.toLowerCase()) {
    case 'actif':
    case 'ouvert':
    case 'en_cours':
      return 'success';
    case 'termine':
    case 'ferme':
      return 'primary';
    case 'inactif':
      return 'danger';
    default:
      return 'default';
  }
};

function SearchResultItem({ 
  result, 
  onResultClick 
}: { 
  result: SearchResult; 
  onResultClick?: (result: SearchResult) => void;
}) {
  const TypeIcon = getTypeIcon(result.type);

  const handleClick = () => {
    onResultClick?.(result);
  };

  const renderMetadata = () => {
    const metadata = [];

    if (result.project_name) {
      metadata.push(
        <div key="project" className="flex items-center gap-1 text-xs text-gray-500">
          <FolderOpen className="w-3 h-3" />
          {result.project_name}
        </div>
      );
    }

    if (result.partner_name) {
      metadata.push(
        <div key="partner" className="flex items-center gap-1 text-xs text-gray-500">
          <Building className="w-3 h-3" />
          {result.partner_name}
        </div>
      );
    }

    if (result.user_name) {
      metadata.push(
        <div key="user" className="flex items-center gap-1 text-xs text-gray-500">
          <User className="w-3 h-3" />
          {result.user_name}
        </div>
      );
    }

    if (result.file_size) {
      metadata.push(
        <div key="size" className="flex items-center gap-1 text-xs text-gray-500">
          <FileText className="w-3 h-3" />
          {formatBytes(result.file_size)}
        </div>
      );
    }

    return metadata;
  };

  const renderActions = () => {
    const actions = [];

    if (result.type === 'file' && result.file_path) {
      actions.push(
        <Button
          key="download"
          size="sm"
          variant="light"
          startContent={<Download className="w-3 h-3" />}
          onClick={(e) => {
            e.stopPropagation();
            // Logique de téléchargement
            window.open(`/api/files/download/${result.id}`, '_blank');
          }}
        >
          Télécharger
        </Button>
      );
    }

    actions.push(
      <Button
        key="view"
        size="sm"
        variant="light"
        color="primary"
        startContent={<Eye className="w-3 h-3" />}
        onClick={handleClick}
      >
        Voir
      </Button>
    );

    return actions;
  };

  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      isPressable
      onPress={handleClick}
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* En-tête avec icône et titre */}
            <div className="flex items-center gap-3 mb-2">
              <Avatar
                icon={<TypeIcon className="w-4 h-4" />}
                className="w-8 h-8"
                color={getTypeColor(result.type)}
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {result.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Chip 
                    size="sm" 
                    color={getTypeColor(result.type)}
                    variant="flat"
                  >
                    {result.type}
                  </Chip>
                  
                  {result.status && (
                    <Chip 
                      size="sm" 
                      color={getStatusColor(result.status)}
                      variant="flat"
                    >
                      {result.status}
                    </Chip>
                  )}
                  
                  {result.priority && (
                    <Chip 
                      size="sm" 
                      color={getPriorityColor(result.priority)}
                      variant="flat"
                    >
                      {result.priority}
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {result.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {result.description}
              </p>
            )}

            {/* Métadonnées */}
            <div className="flex flex-wrap gap-3 mb-3">
              {renderMetadata()}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              Modifié le {formatDate(result.updated_at)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 items-end">
            {renderActions()}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function SearchResults({
  results,
  total,
  loading = false,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onResultClick,
  className = ''
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 mb-4">
          <FileText className="w-12 h-12 mx-auto mb-2" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Aucun résultat trouvé
        </h3>
        <p className="text-gray-500">
          Essayez de modifier vos critères de recherche
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête des résultats */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {total} résultat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
        </div>
        
        {total > pageSize && (
          <div className="text-sm text-gray-500">
            Page {currentPage} sur {totalPages}
          </div>
        )}
      </div>

      {/* Liste des résultats */}
      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            onResultClick={onResultClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            showControls
            color="primary"
          />
        </div>
      )}
    </div>
  );
}