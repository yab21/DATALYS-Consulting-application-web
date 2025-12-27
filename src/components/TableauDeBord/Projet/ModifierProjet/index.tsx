"use client";
import React, { useEffect, useState } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { Button } from "@heroui/button";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { domaines } from "../GererProjet/domaineData";
import { useSimpleNotifications } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";

interface ProjectData {
  intitule: string;
  societe: string;
  chefDeProjet: string;
  domaine: string[];
  createdAt: Date;
}

interface ModifierProjetProps {
  id: string;
}

const ModifierProjet: React.FC<ModifierProjetProps> = ({ id }) => {
  const [projectData, setProjectData] = useState<ProjectData>({
    intitule: "",
    societe: "",
    chefDeProjet: "",
    domaine: [],
    createdAt: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useSimpleNotifications();
  const router = useRouter();

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          setLoading(true);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation de chargement
          
          // Données mockées du projet (remplace Firebase)
          const mockProjectData = {
            intitule: "Migration Cloud AWS",
            societe: "TechCorp Solutions",
            chefDeProjet: "Marie Martin",
            domaine: ["itcloud", "security"],
            createdAt: new Date("2024-01-15"),
          };

          setProjectData(mockProjectData);
        } catch (error) {
          console.error("Erreur lors de la récupération du projet:", error);
          setError("Erreur lors du chargement du projet");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProject();
  }, [id]);

  const handleUpdate = async () => {
    try {
      if (!id) return;

      // Validation des champs
      if (!projectData.intitule || !projectData.societe || !projectData.chefDeProjet) {
        setError("Veuillez remplir tous les champs obligatoires");
        return;
      }

      setLoading(true);
      setError(null);

      // Simulation de mise à jour (remplace Firebase)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedProject = {
        id,
        ...projectData,
        updatedAt: new Date(),
      };

      console.log("Projet mis à jour avec succès:", updatedProject);

      addNotification({
        title: "Projet modifié",
        body: `Le projet "${projectData.intitule}" a été mis à jour avec succès`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
        link: `/tableaudebord/projet/pageprojet/${id}`,
      });

      router.push("/tableaudebord/projet/gerer");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du projet:", error);
      setError("Erreur lors de la mise à jour du projet");
      
      addNotification({
        title: "Erreur de modification",
        body: "Une erreur est survenue lors de la modification du projet",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement..." />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Modifier le projet" />
      <div className="mx-auto mt-5 w-full max-w-3xl rounded-[10px]">
        <div className="mt-8 rounded-[20px] bg-white p-8 shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="mb-8 text-center">
            <h3 className="mb-2 text-[28px] font-bold text-dark dark:text-white">
              Modifier le projet
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Modifiez les informations du projet
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <div className="space-y-10">
              <Input
                type="text"
                label="Intitulé du projet"
                variant="bordered"
                color="primary"
                name="intitule"
               
                onChange={handleChange}
                className="text-base"
                labelPlacement="outside"
                size="lg"
                isRequired
              />

              <Input
                type="text"
                label="Nom de la société"
                variant="bordered"
                color="primary"
                name="societe"
               
                onChange={handleChange}
                className="text-base"
                labelPlacement="outside"
                size="lg"
                isRequired
              />

              <Input
                type="text"
                label="Nom du chef de projet"
                variant="bordered"
                color="primary"
                name="chefDeProjet"
               
                onChange={handleChange}
                className="text-base"
                labelPlacement="outside"
                size="lg"
                isRequired
              />

              <Select
                label="Domaine du projet"
                variant="bordered"
                color="primary"
                selectionMode="multiple"
                selectedKeys={new Set(projectData.domaine)}
                onSelectionChange={(keys) => {
                  const selectedDomaines = Array.from(keys) as string[];
                  setProjectData((prev) => ({
                    ...prev,
                    domaine: selectedDomaines,
                  }));
                }}
                className="text-base"
                labelPlacement="outside"
                size="lg"
              >
                {domaines.map((domaine) => (
                  <SelectItem key={domaine.key}>
                    {domaine.label}
                  </SelectItem>
                ))}
              </Select>

              <div className="mt-8 text-center">
                <Button
                  color="primary"
                  className="h-12 w-full max-w-md text-base font-medium"
                  variant="solid"
                  size="lg"
                  onPress={handleUpdate}
                  isLoading={loading}
                  isDisabled={loading}
                >
                  {loading ? "Modification..." : "Modifier le projet"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModifierProjet;
