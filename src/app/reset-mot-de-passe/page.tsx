"use client";

import React, { Suspense } from "react";
import ResetMotDePasse from "@/components/Auth/ResetMotDePasse";

const PageResetMotDePasse: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <ResetMotDePasse />
    </Suspense>
  );
};

export default PageResetMotDePasse;