"use client";

import React, { useState } from "react";
import Link from "next/link";

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  // Données utilisateur statiques pour la démo
  const [userName] = useState({ firstName: "DATALYS", lastName: "User" });

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[22px] font-thin leading-[30px] text-dark dark:text-white">
        M. {userName.firstName} {userName.lastName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium" href="/tableaudebord">
              Tableau de bord /
            </Link>
          </li>
          <li className="font-medium text-primary">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
