"use client";

import React, { useState } from "react";
import Link from "next/link";
import ClickOutside from "@/components/ClickOutside";
import { useRouter } from "next/navigation";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData] = useState({
    firstName: "John",
    lastName: "Doe",
    profileImage: "/images/user.png", // Image par défaut
  });
  const router = useRouter();


  const handleSignOut = () => {
    router.push("/connexion");
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        href="#"
      >
        <span className="h-12 w-12 rounded-full">
          <img
            src={userData.profileImage}
            alt="User"
            className="h-full w-full rounded-full object-cover"
          />
        </span>

        <span className="flex items-center gap-2 font-medium text-dark dark:text-white">
          <span className="hidden lg:block">
            {userData.firstName.charAt(0)}. {userData.lastName}
          </span>

          <svg
            className={`fill-current duration-200 ease-in ${dropdownOpen && "rotate-180"}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.6921 7.09327C3.91674 6.83119 4.3113 6.80084 4.57338 7.02548L9.99997 11.6768L15.4266 7.02548C15.6886 6.80084 16.0832 6.83119 16.3078 7.09327C16.5325 7.35535 16.5021 7.74991 16.24 7.97455L10.4067 12.9745C10.1727 13.1752 9.82728 13.1752 9.59322 12.9745L3.75989 7.97455C3.49781 7.74991 3.46746 7.35535 3.6921 7.09327Z"
              fill=""
            />
          </svg>
        </span>
      </Link>

      {dropdownOpen && (
        <div className="dark:border-strokedark dark:bg-boxdark absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default">
          <div className="dark:border-strokedark flex flex-col gap-4 border-b border-stroke px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full">
                <img
                  src={userData.profileImage}
                  alt="User"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div>
                <h6 className="font-medium text-black dark:text-white">
                  {userData.firstName} {userData.lastName}
                </h6>
              </div>
            </div>
          </div>
          <ul className="flex flex-col gap-1 border-y-[0.5px] border-stroke p-2.5 dark:border-dark-3">
            <li>
              <Link
                href="/tableaudebord/profil/voir"
                className="flex w-full items-center rounded-[7px] p-2.5 duration-300 ease-in-out hover:bg-gray-2 dark:hover:bg-dark-3"
              >
                <span className="flex items-center gap-1 text-sm font-medium text-dark-4 hover:text-dark dark:text-dark-6 dark:hover:text-white lg:text-base">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="27"
                    height="27"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="#4B5563"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12M11 7h6M7 7h1m-1 5h1m-1 5h1m3-5h6m-6 5h6"
                      color="#4B5563"
                    />
                  </svg>
                  Profil
                </span>
              </Link>
            </li>
            <li>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center rounded-[7px] p-2.5 text-sm font-medium text-dark-4 duration-300 ease-in-out hover:bg-gray-2 hover:text-dark dark:text-dark-6 dark:hover:bg-dark-3 dark:hover:text-white lg:text-base"
              >
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="27"
                    height="27"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4B5563"
                      d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"
                    />
                  </svg>
                  Déconnexion
                </div>
              </button>
            </li>
          </ul>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownUser;
