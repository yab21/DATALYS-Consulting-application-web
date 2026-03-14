"use client";

import { useState } from "react";
import Link from "next/link";
import SidebarItem from "@/components/TableauDeBord/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const { user, isAdmin, isPartner, hasPermission, canCreate, isLoading } = useAuth();

  console.log("🎨 Sidebar rendu - état auth:", {
    user: user?.name,
    role_id: user?.role_id,
    isLoading,
    isAdmin: isAdmin(),
    isPartner: isPartner()
  });

  // Définir les menus en fonction des autorisations
  // Ne pas rendre la sidebar tant que l'auth n'est pas chargé
  if (isLoading || !user) {
    return null;
  }

  const getMenuGroups = () => {
    const baseMenuGroups = [
      {
        name: "Accueil",
        menuItems: [
          {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                className="transition-all duration-300 group-hover:scale-110"
              >
                <path
                  fill="currentColor"
                  d="M6 19h3v-6h6v6h3v-9l-6-4.5L6 10zm-2 2V9l8-6l8 6v12h-7v-6h-2v6zm8-8.75"
                />
              </svg>
            ),
            label: "Tableau de bord",
            route: "/tableaudebord",
          },
        ],
      },
      // Le menu Projet est toujours présent, mais avec des sous-menus conditionnels
      {
        name: "Gestion",
        menuItems: [
          {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current transition-all duration-300 group-hover:scale-110"
                width="28"
                height="28"
                viewBox="0 0 24 24"
              >
                <path
                  fill="fill-current"
                  d="M7.25 6a.75.75 0 0 0-.75.75v7.5a.75.75 0 0 0 1.5 0v-7.5A.75.75 0 0 0 7.25 6M12 6a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 6m4 .75a.75.75 0 0 1 1.5 0v9.5a.75.75 0 0 1-1.5 0z"
                />
                <path
                  fill="fill-current"
                  d="M3.75 2h16.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25V3.75C2 2.784 2.784 2 3.75 2M3.5 3.75v16.5c0 .138.112.25.25.25h16.5a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25H3.75a.25.25 0 0 0-.25.25"
                />
              </svg>
            ),
            label: "Projets",
            route: "/tableaudebord/projet/gerer",
          },
          // Menu Partenaires - pour les admins avec permissions
          ...(isAdmin() && hasPermission(Permission.CREATE_PARTNERS) ? [{
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current transition-all duration-300 group-hover:scale-110"
                width="28"
                height="28"
                viewBox="0 0 24 24"
              >
                <path
                  fill="fill-current"
                  d="M14 7V5h8v2zm0 4V9h8v2zm0 4v-2h8v2zm-6-1q-1.25 0-2.125-.875T5 11t.875-2.125T8 8t2.125.875T11 11t-.875 2.125T8 14m-6 6v-1.9q0-.525.25-1t.7-.75q1.125-.675 2.388-1.012T8 15t2.663.338t2.387 1.012q.45.275.7.75t.25 1V20zm2.15-2h7.7q-.875-.5-1.85-.75T8 17t-2 .25t-1.85.75M8 12q.425 0 .713-.288T9 11t-.288-.712T8 10t-.712.288T7 11t.288.713T8 12m0 6"
                />
              </svg>
            ),
            label: "Partenaires",
            route: "/tableaudebord/partenaire/liste",
          }] : []),
          // Menu Utilisateurs - pour les admins avec permissions
          ...(isAdmin() && hasPermission(Permission.CREATE_USERS) ? [{
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current transition-all duration-300 group-hover:scale-110"
                width="28"
                height="28"
                viewBox="0 0 24 24"
              >
                <path
                  fill="fill-current"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            ),
            label: "Utilisateurs",
            route: "/tableaudebord/gestion-utilisateurs",
          }] : []),
          // Menu Rôles - pour les admins avec permissions
          ...(isAdmin() && hasPermission(Permission.MANAGE_ROLES_PERMISSIONS) ? [{
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current transition-all duration-300 group-hover:scale-110"
                width="28"
                height="28"
                viewBox="0 0 24 24"
              >
                <path
                  fill="fill-current"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            ),
            label: "Rôles",
            route: "/tableaudebord/parametres/roles",
          }] : []),
          // Menu Incidents - pour les utilisateurs avec permissions
          ...(isAdmin() || isPartner() ? [{
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current transition-all duration-300 group-hover:scale-110"
                width="28"
                height="28"
                viewBox="0 0 24 24"
              >
                <path
                  fill="fill-current"
                  d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
                />
              </svg>
            ),
            label: "Incidents",
            route: "/tableaudebord/incidents",
          }] : []),
          // Menu Support - pour tous les utilisateurs
          {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current transition-all duration-300 group-hover:scale-110"
                width="28"
                height="28"
                viewBox="0 0 24 24"
              >
                <path
                  fill="fill-current"
                  d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4zM6.5 10.5L10.5 6.5 8.5 4.5l-4 4 2 2z"
                />
              </svg>
            ),
            label: "Support",
            route: "/tableaudebord/support",
          },
        ],
      },
    ];

    // Menu Autres
    const autresMenu = {
      name: "AUTRES",
      menuItems: [

        // Menu Profil - pour tous les utilisateurs
        {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current transition-all duration-300 group-hover:scale-110"
              width="28"
              height="28"
              viewBox="0 0 24 24"
            >
              <path
                fill="fill-current"
                d="M21.008 3c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3zM20 5H4v14h16zm-2 10v2H6v-2zm-6-8v6H6V7zm6 4v2h-4v-2zm-8-2H8v2h2zm8-2v2h-4V7z"
              />
            </svg>
          ),
          label: "Profil",
          route: "/tableaudebord/profil/voir",
        },
      ],
    };

    // Menu Messages (pour tous les utilisateurs)
    autresMenu.menuItems.unshift({
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="fill-current transition-all duration-300 group-hover:scale-110"
          width="28"
          height="28"
          viewBox="0 0 24 24"
        >
          <path
            fill="fill-current"
            d="M8 12h8v2H8zm0-3h8v2H8zm0-3h8v2H8zM4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"
          />
        </svg>
      ),
      label: "Messages",
      route: "/tableaudebord/messages",
      children: []
    } as any);

    // Menu Documentation (pour tous les utilisateurs)
    autresMenu.menuItems.push({
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="fill-current transition-all duration-300 group-hover:scale-110"
          width="28"
          height="28"
          viewBox="0 0 24 24"
        >
          <path
            fill="fill-current"
            d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 2v16h12V4zm2 2h8v2H8zm0 4h8v2H8zm0 4h5v2H8z"
          />
        </svg>
      ),
      label: "Documentation",
      route: "/tableaudebord/documentation",
    });

    // Menu Support supprimé - maintenant dans la section GESTION

    // Ajouter les menus Admin uniquement pour les admins avec permissions
    if (isAdmin()) {

      // Menu Incidents supprimé - maintenant dans la section GESTION

      // Menu Analytics supprimé - maintenant intégré dans le tableau de bord principal


      // Menu Gestion des Utilisateurs supprimé - maintenant dans la section GESTION

      // Menu Partenaires supprimé - maintenant dans la section GESTION
    }

    baseMenuGroups.push(autresMenu);
    return baseMenuGroups;
  };

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col border-r border-sky-300/40 bg-gradient-to-b from-sky-50/90 via-sky-100/70 to-sky-200/50 shadow-2xl shadow-sky-500/20 backdrop-blur-xl dark:border-slate-600/50 dark:from-slate-800/90 dark:via-slate-700/80 dark:to-slate-600/70 dark:shadow-slate-900/50 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } duration-500 ease-out`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <motion.div
          className="flex items-center justify-between gap-2 border-b border-sky-300/40 bg-gradient-to-r from-sky-100/50 to-sky-200/40 px-6 py-5.5 dark:border-slate-600/50 dark:from-slate-700/60 dark:to-slate-600/50 lg:py-6.5 xl:py-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/tableaudebord" className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                width={300}
                height={100}
                src="/images/logo/logo-2.png"
                alt="Logo"
                className="drop-shadow-lg dark:hidden"
                priority
              />
              <Image
                width={300}
                height={100}
                src="/images/logo/logo.png"
                alt="Logo"
                className="hidden drop-shadow-lg dark:block"
                priority
              />
            </motion.div>
          </Link>

          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="block rounded-xl bg-blue-200/60 p-2 transition-all duration-300 hover:scale-110 hover:bg-blue-300/70 dark:bg-gray-600/60 dark:hover:bg-gray-500/70 lg:hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              className="fill-current text-blue-700 dark:text-gray-200"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </motion.button>
        </motion.div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1">
          {/* <!-- Sidebar Menu --> */}
          <nav className="mt-4 px-4 lg:px-6">
            {getMenuGroups().map((group, groupIndex) => (
              <motion.div
                key={groupIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
              >
                <h3 className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {group.name}
                </h3>

                <ul className="mb-6 flex flex-col gap-1">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>

      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
