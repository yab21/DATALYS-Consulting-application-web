import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  avatar?: string;
  departement?: string;
  derniereCo?: Date;
}

interface Project {
  id: string;
  intitule: string;
  societe: string;
  chefDeProjet: string;
  domaine: string[];
  statut: 'en_cours' | 'termine' | 'en_attente' | 'suspendu';
  dateCreation: Date;
  dateModification: Date;
  visibilite: 'public' | 'prive';
  description?: string;
  progression?: number;
  budget?: number;
}

interface Partner {
  id: string;
  nom: string;
  logo: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  responsable: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  dateCreation: Date;
  nombreProjets: number;
  nombreIncidents: number;
}

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoSave: boolean;
  compactMode: boolean;
}

// Store principal
interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;

  // Projects state
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;

  // Partners state
  partners: Partner[];
  setPartners: (partners: Partner[]) => void;
  addPartner: (partner: Partner) => void;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  removePartner: (id: string) => void;

  // Loading state
  loading: LoadingState;
  setLoading: (loading: LoadingState) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Search & filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: Record<string, any>;
  setActiveFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;

  // Actions globales
  reset: () => void;
  initializeApp: () => Promise<void>;
}

// Store avec persistance
export const useStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        projects: [],
        currentProject: null,
        partners: [],
        loading: { isLoading: false },
        settings: {
          theme: 'system',
          language: 'fr',
          notificationsEnabled: true,
          soundEnabled: false,
          autoSave: true,
          compactMode: false,
        },
        sidebarCollapsed: false,
        searchQuery: '',
        activeFilters: {},

        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        login: (user) => set({ 
          user, 
          isAuthenticated: true 
        }),
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false,
          currentProject: null 
        }),

        // Projects actions
        setProjects: (projects) => set({ projects }),
        
        addProject: (project) => set((state) => ({
          projects: [project, ...state.projects]
        })),
        
        updateProject: (id, updates) => set((state) => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...updates, dateModification: new Date() } : p
          ),
          currentProject: state.currentProject?.id === id 
            ? { ...state.currentProject, ...updates, dateModification: new Date() }
            : state.currentProject
        })),
        
        removeProject: (id) => set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        })),
        
        setCurrentProject: (project) => set({ currentProject: project }),

        // Partners actions
        setPartners: (partners) => set({ partners }),
        
        addPartner: (partner) => set((state) => ({
          partners: [partner, ...state.partners]
        })),
        
        updatePartner: (id, updates) => set((state) => ({
          partners: state.partners.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        })),
        
        removePartner: (id) => set((state) => ({
          partners: state.partners.filter(p => p.id !== id)
        })),

        // Loading actions
        setLoading: (loading) => set({ loading }),
        
        startLoading: (message) => set({ 
          loading: { isLoading: true, loadingMessage: message } 
        }),
        
        stopLoading: () => set({ 
          loading: { isLoading: false } 
        }),
        
        setProgress: (progress) => set((state) => ({
          loading: { ...state.loading, progress }
        })),

        // Settings actions
        updateSettings: (newSettings) => set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),

        // UI actions
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        toggleSidebar: () => set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        })),

        // Search & filters
        setSearchQuery: (query) => set({ searchQuery: query }),
        
        setActiveFilters: (filters) => set({ activeFilters: filters }),
        
        clearFilters: () => set({ activeFilters: {}, searchQuery: '' }),

        // Global actions
        reset: () => set({
          user: null,
          isAuthenticated: false,
          projects: [],
          currentProject: null,
          partners: [],
          loading: { isLoading: false },
          searchQuery: '',
          activeFilters: {},
        }),

        initializeApp: async () => {
          const state = get();
          
          set({ loading: { isLoading: true, loadingMessage: 'Initialisation...' } });
          
          try {
            // Simuler l'initialisation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Charger les données par défaut si nécessaire
            if (state.projects.length === 0) {
              // Charger les projets mockés
              const mockProjects: Project[] = [
                {
                  id: 'proj-1',
                  intitule: 'Migration Cloud AWS',
                  societe: 'TechCorp',
                  chefDeProjet: 'Marie Martin',
                  domaine: ['Cloud', 'Infrastructure'],
                  statut: 'en_cours',
                  dateCreation: new Date('2024-01-15'),
                  dateModification: new Date(),
                  visibilite: 'public',
                  progression: 65,
                  budget: 150000,
                }
              ];
              set({ projects: mockProjects });
            }
            
            console.log('Application initialisée avec succès');
          } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
          } finally {
            set({ loading: { isLoading: false } });
          }
        },
      }),
      {
        name: 'datalys-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          settings: state.settings,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'datalys-store',
    }
  )
);

// Hooks spécialisés pour des parties du store
export const useAuth = () => {
  const { user, isAuthenticated, login, logout, setUser } = useStore();
  return { user, isAuthenticated, login, logout, setUser };
};

export const useProjects = () => {
  const { 
    projects, 
    currentProject, 
    setProjects, 
    addProject, 
    updateProject, 
    removeProject, 
    setCurrentProject 
  } = useStore();
  
  return { 
    projects, 
    currentProject, 
    setProjects, 
    addProject, 
    updateProject, 
    removeProject, 
    setCurrentProject 
  };
};

export const usePartners = () => {
  const { partners, setPartners, addPartner, updatePartner, removePartner } = useStore();
  return { partners, setPartners, addPartner, updatePartner, removePartner };
};

export const useLoading = () => {
  const { loading, setLoading, startLoading, stopLoading, setProgress } = useStore();
  return { loading, setLoading, startLoading, stopLoading, setProgress };
};

export const useSettings = () => {
  const { settings, updateSettings } = useStore();
  return { settings, updateSettings };
};

export const useUI = () => {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    clearFilters
  } = useStore();
  
  return { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    clearFilters
  };
};