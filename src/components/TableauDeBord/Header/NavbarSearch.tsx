"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import {
  Search,
  X,
  FolderOpen,
  FileText,
  AlertTriangle,
  Building2,
  Users,
  Headphones,
  ArrowRight,
  Command,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { searchService, SearchResult, SearchFilters } from "@/services/search";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpiredError } from "@/lib/api-interceptor";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  project: {
    label: "Projets",
    icon: <FolderOpen className="w-4 h-4" />,
    color: "text-[#4ba9b7]",
    bg: "bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20",
  },
  file: {
    label: "Fichiers",
    icon: <FileText className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  partner: {
    label: "Partenaires",
    icon: <Building2 className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  user: {
    label: "Utilisateurs",
    icon: <Users className="w-4 h-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  folder: {
    label: "Dossiers",
    icon: <FolderOpen className="w-4 h-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  incident: {
    label: "Incidents",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
};

const MAX_PER_GROUP = 3;

// Le service retourne les types au pluriel (projects, files, etc.)
// mais TYPE_CONFIG utilise le singulier (project, file, etc.)
const PLURAL_TO_SINGULAR: Record<string, string> = {
  projects: "project",
  files: "file",
  folders: "folder",
  partners: "partner",
  users: "user",
  incidents: "incident",
};

const normalizeType = (type: string): string =>
  PLURAL_TO_SINGULAR[type] || type;

export default function NavbarSearch() {
  const router = useRouter();
  const { isPartner } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Catégories disponibles selon le rôle
  const FILTER_CHIPS = [
    { key: "all", label: "Tout" },
    { key: "projects", label: "Projets" },
    { key: "files", label: "Fichiers" },
    { key: "folders", label: "Dossiers" },
    { key: "incidents", label: "Incidents" },
    ...(!isPartner() ? [
      { key: "partners", label: "Partenaires" },
      { key: "users", label: "Utilisateurs" },
    ] : []),
  ];

  const debouncedQuery = useDebounce(query, 400);

  // Raccourci Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && isOpen) {
        closeSearch();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeSearch();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Recherche
  const performSearch = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const filters: SearchFilters = {
        query: debouncedQuery,
        ...(activeFilter !== "all" && { entityType: activeFilter as SearchFilters["entityType"] }),
      };
      const response = await searchService.globalSearch(filters, {
        index: 0,
        size: 30,
      });
      setResults(response.results);
      setTotal(response.total);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeFilter]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setTotal(0);
    setActiveFilter("all");
  };

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const navigateToResult = (result: SearchResult) => {
    closeSearch();
    const type = normalizeType(result.type);
    switch (type) {
      case "project":
        router.push(`/tableaudebord/projet/pageprojet/${result.id}`);
        break;
      case "incident":
        router.push(`/tableaudebord/incidents/${result.id}`);
        break;
      case "partner":
        if (!isPartner()) {
          router.push(`/tableaudebord/partenaire/details/${result.id}`);
        }
        break;
      case "user":
        if (!isPartner()) {
          router.push(`/tableaudebord/utilisateur/${result.id}`);
        }
        break;
      case "file":
      case "folder":
        // Si le fichier/dossier a un project_id, ouvrir le projet avec l'onglet fichiers
        if (result.project_id) {
          router.push(
            `/tableaudebord/projet/pageprojet/${result.project_id}?tab=files`
          );
        }
        break;
      default:
        break;
    }
  };

  // Grouper les résultats par type (normalisé en singulier)
  const groupedResults = results.reduce(
    (acc, result) => {
      const key = normalizeType(result.type);
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  // Entrée → naviguer vers le premier résultat
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      navigateToResult(results[0]);
    }
  };

  const hasResults = results.length > 0;
  const hasQuery = debouncedQuery.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* Bouton / Input trigger */}
      <button
        onClick={openSearch}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-500 dark:text-gray-400 cursor-pointer min-w-[200px] lg:min-w-[280px]"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">Rechercher...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Overlay dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
              onClick={closeSearch}
            />

            {/* Search panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-[min(560px,calc(100vw-2rem))] z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Rechercher projets, fichiers, incidents..."
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                    autoFocus
                  />
                  {loading && <Spinner size="sm" />}
                  {query && !loading && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        inputRef.current?.focus();
                      }}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={closeSearch}
                    className="text-xs text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ESC
                  </button>
                </div>

                {/* Chips de filtrage par catégorie */}
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                  {FILTER_CHIPS.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => setActiveFilter(chip.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        activeFilter === chip.key
                          ? "bg-[#4ba9b7] text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Résultats */}
                <div className="max-h-[400px] overflow-y-auto">
                  {/* État initial */}
                  {!hasQuery && !loading && (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Tapez au moins 2 caractères pour rechercher
                      </p>
                    </div>
                  )}

                  {/* Aucun résultat */}
                  {hasQuery && !loading && !hasResults && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Aucun résultat pour &quot;{debouncedQuery}&quot;
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Essayez avec d&apos;autres termes
                      </p>
                    </div>
                  )}

                  {/* Résultats groupés */}
                  {hasResults &&
                    Object.entries(groupedResults).map(
                      ([type, items]) => {
                        const config = TYPE_CONFIG[type];
                        if (!config) return null;
                        const displayItems = items.slice(0, MAX_PER_GROUP);
                        const remaining = items.length - MAX_PER_GROUP;

                        return (
                          <div key={type}>
                            {/* Header du groupe */}
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50">
                              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {config.label}
                                <span className="ml-1.5 text-gray-400 dark:text-gray-500 font-normal">
                                  ({items.length})
                                </span>
                              </span>
                            </div>

                            {/* Items */}
                            {displayItems.map((result) => (
                              <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => navigateToResult(result)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                              >
                                <div
                                  className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                                >
                                  <span className={config.color}>
                                    {config.icon}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-[#4ba9b7] transition-colors">
                                    {result.title}
                                  </p>
                                  {result.description && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                      {result.description}
                                    </p>
                                  )}
                                </div>
                                {result.status && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {result.status}
                                  </span>
                                )}
                                <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </button>
                            ))}

                            {remaining > 0 && (
                              <div className="px-4 py-1.5 border-b border-gray-50 dark:border-gray-700/30">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  +{remaining} autre{remaining > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                </div>

                {/* Footer */}
                {hasResults && (
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {total} résultat{total > 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                        <span>Naviguer</span>
                        <kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                          ↵
                        </kbd>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
