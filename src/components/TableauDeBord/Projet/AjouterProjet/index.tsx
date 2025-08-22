"use client";

import React, { Suspense } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import OptimizedProjectForm from "../OptimizedProjectForm";
import { ProfessionalCard } from "@/components/UI/Professional";

const AjouterProjet: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Ajouter un projet" />
      <div className="mt-5 w-full max-w-full">
        <Suspense 
          fallback={
            <div className="mx-auto max-w-4xl space-y-6">
              {[...Array(3)].map((_, i) => (
                <ProfessionalCard key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
                </ProfessionalCard>
              ))}
            </div>
          }
        >
          <OptimizedProjectForm />
        </Suspense>
      </div>
    </>
  );
};

export default AjouterProjet;