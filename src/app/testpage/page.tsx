"use client";

import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";

const TestPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Simulation de déconnexion (remplace Firebase)
      localStorage.removeItem("user");
      sessionStorage.clear();
      console.log("Déconnexion réussie");
      router.push("/connexionclient");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Test de la déconnexion</h1>
      <Button color="danger" onClick={handleLogout}>
        Se déconnecter
      </Button>
    </div>
  );
};

export default TestPage;
