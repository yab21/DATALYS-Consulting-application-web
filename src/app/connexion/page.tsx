import React, { Suspense } from "react";
import Connexion from "@/components/Connexion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | DATALYS Consulting",
  description: "Le page de connexion de l'application web",
};

// Composant de chargement pour le Suspense
const ConnexionLoading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4ba9b7] border-t-transparent"></div>
  </div>
);

const Page = () => {
  return (
    <Suspense fallback={<ConnexionLoading />}>
      <Connexion />
    </Suspense>
  );
};

export default Page;
