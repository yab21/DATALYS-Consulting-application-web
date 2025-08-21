import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const SidebarDropdown = ({ item }: any) => {
  const pathname = usePathname();
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
              pathname === item.route
                ? "border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/15 to-secondary/10 text-primary-700 shadow-md shadow-primary/10 ring-1 ring-primary/20 dark:border-primary/30 dark:from-primary/20 dark:via-primary/25 dark:to-secondary/20 dark:text-primary-100 dark:shadow-primary/20 dark:ring-primary/30"
                : "text-gray-500 hover:border hover:border-gray-200/50 hover:bg-gradient-to-br hover:from-gray-50/80 hover:via-white/60 hover:to-gray-100/40 hover:text-gray-700 hover:shadow-sm hover:shadow-gray-200/30 dark:text-gray-400 dark:hover:border-gray-600/50 dark:hover:from-gray-700/60 dark:hover:via-gray-600/50 dark:hover:to-gray-500/40 dark:hover:text-gray-200 dark:hover:shadow-gray-600/20"
            }`}
          >
            {/* Effet de lueur au survol */}
            <div
              className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/10 via-primary/15 to-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-primary/15 dark:via-primary/20 dark:to-secondary/15`}
            ></div>

            {/* Indicateur actif */}
            {pathname === item.route && (
              <motion.div
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary via-secondary to-primary/80 shadow-lg shadow-primary/20 ring-1 ring-primary/30 dark:from-primary dark:via-secondary dark:to-primary/80 dark:shadow-primary/30 dark:ring-primary/40"
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
                className="ml-auto rounded-lg bg-gradient-to-br from-primary via-secondary to-primary/80 px-2 py-1 text-[10px] font-bold leading-[17px] text-white shadow-md shadow-primary/20 ring-1 ring-primary/30 dark:from-primary dark:via-secondary dark:to-primary/80 dark:shadow-primary/30 dark:ring-primary/40"
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
