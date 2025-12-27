import Connexion from "@/components/Connexion";
import { Metadata } from "next";
import { HeroUIProvider } from "@heroui/react";
import React from "react";

export const metadata: Metadata = {
  title: "DATALYS Consulting application web",
  description: "La page de connexion",
};

export default function Home() {
  return (
    <>
      <HeroUIProvider>
        <Connexion />
      </HeroUIProvider>
    </>
  );
}
