import Link from "next/link";
import Image from "next/image";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import { useState } from "react";
import { motion } from "framer-motion";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  // Données utilisateur statiques pour la démo
  const [userName] = useState({ firstName: "DATALYS", lastName: "User" });

  return (
    <header className="sticky top-0 z-999 flex w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/80">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-lg shadow-gray-100/50 dark:shadow-gray-900/50 md:px-6 2xl:px-8">
        <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
          {/* <!-- Hamburger Toggle BTN --> */}
          <motion.button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-300/50 dark:border-gray-600 dark:bg-gray-800 dark:shadow-gray-900/50 dark:hover:shadow-gray-800/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative block h-5 w-5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-gray-600 transition-all delay-[0] duration-300 ease-in-out dark:bg-gray-300 ${
                    !props.sidebarOpen && "!w-full delay-300"
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-gray-600 transition-all delay-150 duration-300 ease-in-out dark:bg-gray-300 ${
                    !props.sidebarOpen && "delay-400 !w-full"
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-gray-600 transition-all delay-200 duration-300 ease-in-out dark:bg-gray-300 ${
                    !props.sidebarOpen && "!w-full delay-500"
                  }`}
                ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-gray-600 transition-all delay-300 duration-300 ease-in-out dark:bg-gray-300 ${
                    !props.sidebarOpen && "!h-0 !delay-[0]"
                  }`}
                ></span>
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-gray-600 transition-all duration-300 ease-in-out dark:bg-gray-300 ${
                    !props.sidebarOpen && "!h-0 !delay-200"
                  }`}
                ></span>
              </span>
            </span>
          </motion.button>
          {/* <!-- Hamburger Toggle BTN --> */}

          <Link className="block flex-shrink-0 lg:hidden" href="/tableaudebord">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                width={100}
                height={100}
                src="/images/logo/logo-2.png"
                alt="Logo"
                priority
                className="drop-shadow-lg dark:hidden"
              />
              <Image
                width={100}
                height={100}
                src="/images/logo/logo.png"
                alt="Logo"
                priority
                className="hidden drop-shadow-lg dark:block"
              />
            </motion.div>
          </Link>
        </div>

        <motion.div
          className="hidden xl:block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl">
              Tableau de bord
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <p className="font-medium text-gray-600 dark:text-gray-300">
                Bienvenue, {userName.firstName} {userName.lastName}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-normal gap-3 2xsm:gap-4 lg:w-full lg:justify-between xl:w-auto xl:justify-normal">
          <motion.ul
            className="flex items-center gap-3 2xsm:gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* <!-- Dark Mode Toggle --> */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <DarkModeSwitcher />
            </motion.div>
            {/* <!-- Dark Mode Toggle --> */}

            {/* <!-- Notification Menu Area --> */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <DropdownNotification />
            </motion.div>
            {/* <!-- Notification Menu Area --> */}
          </motion.ul>

          {/* <!-- User Area --> */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <DropdownUser />
          </motion.div>
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
