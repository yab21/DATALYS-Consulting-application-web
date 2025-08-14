"use client";

import { Suspense } from "react";
import OptimizedDashboard from "./OptimizedDashboard";
import { SkeletonDashboard } from "@/components/Optimizations";

const TableauDeBord: React.FC = () => {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <OptimizedDashboard />
    </Suspense>
  );
};

export default TableauDeBord;