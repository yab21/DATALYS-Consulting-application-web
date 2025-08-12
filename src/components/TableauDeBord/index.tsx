"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/react";
import Link from "next/link";

interface Project {
  id: string;
  intitule: string;
  societe: string;
  domaine: string[] | string;
  createdAt: Date;
}

interface File {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  createdAt: Date;
}

const TableauDeBord: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
      id: "1",
      intitule: "Projet E-commerce",
      societe: "TechCorp",
      domaine: ["Web", "Mobile"],
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      intitule: "Application Mobile",
      societe: "StartupX",
      domaine: ["Mobile", "Design"],
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "3",
      intitule: "Dashboard Analytics",
      societe: "DataCo",
      domaine: ["Analytics", "Web"],
      createdAt: new Date("2024-01-08"),
    },
  ];

  const mockFiles: File[] = [
    {
      id: "1",
      name: "presentation.pdf",
      projectId: "1",
      projectName: "Projet E-commerce",
      createdAt: new Date("2024-01-16"),
    },
    {
      id: "2",
      name: "wireframes.fig",
      projectId: "2",
      projectName: "Application Mobile",
      createdAt: new Date("2024-01-12"),
    },
    {
      id: "3",
      name: "requirements.docx",
      projectId: "3",
      projectName: "Dashboard Analytics",
      createdAt: new Date("2024-01-09"),
    },
  ];

  const truncateFileName = (fileName: string, maxLength: number = 15) => {
    if (fileName.length <= maxLength) return fileName;
    return `${fileName.substring(0, maxLength)}...`;
  };

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setProjects(mockProjects);
      setFiles(mockFiles);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <p>Chargement des données récentes...</p>;
  }

  const projectColumns = [
    { key: "intitule", label: "Intitulé" },
    { key: "societe", label: "Entreprise" },
    { key: "domaine", label: "Domaine" },
    { key: "action", label: "Action" },
  ];

  const fileColumns = [
    { key: "name", label: "Nom du fichier" },
    { key: "projectName", label: "Projet" },
    { key: "createdAt", label: "Date d'ajout" },
    { key: "action", label: "Action" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
      <div>
        <h4 className="mb-6 text-xl font-semibold text-dark dark:text-white">
          Projets récents
        </h4>
        <Table
          aria-label="Projets récents"
          className="h-[400px] w-full overflow-y-auto scrollbar-hide"
        >
          <TableHeader columns={projectColumns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="text-dark dark:text-white"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={projects}>
            {(project) => (
              <TableRow key={project.id}>
                {(columnKey) => (
                  <TableCell>
                    {columnKey === "action" ? (
                      <Button
                        as={Link}
                        href={`/tableaudebord/projet/pageprojet/${project.id}`}
                        color="primary"
                        size="sm"
                      >
                        Voir
                      </Button>
                    ) : columnKey === "domaine" ? (
                      Array.isArray(project.domaine) ? project.domaine.join(", ") : project.domaine
                    ) : (
                      getKeyValue(project, columnKey)
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <h4 className="mb-6 text-xl font-semibold text-dark dark:text-white">
          Fichiers récents
        </h4>
        <Table
          aria-label="Fichiers récents"
          className="h-[400px] w-full overflow-y-auto scrollbar-hide"
        >
          <TableHeader columns={fileColumns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className="text-dark dark:text-white"
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={files}>
            {(file) => (
              <TableRow key={file.id}>
                {(columnKey) => (
                  <TableCell>
                    {columnKey === "name" ? (
                      <span title={file.name}>
                        {truncateFileName(file.name)}
                      </span>
                    ) : columnKey === "createdAt" ? (
                      file.createdAt.toLocaleDateString()
                    ) : columnKey === "action" ? (
                      <Button
                        as={Link}
                        href={`/tableaudebord/projet/pageprojet/${file.projectId}`}
                        color="primary"
                        size="sm"
                      >
                        Voir le projet
                      </Button>
                    ) : (
                      getKeyValue(file, columnKey)
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableauDeBord;