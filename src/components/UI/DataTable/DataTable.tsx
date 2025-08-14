"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  Selection,
  Card,
  CardBody,
  Spinner,
  cn,
} from "@nextui-org/react";
import { motion } from "framer-motion";

// Types
export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: "start" | "center" | "end";
  render?: (value: any, item: any) => React.ReactNode;
  type?: "text" | "number" | "date" | "boolean" | "enum";
  enumOptions?: { value: any; label: string; color?: string }[];
}

export interface DataTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (keys: Selection) => void;
  onRowAction?: (key: string, action: string) => void;
  actions?: {
    key: string;
    label: string;
    color?:
      | "default"
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "danger";
    icon?: React.ReactNode;
  }[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyContent?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  loading = false,
  selectable = false,
  onSelectionChange,
  onRowAction,
  actions = [],
  searchable = true,
  searchPlaceholder = "Rechercher...",
  pageSize = 10,
  emptyContent,
  className,
  title,
  subtitle,
}) => {
  // États locaux
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: "ascending" | "descending";
  }>({ column: "", direction: "ascending" });
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [page, setPage] = useState(1);

  // Filtrage des données
  const filteredItems = useMemo(() => {
    let filteredData = [...data];

    // Filtre de recherche textuelle
    if (filterValue) {
      filteredData = filteredData.filter((item) =>
        columns.some((column) => {
          const value = item[column.key];
          if (value == null) return false;
          return value
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }),
      );
    }

    // Filtre de statut (si applicable)
    if (statusFilter !== "all" && Array.from(statusFilter).length !== 0) {
      const statusValues = Array.from(statusFilter);
      filteredData = filteredData.filter((item) =>
        statusValues.some((status) => {
          // Chercher une colonne de type enum pour le statut
          const statusColumn = columns.find((col) => col.type === "enum");
          if (statusColumn) {
            return item[statusColumn.key] === status;
          }
          return false;
        }),
      );
    }

    return filteredData;
  }, [data, filterValue, statusFilter, columns]);

  // Tri des données
  const sortedItems = useMemo(() => {
    if (!sortDescriptor.column) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];

      let cmp = 0;
      if (aValue < bValue) cmp = -1;
      else if (aValue > bValue) cmp = 1;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  // Pagination
  const pages = Math.ceil(sortedItems.length / pageSize);
  const items = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.slice(start, end);
  }, [page, sortedItems, pageSize]);

  // Gestionnaires d'événements
  const onSearchChange = useCallback((value: string) => {
    setFilterValue(value);
    setPage(1);
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      setSelectedKeys(keys);
      onSelectionChange?.(keys);
    },
    [onSelectionChange],
  );

  const renderCell = useCallback(
    (item: any, columnKey: string) => {
      const column = columns.find((col) => col.key === columnKey);
      const cellValue = item[columnKey];

      if (column?.render) {
        return column.render(cellValue, item);
      }

      switch (column?.type) {
        case "boolean":
          return (
            <Chip
              size="sm"
              variant="flat"
              color={cellValue ? "success" : "default"}
            >
              {cellValue ? "Oui" : "Non"}
            </Chip>
          );
        case "enum":
          const option = column.enumOptions?.find(
            (opt) => opt.value === cellValue,
          );
          return (
            <Chip
              size="sm"
              variant="flat"
              color={(option?.color as any) || "default"}
            >
              {option?.label || cellValue}
            </Chip>
          );
        case "date":
          return cellValue
            ? new Date(cellValue).toLocaleDateString("fr-FR")
            : "-";
        case "number":
          return typeof cellValue === "number"
            ? cellValue.toLocaleString("fr-FR")
            : cellValue;
        default:
          return cellValue || "-";
      }
    },
    [columns],
  );

  // Options de statut pour le filtre
  const statusOptions = useMemo(() => {
    const statusColumn = columns.find((col) => col.type === "enum");
    return statusColumn?.enumOptions || [];
  }, [columns]);

  // En-tête de la table
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        {(title || subtitle) && (
          <div className="flex flex-col gap-1">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {subtitle && (
              <p className="text-small text-default-400">{subtitle}</p>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div className="flex gap-3">
            {searchable && (
              <Input
                isClearable
                className="w-full sm:max-w-[44%]"
                placeholder={searchPlaceholder}
                startContent={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                }
                value={filterValue}
                onClear={onClear}
                onValueChange={onSearchChange}
              />
            )}

            {statusOptions.length > 0 && (
              <Dropdown>
                <DropdownTrigger className="hidden sm:flex">
                  <Button
                    endContent={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    }
                    variant="flat"
                  >
                    Statut
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Table Columns"
                  closeOnSelect={false}
                  selectedKeys={statusFilter}
                  selectionMode="multiple"
                  onSelectionChange={setStatusFilter}
                >
                  {statusOptions.map((status) => (
                    <DropdownItem key={status.value} className="capitalize">
                      {status.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
          </div>

          {/* Suppression des boutons d'action globaux - ils ne sont pas nécessaires */}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">
            Total {filteredItems.length} résultat
            {filteredItems.length > 1 ? "s" : ""}
          </span>
          {selectable && selectedKeys !== "all" && selectedKeys.size > 0 && (
            <span className="text-small text-default-400">
              {selectedKeys.size} sur {filteredItems.length} sélectionné
              {selectedKeys.size > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    );
  }, [
    title,
    subtitle,
    searchable,
    searchPlaceholder,
    filterValue,
    statusOptions,
    statusFilter,
    actions,
    filteredItems.length,
    selectable,
    selectedKeys,
    onClear,
    onSearchChange,
    onRowAction,
  ]);

  // Pied de la table
  const bottomContent = useMemo(() => {
    return (
      <div className="flex items-center justify-between px-2 py-2">
        <span className="w-[30%] text-small text-default-400">
          {selectable && (
            <>
              {selectedKeys === "all" && "Tous les éléments sélectionnés"}
              {selectedKeys !== "all" &&
                `${selectedKeys.size} sélectionné${selectedKeys.size > 1 ? "s" : ""}`}
            </>
          )}
        </span>

        {pages > 1 && (
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={setPage}
          />
        )}

        <div className="hidden w-[30%] justify-end gap-2 sm:flex">
          <Button
            isDisabled={pages <= 1}
            size="sm"
            variant="flat"
            onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Précédent
          </Button>
          <Button
            isDisabled={pages <= 1}
            size="sm"
            variant="flat"
            onPress={() => setPage((prev) => Math.min(prev + 1, pages))}
          >
            Suivant
          </Button>
        </div>
      </div>
    );
  }, [selectable, selectedKeys, page, pages]);

  if (loading) {
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-default-400">Chargement des données...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Table
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: "max-h-[400px]",
        }}
        selectedKeys={selectedKeys}
        selectionMode={selectable ? "multiple" : "none"}
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={handleSelectionChange}
        onSortChange={(descriptor) => setSortDescriptor({
          column: descriptor.column as string,
          direction: descriptor.direction as "ascending" | "descending"
        })}
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn
              key={column.key}
              align={column.align || "start"}
              allowsSorting={column.sortable}
              width={column.width as any}
            >
              {column.label}
            </TableColumn>
          ))}
        </TableHeader>

        <TableBody
          emptyContent={
            emptyContent || (
              <div className="py-8 text-center">
                <div className="mb-2 text-4xl">📄</div>
                <p className="font-medium text-default-400">
                  Aucune donnée disponible
                </p>
                <p className="mt-1 text-tiny text-default-300">
                  Les données apparaîtront ici une fois ajoutées
                </p>
              </div>
            )
          }
          items={items}
        >
          {(item) => (
            <TableRow key={item.id || item.key}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as string)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
};

export default DataTable;
