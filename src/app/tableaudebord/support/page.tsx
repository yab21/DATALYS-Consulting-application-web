"use client";

import React from "react";
import GestionSupport from "@/components/TableauDeBord/Support/GestionSupport";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

const SupportPage: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Support Technique" />
      <GestionSupport />
    </>
  );
};

export default SupportPage;