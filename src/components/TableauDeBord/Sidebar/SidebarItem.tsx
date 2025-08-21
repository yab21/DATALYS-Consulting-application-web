import Link from "next/link";
import SidebarDropdown from "@/components/TableauDeBord/Sidebar/SidebarDropdown";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const SidebarItem = ({ item, pageName, setPageName }: any) => {
  const pathname = usePathname();
  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    return setPageName(updatedPageName);
  };

  // Vérifier si c'est un menu parent actif (pour les dropdowns)
  const isActive = item.children ? 
    (pageName === item.label.toLowerCase() || item.children.some((child: any) => pathname === child.route)) :
    pathname === item.route;

  return (
    <>
      <motion.li
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link
          href={item.route}
          onClick={handleClick}
          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
            isActive
              ? "bg-primary/10 text-primary-700 border-r-2 border-primary dark:bg-primary/20 dark:text-primary-100"
              : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
          }`}
        >
          {/* Icône */}
          <div className={`flex-shrink-0 ${isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}>
            {item.icon}
          </div>

          {/* Label */}
          <span className="flex-1">{item.label}</span>

          {/* Badge de message */}
          {item.message && (
            <motion.span
              className="absolute right-11.5 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-lg shadow-red-500/30 ring-1 ring-red-400/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.message}
            </motion.span>
          )}

          {/* Badge Pro */}
          {item.pro && (
            <motion.span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-br from-primary via-secondary to-primary/80 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-lg shadow-primary/20 ring-1 ring-primary/30 dark:from-primary dark:via-secondary dark:to-primary/80 dark:shadow-primary/30 dark:ring-primary/40"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Pro
            </motion.span>
          )}

          {/* Flèche pour les sous-menus */}
          {item.children && (
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                isActive ? "rotate-0 text-primary" : "rotate-180 text-gray-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
            </svg>
          )}
        </Link>

        {/* Sous-menus avec animation */}
        {item.children && (
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${
              isActive ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <SidebarDropdown item={item.children} />
          </div>
        )}
      </motion.li>
    </>
  );
};

export default SidebarItem;
