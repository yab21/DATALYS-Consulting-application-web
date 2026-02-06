import Connexion from "@/components/Connexion";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "DATALYS Consulting application web",
  description: "La page de connexion",
};

// Composant de chargement pour le Suspense
const ConnexionLoading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4ba9b7] border-t-transparent"></div>
  </div>
);

export default function Home() {
  return (
    <Suspense fallback={<ConnexionLoading />}>
      <Connexion />
    </Suspense>
  );
}
