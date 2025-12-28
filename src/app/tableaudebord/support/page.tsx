"use client";

import React from "react";
import SupportIncidents from "@/components/TableauDeBord/Support/SupportIncidents";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

const SupportPage: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Support Technique" />
      <SupportIncidents />
    </>
  );
};

export default SupportPage;