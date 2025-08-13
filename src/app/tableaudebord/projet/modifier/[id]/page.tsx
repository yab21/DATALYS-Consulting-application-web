import ModifierProjet from "@/components/TableauDeBord/Projet/ModifierProjet";
import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { db } from "@/firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const metadata: Metadata = {
  title: "Modifier le projet | DATALYS Consulting",
  description: "La page de modification du projet de DATALYS Consulting",
};

type Props = {
  params: {
    id: string;
  };
};

export async function generateStaticParams() {
  try {
    console.log("Generating static params for project modification pages...");
    const projectsRef = collection(db, "projects");
    const projectsSnapshot = await getDocs(projectsRef);

    const params = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
    }));

    console.log("Generated params:", params);
    return params;
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export const revalidate = 3600; // Revalider toutes les heures

const Page = async ({ params }: Props) => {
  console.log("Rendering project modification page for ID:", params.id);

  return (
    <DefaultLayout>
      <ModifierProjet id={params.id} />
    </DefaultLayout>
  );
};

export default Page;
