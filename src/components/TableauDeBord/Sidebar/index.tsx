"use client";

import React, { useState } from "react";
import Link from "next/link";
import SidebarItem from "@/components/TableauDeBord/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import Image from "next/image";

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
                width="30"
                height="30"
                viewBox="0 0 24 24"
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
                className="fill-current"
                width="30"
                height="30"
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
              ...(isUserAdmin ? [{ label: "Ajouter", route: "/tableaudebord/projet/ajouter" }] : []),
              { label: "Gérer", route: "/tableaudebord/projet/gerer" },
            ],
          },
        ],
      }
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
              className="fill-current"
              width="30"
              height="30"
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
            className="fill-current"
            width="30"
            height="30"
            viewBox="0 0 24 24"
          >
            <path
              fill="fill-current"
              d="M14 7V5h8v2zm0 4V9h8v2zm0 4v-2h8v2zm-6-1q-1.25 0-2.125-.875T5 11t.875-2.125T8 8t2.125.875T11 11t-.875 2.125T8 14m-6 6v-1.9q0-.525.25-1t.7-.75q1.125-.675 2.388-1.012T8 15t2.663.338t2.387 1.012q.45.275.7.75t.25 1V20zm2.15-2h7.7q-.875-.5-1.85-.75T8 17t-2 .25t-1.85.75M8 12q.425 0 .713-.288T9 11t-.288-.712T8 10t-.712.288T7 11t.288.713T8 12m0 6"
            />
          </svg>
        ),
        label: "Utilisateur",
        route: "#",
        children: [
          { label: "Voir", route: "/tableaudebord/utilisateur/voir" },
          {
            label: "Créer un compte",
            route: "/tableaudebord/creationduncompte",
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
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden border-r border-stroke bg-white dark:border-stroke-dark dark:bg-gray-dark lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } duration-300 ease-linear`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 xl:py-10">
          <Link href="/tableaudebord">
            <Image
              width={300}
              height={100}
              src="/images/logo/logo-2.png"
              alt="Logo"
              className="dark:hidden"
              priority
            />
            <Image
              width={300}
              height={100}
              src="/images/logo/logo.png"
              alt="Logo"
              className="hidden dark:block"
              priority
            />
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
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
          </button>
        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav className="mt-1 px-4 lg:px-6">
            {getMenuGroups().map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {group.name}
                </h3>

                <ul className="mb-6 flex flex-col gap-2">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          {/* <!-- Sidebar Menu --> */}
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
