"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { FixedSizeList as List } from "react-window";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, SortAsc, SortDesc, Download, RefreshCw } from "lucide-react";
import { Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { useApiCache } from "@/hooks/useApiCache";

interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: number;
  render?: (value: any, item: any, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnConfig[];
  itemHeight?: number;
  height?: number;
  searchable?: boolean;
  searchFields?: string[];
  sortable?: boolean;
  filterable?: boolean;
  onItemClick?: (item: T, index: number) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  pageSize?: number;
  virtual?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
}

interface TableRowProps<T> {
  index: number;
  style: any;
  data: {
    items: T[];
    columns: ColumnConfig[];
    onItemClick?: (item: T, index: number) => void;
    selectedItems: Set<number>;
    onItemSelect: (index: number, selected: boolean) => void;
  };
}

const TableRow = <T,>({ index, style, data }: TableRowProps<T>) => {
  const { items, columns, onItemClick, selectedItems, onItemSelect } = data;
  const item = items[index];
  const isSelected = selectedItems.has(index);

  return (
    <motion.div
      style={style}
      className={`
        flex items-center border-b border-gray-200 dark:border-gray-700 
        hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
      onClick={() => onItemClick?.(item, index)}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.1 }}
    >
      {/* Checkbox pour sélection */}
      <div className="w-12 flex justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onItemSelect(index, e.target.checked);
          }}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      </div>

      {/* Colonnes */}
      {columns.map((column) => {
        const value = item[column.key as keyof T];
        return (
          <div
            key={column.key}
            className={`px-4 py-3 text-sm ${column.className || ''}`}
            style={{ width: column.width || 'auto', minWidth: column.width || 150 }}
          >
            {column.render ? column.render(value, item, index) : String(value || '-')}
          </div>
        );
      })}
    </motion.div>
  );
};

export const VirtualizedTable = <T extends Record<string, any>>({
  data,
  columns,
  itemHeight = 60,
  height = 400,
  searchable = true,
  searchFields = [],
  sortable = true,
  filterable = true,
  onItemClick,
  onSelectionChange,
  loading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  pageSize = 50,
  virtual = true,
  exportable = false,
  refreshable = false,
  onRefresh,
}: VirtualizedTableProps<T>) => {
  // États
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);

  // Ref pour la liste virtualisée
  const listRef = useRef<List>(null);

  // Données filtrées et triées
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Recherche
    if (searchQuery && searchFields.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field =>
          String(item[field] || '').toLowerCase().includes(query)
        )
      );
    }

    // Tri
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination (si pas de virtualisation)
    if (!virtual && pageSize > 0) {
      const start = currentPage * pageSize;
      return filtered.slice(start, start + pageSize);
    }

    return filtered;
  }, [data, searchQuery, searchFields, sortConfig, virtual, pageSize, currentPage]);

  // Gestion du tri
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Gestion de la sélection
  const handleItemSelect = useCallback((index: number, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      
      // Notifier le parent
      const selectedData = Array.from(newSet).map(i => processedData[i]);
      onSelectionChange?.(selectedData);
      
      return newSet;
    });
  }, [processedData, onSelectionChange]);

  // Sélectionner tout
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIndices = new Set(processedData.map((_, index) => index));
      setSelectedItems(allIndices);
      onSelectionChange?.(processedData);
    } else {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    }
  }, [processedData, onSelectionChange]);

  // Export des données
  const handleExport = useCallback(() => {
    const selectedData = Array.from(selectedItems).map(i => processedData[i]);
    const dataToExport = selectedData.length > 0 ? selectedData : processedData;
    
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...dataToExport.map(item =>
        columns.map(col => String(item[col.key] || '')).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedItems, processedData, columns]);

  // Données pour la liste virtualisée
  const listData = useMemo(() => ({
    items: processedData,
    columns,
    onItemClick,
    selectedItems,
    onItemSelect: handleItemSelect,
  }), [processedData, columns, onItemClick, selectedItems, handleItemSelect]);

  const allSelected = selectedItems.size === processedData.length && processedData.length > 0;
  const someSelected = selectedItems.size > 0 && selectedItems.size < processedData.length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header avec recherche et actions */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Recherche */}
          {searchable && searchFields.length > 0 && (
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="h-4 w-4 text-gray-400" />}
                className="w-full"
                size="sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {exportable && (
              <Button
                size="sm"
                variant="bordered"
                onClick={handleExport}
                startContent={<Download className="h-4 w-4" />}
              >
                Export ({selectedItems.size || processedData.length})
              </Button>
            )}

            {refreshable && (
              <Button
                size="sm"
                variant="bordered"
                onClick={onRefresh}
                isIconOnly
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* En-tête du tableau */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        {/* Checkbox pour sélectionner tout */}
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>

        {columns.map((column) => (
          <div
            key={column.key}
            className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${
              column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
            }`}
            style={{ width: column.width || 'auto', minWidth: column.width || 150 }}
            onClick={() => column.sortable && sortable && handleSort(column.key)}
          >
            <div className="flex items-center gap-2">
              {column.label}
              {column.sortable && sortable && (
                <div className="flex flex-col">
                  <SortAsc 
                    className={`h-3 w-3 ${
                      sortConfig?.key === column.key && sortConfig.direction === 'asc'
                        ? 'text-primary' 
                        : 'text-gray-400'
                    }`} 
                  />
                  <SortDesc 
                    className={`h-3 w-3 ${
                      sortConfig?.key === column.key && sortConfig.direction === 'desc'
                        ? 'text-primary' 
                        : 'text-gray-400'
                    }`} 
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contenu du tableau */}
      <div style={{ height }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Chargement des données...</p>
              </div>
            </motion.div>
          ) : processedData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
            </motion.div>
          ) : virtual && processedData.length > 100 ? (
            <List
              ref={listRef}
              height={height}
              itemCount={processedData.length}
              itemSize={itemHeight}
              itemData={listData}
              width="100%"
            >
              {TableRow as any}
            </List>
          ) : (
            <div className="overflow-auto h-full">
              {processedData.map((item, index) => (
                <TableRow
                  key={index}
                  index={index}
                  style={{ height: itemHeight }}
                  data={listData}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer avec informations */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {selectedItems.size > 0 
              ? `${selectedItems.size} élément(s) sélectionné(s) sur ` 
              : ''
            }
            {processedData.length} élément(s)
            {data.length !== processedData.length && ` (${data.length} au total)`}
          </span>
          
          {virtual && processedData.length > 100 && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
              Mode virtuel activé
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedTable;