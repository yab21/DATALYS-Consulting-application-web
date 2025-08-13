import Link from "next/link";
import SidebarDropdown from "@/components/TableauDeBord/Sidebar/SidebarDropdown";
import { motion } from "framer-motion";

const SidebarItem = ({ item, pageName, setPageName }: any) => {
  const handleClick = () => {
    const updatedPageName =
      pageName !== item.label.toLowerCase() ? item.label.toLowerCase() : "";
    return setPageName(updatedPageName);
  };

  const isActive = pageName === item.label.toLowerCase();

  return (
    <>
      <motion.li
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Link
          href={item.route}
          onClick={handleClick}
          className={`group relative flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold transition-all duration-300 ease-out ${
            isActive
              ? "border border-blue-400/50 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 text-blue-800 shadow-lg shadow-blue-400/30 dark:border-blue-500/50 dark:text-blue-100 dark:shadow-blue-500/20"
              : "text-blue-700 hover:border hover:border-blue-300/50 hover:bg-gradient-to-r hover:from-blue-200/60 hover:to-indigo-200/60 hover:text-blue-800 hover:shadow-md hover:shadow-blue-300/30 dark:text-blue-200 dark:hover:border-gray-500/50 dark:hover:from-gray-600/60 dark:hover:to-gray-500/60 dark:hover:text-blue-100 dark:hover:shadow-gray-500/20"
          }`}
        >
          {/* Effet de lueur au survol */}
          <div
            className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-400/15 to-indigo-400/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-400/20 dark:to-indigo-400/20`}
          ></div>

          {/* Icône avec animation */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {item.icon}
          </motion.div>

          {/* Label */}
          <span className="relative z-10 font-semibold">{item.label}</span>

          {/* Badge de message */}
          {item.message && (
            <motion.span
              className="absolute right-11.5 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-lg shadow-red-500/30"
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-lg shadow-blue-500/30 dark:from-blue-400 dark:to-indigo-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Pro
            </motion.span>
          )}

          {/* Flèche pour les sous-menus */}
          {item.children && (
            <motion.svg
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 fill-current text-blue-600 transition-transform duration-300 dark:text-blue-300 ${
                !isActive && "rotate-180"
              }`}
              width="20"
              height="20"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isActive ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.5525 7.72801C10.81 7.50733 11.1899 7.50733 11.4474 7.72801L17.864 13.228C18.1523 13.4751 18.1857 13.9091 17.9386 14.1974C17.6915 14.4857 17.2575 14.5191 16.9692 14.272L10.9999 9.15549L5.03068 14.272C4.7424 14.5191 4.30838 14.5191 4.06128 14.272C3.81417 13.9091 3.84756 13.4751 4.13585 13.228L10.5525 7.72801Z"
                fill=""
              />
            </motion.svg>
          )}
        </Link>

        {/* Sous-menus avec animation */}
        {item.children && (
          <motion.div
            className={`overflow-hidden`}
            initial={false}
            animate={
              isActive
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SidebarDropdown item={item.children} />
          </motion.div>
        )}
      </motion.li>
    </>
  );
};

export default SidebarItem;
