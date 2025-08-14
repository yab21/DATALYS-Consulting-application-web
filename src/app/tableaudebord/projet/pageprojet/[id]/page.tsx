import { Metadata } from "next";
import { ParentFolderIdProvider } from "@/context/ParentFolderIdContext";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import PageProjet from "@/components/TableauDeBord/Projet/VoirProjet";

export const metadata: Metadata = {
  title: "Informations du projet | DATALYS Consulting",
  description: "La page des informations du projet de DATALYS Consulting",
};

// Ajoutez cette fonction pour la génération statique
export async function generateStaticParams() {
  // Données mockées (remplace Firebase)
  const mockProjects = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ];

  return mockProjects;
}

// Ajoutez cette ligne pour activer l'ISR
export const revalidate = 3600; // Revalider toutes les heures

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <ParentFolderIdProvider>
      <DefaultLayout>
        <PageProjet id={id} />
      </DefaultLayout>
    </ParentFolderIdProvider>
  );
};

export default Page;
