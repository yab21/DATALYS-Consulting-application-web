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
                ? "border border-sky-300/50 bg-gradient-to-r from-sky-300/40 to-sky-400/40 text-sky-800 shadow-md shadow-sky-300/30 dark:border-sky-400/50 dark:text-sky-100 dark:shadow-sky-400/20"
                : "text-sky-700 hover:border hover:border-sky-200/50 hover:bg-gradient-to-r hover:from-sky-200/50 hover:to-sky-300/50 hover:text-sky-800 hover:shadow-sm hover:shadow-sky-200/30 dark:text-sky-200 dark:hover:border-slate-500/50 dark:hover:from-slate-600/50 dark:hover:to-slate-500/50 dark:hover:text-sky-100 dark:hover:shadow-slate-500/20"
            }`}
          >
            {/* Effet de lueur au survol */}
            <div
              className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-sky-300/20 to-sky-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-sky-300/25 dark:to-sky-400/25`}
            ></div>

            {/* Indicateur actif */}
            {window.location.pathname === item.route && (
              <motion.div
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-400 to-sky-500 shadow-lg shadow-sky-400/50 dark:from-sky-300 dark:to-sky-400"
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
                className="ml-auto rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-md shadow-sky-500/30 dark:from-sky-400 dark:to-sky-500"
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
