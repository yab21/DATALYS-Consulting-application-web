import ModifierProjet from "@/components/TableauDeBord/Projet/ModifierProjet";
import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";

export const metadata: Metadata = {
  title: "Modifier le projet | DATALYS Consulting",
  description: "La page de modification du projet de DATALYS Consulting",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  try {
    console.log("Generating static params for project modification pages...");
    
    // Données mockées (remplace Firebase)
    const mockProjects = [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
    ];

    console.log("Generated params:", mockProjects);
    return mockProjects;
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export const revalidate = 3600; // Revalider toutes les heures

const Page = async ({ params }: Props) => {
  const { id } = await params;
  console.log("Rendering project modification page for ID:", id);

  return (
    <DefaultLayout>
      <ModifierProjet id={id} />
    </DefaultLayout>
  );
};

export default Page;
