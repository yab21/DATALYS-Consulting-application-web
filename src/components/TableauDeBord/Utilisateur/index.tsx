"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import DataTable, { Column } from "@/components/UI/DataTable/DataTable";
import PermissionManager, { User } from "@/components/UI/PermissionManager/PermissionManager";
import { useNotifications } from "@/context/NotificationContext";

const Utilisateur = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Données mockées pour remplacer Firebase
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler chargement

      const mockUsers: User[] = [
        {
          id: "1",
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@datalys.fr",
          role: "admin",
          permissions: ["read", "write", "delete", "create_project", "manage_users"],
          departement: "IT",
          isActive: true,
          createdAt: new Date("2023-01-15"),
          lastLogin: new Date("2024-01-20"),
        },
        {
          id: "2",
          nom: "Martin",
          prenom: "Marie",
          email: "marie.martin@datalys.fr",
          role: "manager",
          permissions: ["read", "write", "create_project"],
          departement: "Marketing",
          isActive: true,
          createdAt: new Date("2023-03-22"),
          lastLogin: new Date("2024-01-19"),
        },
        {
          id: "3",
          nom: "Bernard",
          prenom: "Sophie",
          email: "sophie.bernard@datalys.fr",
          role: "editor",
          permissions: ["read", "write"],
          departement: "Commercial",
          isActive: true,
          createdAt: new Date("2023-06-10"),
          lastLogin: new Date("2024-01-18"),
        },
        {
          id: "4",
          nom: "Durand",
          prenom: "Pierre",
          email: "pierre.durand@datalys.fr",
          role: "viewer",
          permissions: ["read"],
          departement: "Finance",
          isActive: false,
          createdAt: new Date("2023-08-05"),
          lastLogin: new Date("2023-12-15"),
        },
      ];

      setUsers(mockUsers);
      setLoading(false);
    };

    loadUsers();
  }, []);

  // Gestionnaires pour le PermissionManager
  const handleUserUpdate = async (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    
    addNotification({
      title: "Utilisateur mis à jour",
      body: `${updatedUser.prenom} ${updatedUser.nom} a été mis à jour avec succès`,
      type: "success",
      priority: "medium",
      category: "user",
      read: false,
    });
  };

  const handleUserCreate = async (newUserData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
    };
    
    setUsers(prev => [newUser, ...prev]);
    
    addNotification({
      title: "Utilisateur créé",
      body: `${newUser.prenom} ${newUser.nom} a été ajouté au système`,
      type: "success",
      priority: "medium",
      category: "user",
      read: false,
    });
  };

  const handleUserDelete = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    if (user) {
      addNotification({
        title: "Utilisateur supprimé",
        body: `${user.prenom} ${user.nom} a été supprimé du système`,
        type: "warning",
        priority: "medium",
        category: "user",
        read: false,
      });
    }
  };

  return (
    <>
      <Breadcrumb pageName="Gestion des Utilisateurs" />
      <div className="mt-5 w-full max-w-full">
        <PermissionManager
          users={users}
          onUserUpdate={handleUserUpdate}
          onUserCreate={handleUserCreate}
          onUserDelete={handleUserDelete}
        />
      </div>
    </>
  );
};

export default Utilisateur;
