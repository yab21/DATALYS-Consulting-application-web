"use client";

import React from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import TablePartner from "./TablePartner";

const ListePartenaires: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Liste des Partenaires" />
      <TablePartner />
    </>
  );
};

export default ListePartenaires;
