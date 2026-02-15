import React from "react";
import { Metadata } from "next";
import ConnexionClient from "./ConnexionClient";

export const metadata: Metadata = {
  title: "Connexion | DATALYS Consulting",
  description: "Le page de connexion de l'application web",
};

const Page = () => {
  return <ConnexionClient />;
};

export default Page;
