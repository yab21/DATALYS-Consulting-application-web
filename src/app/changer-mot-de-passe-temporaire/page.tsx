"use client";

import React, { Suspense } from "react";
import ChangerMotDePasseTemporaire from "@/components/Auth/ChangerMotDePasseTemporaire";

const PageChangerMotDePasseTemporaire: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <ChangerMotDePasseTemporaire />
    </Suspense>
  );
};

export default PageChangerMotDePasseTemporaire;