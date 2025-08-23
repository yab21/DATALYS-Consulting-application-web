"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Pagination,
  Card,
  CardBody,
  Skeleton,
} from "@nextui-org/react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

export interface SimpleColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T, value: any) => React.ReactNode;
}

interface SimpleDataTableProps<T> {
  data: T[];
  columns: SimpleColumn<T>[];
  isLoading?: boolean;
  searchable?: boolean;
  onRefresh?: () => void;
  emptyContent?: React.ReactNode;
  className?: string;
  rowsPerPage?: number;
  title?: string;
}

const SimpleDataTable = <T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchable = true,
  onRefresh,
  emptyContent,
  className = "",
  rowsPerPage = 25,
  title
}: SimpleDataTableProps<T>) => {
  const [searchValue, setSearchValue] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<{column: string; direction: "ascending" | "descending"}>({
    column: "",
    direction: "ascending"
  });
  const [page, setPage] = useState(1);

  // Filter and search logic
  const filteredData = useMemo(() => {
    if (!searchValue || !searchable) return data;
    
    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key];
        return value?.toString().toLowerCase().includes(searchValue.toLowerCase());
      })
    );
  }, [data, searchValue, columns, searchable]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortDescriptor.column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];
      
      let cmp = 0;
      if (aValue < bValue) cmp = -1;
      if (aValue > bValue) cmp = 1;
      
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredData, sortDescriptor]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header */}
      {(title || searchable || onRefresh) && (
        <Card>
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {title && (
                isLoading ? (
                  <Skeleton className="h-8 w-48 rounded-lg" />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                )
              )}
              
              <div className="flex items-center gap-2">
                {/* Search */}
                {searchable && (
                  <div className="flex-1 max-w-sm">
                    {isLoading ? (
                      <Skeleton className="h-8 w-64 rounded-lg" />
                    ) : (
                      <Input
                        isClearable
                        placeholder="Rechercher..."
                        startContent={<Search className="h-4 w-4 text-gray-400" />}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onClear={() => setSearchValue("")}
                        variant="bordered"
                        size="sm"
                      />
                    )}
                  </div>
                )}

                {/* Refresh */}
                {onRefresh && (
                  <Button
                    variant="bordered"
                    size="sm"
                    isIconOnly
                    onPress={onRefresh}
                    isLoading={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table
          aria-label="Data table"
          className="min-h-[400px]"
        >
          <TableHeader>
            {columns.map(column => (
              <TableColumn 
                key={column.key}
                allowsSorting={column.sortable}
              >
                <div 
                  className={`flex items-center gap-2 ${column.sortable ? 'cursor-pointer hover:text-primary' : ''}`}
                  onClick={() => {
                    if (column.sortable) {
                      setSortDescriptor(prev => ({
                        column: column.key,
                        direction: prev.column === column.key && prev.direction === "ascending" 
                          ? "descending" 
                          : "ascending"
                      }));
                    }
                  }}
                >
                  {column.label}
                  {sortDescriptor.column === column.key && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center"
                    >
                      {sortDescriptor.direction === "ascending" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </motion.div>
                  )}
                </div>
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            emptyContent={emptyContent || "Aucune donnée disponible"}
            loadingContent={
              <div className="space-y-2">
                {Array.from({ length: Math.min(rowsPerPage, 8) }).map((_, index) => (
                  <div key={index} className="flex gap-4 p-3">
                    {columns.map((column, colIndex) => (
                      <Skeleton
                        key={colIndex}
                        className={`h-4 rounded-lg ${
                          colIndex === 0 ? 'w-32' : 
                          colIndex === 1 ? 'w-48' : 
                          colIndex === 2 ? 'w-24' : 'w-20'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            }
          >
            {paginatedData.map((item, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell key={column.key}>
                    {column.render 
                      ? column.render(item, item[column.key])
                      : item[column.key]
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {sortedData.length} résultat(s) au total
              </span>
              
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                showControls
                showShadow
                color="primary"
                size="sm"
              />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default SimpleDataTable;