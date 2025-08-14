"use client";

import React, { Suspense } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import OptimizedProjectForm from "../OptimizedProjectForm";
import { Skeleton } from "@/components/Optimizations";

const AjouterProjet: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Ajouter un projet" />
      <div className="mt-5 w-full max-w-full">
        <Suspense 
          fallback={
            <div className="space-y-6">
              <Skeleton variant="rectangle" width="100%" height="200px" />
              <Skeleton variant="rectangle" width="100%" height="300px" />
              <Skeleton variant="rectangle" width="100%" height="150px" />
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