"use client";

import { Suspense } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import OptimizedProjectList from "@/components/TableauDeBord/Projet/OptimizedProjectList";
import { SkeletonTable } from "@/components/UI/LazyLoading/SkeletonLoader";

const GestionProjet = () => {
  return (
    <>
      <Breadcrumb pageName="Gestion de projet" />
      <div className="mt-5 w-full max-w-full">
        <Suspense fallback={<SkeletonTable rows={8} className="space-y-4" />}>
          <OptimizedProjectList />
        </Suspense>
      </div>
    </>
  );
};

export default GestionProjet;
