"use client";

import { useState } from "react";
import Link from "next/link";
import SidebarItem from "@/components/TableauDeBord/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import Image from "next/image";
import { motion } from "framer-motion";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  // Simulate admin user for demo purposes
  const [isUserAdmin] = useState(true);

  // Définir les menus en fonction des autorisations
  const getMenuGroups = () => {
    const baseMenuGroups = [
      {
        name: "Accueil",
        menuItems: [
          {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
                width="24"
                height="24"
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
            label: "Projet",
            route: "#",
            children: [
              ...(isUserAdmin
                ? [{ label: "Ajouter", route: "/tableaudebord/projet/ajouter" }]
                : []),
              { label: "Gérer", route: "/tableaudebord/projet/gerer" },
            ],
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
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="fill-current"
                d="M21.008 3c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3zM20 5H4v14h16zm-2 10v2H6v-2zm-6-8v6H6V7zm6 4v2h-4v-2zm-8-2H8v2h2zm8-2v2h-4V7z"
              />
            </svg>
          ),
          label: "Profil",
          route: "#",
          children: [
            { label: "Voir", route: "/tableaudebord/profil/voir" },
            {
              label: "Changer le mot de passe",
              route: "/tableaudebord/profil/changermotdepasse",
            },
          ],
        },
      ],
    };

    // Ajouter le menu Utilisateur uniquement pour les admins
    if (isUserAdmin) {
      autresMenu.menuItems.unshift({
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="fill-current transition-all duration-300 group-hover:scale-110"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="fill-current"
              d="M14 7V5h8v2zm0 4V9h8v2zm0 4v-2h8v2zm-6-1q-1.25 0-2.125-.875T5 11t.875-2.125T8 8t2.125.875T11 11t-.875 2.125T8 14m-6 6v-1.9q0-.525.25-1t.7-.75q1.125-.675 2.388-1.012T8 15t2.663.338t2.387 1.012q.45.275.7.75t.25 1V20zm2.15-2h7.7q-.875-.5-1.85-.75T8 17t-2 .25t-1.85.75M8 12q.425 0 .713-.288T9 11t-.288-.712T8 10t-.712.288T7 11t.288.713T8 12m0 6"
            />
          </svg>
        ),
        label: "Partenaire",
        route: "#",
        children: [
          {
            label: "Liste des partenaires",
            route: "/tableaudebord/partenaire/liste",
          },
          {
            label: "Ajouter partenaire",
            route: "/tableaudebord/partenaire/ajouter",
          },
        ],
      });
    }

    baseMenuGroups.push(autresMenu);
    return baseMenuGroups;
  };

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden border-r border-sky-300/40 bg-gradient-to-b from-sky-50/90 via-sky-100/70 to-sky-200/50 shadow-2xl shadow-sky-500/20 backdrop-blur-xl dark:border-slate-600/50 dark:from-slate-800/90 dark:via-slate-700/80 dark:to-slate-600/70 dark:shadow-slate-900/50 lg:static lg:translate-x-0 ${
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

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav className="mt-4 px-4 lg:px-6">
            {getMenuGroups().map((group, groupIndex) => (
              <motion.div
                key={groupIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
              >
                <h3 className="mb-4 rounded-xl border border-gray-200/20 bg-gradient-to-br from-white/80 to-gray-50/60 px-4 py-3 text-sm font-bold text-gray-700 shadow-sm backdrop-blur-sm dark:border-gray-600/30 dark:from-gray-800/80 dark:to-gray-700/60 dark:text-gray-200">
                  {group.name}
                </h3>

                <ul className="mb-8 flex flex-col gap-2">
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

        {/* Footer de la sidebar */}
        <motion.div
          className="mt-auto border-t border-gray-200/30 bg-gradient-to-br from-gray-50/80 via-white/60 to-gray-100/40 p-6 backdrop-blur-sm dark:border-gray-600/40 dark:from-gray-800/90 dark:via-gray-700/70 dark:to-gray-600/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-center">
            {/* Logo avec effet de lueur */}
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary/80 p-3 shadow-lg shadow-primary/20 ring-2 ring-primary/20 dark:from-primary dark:via-secondary dark:to-primary/80 dark:shadow-primary/30 dark:ring-primary/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <svg
                className="h-6 w-6 text-white drop-shadow-sm"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>

            {/* Informations de l'entreprise */}
            <div className="space-y-2">
              <motion.p
                className="text-sm font-bold text-gray-800 dark:text-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                DATALYS Consulting
              </motion.p>
              <motion.p
                className="text-xs text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Version 2.0
              </motion.p>

              {/* Statut en ligne */}
              <motion.div
                className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 shadow-sm dark:from-green-900/40 dark:to-emerald-900/40"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  En ligne
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
