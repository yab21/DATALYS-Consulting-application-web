import Link from "next/link";
import { motion } from "framer-motion";

const SidebarDropdown = ({ item }: any) => {
  return (
    <ul className="my-3 flex flex-col gap-2 pl-8">
      {item.map((item: any, index: number) => (
        <motion.li
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Link
            href={item.route}
            className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-300 ease-out ${
              window.location.pathname === item.route
                ? "border border-blue-300/50 bg-gradient-to-r from-blue-300/40 to-indigo-300/40 text-blue-800 shadow-md shadow-blue-300/30 dark:border-blue-400/50 dark:text-blue-100 dark:shadow-blue-400/20"
                : "text-blue-700 hover:border hover:border-blue-200/50 hover:bg-gradient-to-r hover:from-blue-200/50 hover:to-indigo-200/50 hover:text-blue-800 hover:shadow-sm hover:shadow-blue-200/30 dark:text-blue-200 dark:hover:border-gray-500/50 dark:hover:from-gray-600/50 dark:hover:to-gray-500/50 dark:hover:text-blue-100 dark:hover:shadow-gray-500/20"
            }`}
          >
            {/* Effet de lueur au survol */}
            <div
              className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-300/20 to-indigo-300/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-300/25 dark:to-indigo-300/25`}
            ></div>

            {/* Indicateur actif */}
            {window.location.pathname === item.route && (
              <motion.div
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-500 shadow-lg shadow-blue-400/50 dark:from-blue-300 dark:to-indigo-400"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            )}

            {/* Label */}
            <span className="relative z-10 font-medium">{item.label}</span>

            {/* Badge Pro */}
            {item.pro && (
              <motion.span
                className="ml-auto rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-md shadow-blue-500/30 dark:from-blue-400 dark:to-indigo-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                Pro
              </motion.span>
            )}
          </Link>
        </motion.li>
      ))}
    </ul>
  );
};

export default SidebarDropdown;
