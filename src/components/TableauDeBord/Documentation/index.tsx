"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  BookOpen,
  LogIn,
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  Wrench,
  MessageSquare,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  UserCircle,
  Bell,
  SearchIcon,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  FileText,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Filter,
  Moon,
  Sun,
  Clock,
  History,
  PauseCircle,
} from "lucide-react";

// Extraire le texte d'un ReactNode pour la recherche full-text
const extractText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (typeof node === "object" && "props" in node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractText((node as any).props?.children);
  }
  return "";
};

// Types
interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  roles: ("admin" | "partner" | "all")[];
  content: React.ReactNode;
}

// Badge de rôle
const RoleBadge = ({ role }: { role: "admin" | "partner" | "all" }) => {
  const config = {
    admin: { label: "Admin", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    partner: { label: "Partenaire", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    all: { label: "Tous", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  };
  const { label, className } = config[role];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

// Composant étape
const Step = ({ number, children }: { number: number; children: React.ReactNode }) => (
  <div className="flex gap-3 mb-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4ba9b7]/10 text-sm font-bold text-[#4ba9b7]">
      {number}
    </div>
    <div className="pt-0.5 text-gray-700 dark:text-gray-300">{children}</div>
  </div>
);

// Composant info
const InfoBox = ({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "tip" }) => {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    tip: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300",
  };
  const icons = {
    info: "💡",
    warning: "⚠️",
    tip: "✅",
  };
  return (
    <div className={`my-4 rounded-lg border p-4 text-sm ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  );
};

// Composant pour masquer le contenu admin aux partenaires
const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return null;
  return <>{children}</>;
};

const Documentation: React.FC = () => {
  const { isAdmin, isPartner } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["introduction"]));
  const [activeSection, setActiveSection] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    setExpandedSections((prev) => new Set(prev).add(id));
    window.history.replaceState(null, "", `#${id}`);
    setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Deep-linking : ouvrir la section depuis le hash URL
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setExpandedSections((prev) => new Set(prev).add(hash));
      setTimeout(() => {
        sectionRefs.current[hash]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);

  // Observer pour détecter la section active
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Définition des sections
  const sections: Section[] = [
    {
      id: "introduction",
      title: "Introduction",
      icon: <BookOpen className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-4">
          <p>
            Bienvenue sur la plateforme <strong>DATALYS Consulting</strong>. Cette application web vous permet de gérer
            vos projets, suivre les incidents, communiquer avec l&apos;équipe DATALYS et accéder à vos documents en toute sécurité.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Accès à la plateforme</h4>
          <p>
            Rendez-vous sur l&apos;URL fournie par DATALYS Consulting. L&apos;application est compatible avec les navigateurs
            modernes : <strong>Chrome</strong>, <strong>Firefox</strong>, <strong>Safari</strong> et <strong>Edge</strong>.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Deux types d&apos;utilisateurs</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Administrateur</strong> <RoleBadge role="admin" /> — Équipe DATALYS : accès complet à la gestion des projets,
              partenaires, utilisateurs, incidents, support et analytics.
            </li>
            <li>
              <strong>Partenaire</strong> <RoleBadge role="partner" /> — Clients DATALYS : accès à vos projets, documents,
              incidents liés et communication avec l&apos;équipe DATALYS.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "connexion",
      title: "Connexion & Sécurité",
      icon: <LogIn className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Se connecter</h4>
            <Step number={1}>Accédez à la page de connexion.</Step>
            <Step number={2}>Saisissez votre <strong>adresse email</strong> et votre <strong>mot de passe</strong>.</Step>
            <Step number={3}>Cliquez sur <strong>&quot;Se connecter&quot;</strong>.</Step>
            <Step number={4}>Si la vérification en deux étapes (MFA) est activée, un code à 6 chiffres sera envoyé à votre email. Saisissez-le pour finaliser la connexion.</Step>
            <InfoBox type="tip">
              Vous pouvez coller le code MFA directement depuis votre presse-papiers — les 6 champs se remplissent automatiquement.
              Si vous n&apos;avez pas reçu le code, cliquez sur <strong>&quot;Renvoyer le code&quot;</strong> pour recevoir un nouveau code par email.
            </InfoBox>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Mot de passe oublié</h4>
            <Step number={1}>Sur la page de connexion, cliquez sur <strong>&quot;Mot de passe oublié ?&quot;</strong>.</Step>
            <Step number={2}>Entrez votre adresse email.</Step>
            <Step number={3}>Un lien de réinitialisation sera envoyé à votre email.</Step>
            <Step number={4}>Cliquez sur le lien reçu et définissez un nouveau mot de passe.</Step>
            <InfoBox type="warning">
              Le lien de réinitialisation expire après un certain temps. Si le lien est invalide, refaites une demande.
            </InfoBox>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Changement de mot de passe temporaire</h4>
            <p>
              Lors de votre première connexion avec un mot de passe temporaire (fourni par l&apos;administrateur),
              vous serez automatiquement redirigé pour définir un nouveau mot de passe sécurisé.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Mode sombre / clair</h4>
            <p>
              Cliquez sur l&apos;icône <Moon className="inline h-4 w-4" /> / <Sun className="inline h-4 w-4" /> en haut à droite
              pour basculer entre le mode sombre et le mode clair. Votre préférence est sauvegardée automatiquement.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Expiration de session</h4>
            <p>
              Pour des raisons de sécurité, votre session expire automatiquement après une période d&apos;inactivité.
              Vous serez redirigé vers la page de connexion avec un message vous informant de l&apos;expiration.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "tableau-de-bord",
      title: "Tableau de bord",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-4">
          <p>
            Le tableau de bord est votre page d&apos;accueil après connexion. Il offre une vue d&apos;ensemble de votre activité.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h4>
          <p>
            La <strong>barre latérale</strong> (sidebar) à gauche vous permet d&apos;accéder à toutes les sections de l&apos;application.
            Les éléments visibles dépendent de votre rôle et de vos permissions.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Barre de recherche</h4>
          <p>
            La barre de recherche en haut (<strong>Cmd+K</strong> ou <strong>Ctrl+K</strong>) permet de rechercher rapidement :
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Des <strong>projets</strong></li>
            <li>Des <strong>dossiers</strong> (vous serez redirigé vers le projet contenant le dossier)</li>
            <AdminOnly>
              <li>Des <strong>utilisateurs</strong> (admin uniquement)</li>
              <li>Des <strong>partenaires</strong> (admin uniquement)</li>
            </AdminOnly>
          </ul>
          <InfoBox>
            Utilisez les filtres (chips) dans la barre de recherche pour affiner par type de résultat.
          </InfoBox>
        </div>
      ),
    },
    {
      id: "projets",
      title: "Gestion des Projets",
      icon: <FolderKanban className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Consulter les projets
            </h4>
            <p className="mb-2">
              Accédez à <strong>Projets</strong> dans le sidebar pour voir la liste de vos projets.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><RoleBadge role="admin" /> Voir tous les projets de tous les partenaires</li>
              <li><RoleBadge role="partner" /> Voir uniquement vos projets assignés</li>
            </ul>
          </div>

          <AdminOnly>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Créer un projet <RoleBadge role="admin" />
              </h4>
              <Step number={1}>Cliquez sur <strong>&quot;Ajouter un projet&quot;</strong>.</Step>
              <Step number={2}>Remplissez les informations du projet (nom, description, partenaire, etc.).</Step>
              <Step number={3}>Validez la création.</Step>
            </div>
          </AdminOnly>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Page détails d&apos;un projet
            </h4>
            <p className="mb-2">Cliquez sur un projet pour accéder à sa page complète :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Informations</strong> — Détails du projet, statut, dates</li>
              <li><strong>Dossiers & Fichiers</strong> — Arborescence de dossiers, upload de fichiers, prévisualisation</li>
            </ul>
          </div>

          <AdminOnly>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Clôturer un projet <RoleBadge role="admin" />
              </h4>
              <p className="mb-2">
                Un administrateur peut clôturer un projet directement depuis la table des projets.
              </p>
              <Step number={1}>Dans la liste des projets, cliquez sur le menu d&apos;actions <strong>(⋮)</strong> du projet concerné.</Step>
              <Step number={2}>Sélectionnez <strong>&quot;Clôturer&quot;</strong>.</Step>
              <Step number={3}>Saisissez un <strong>motif de clôture</strong> (obligatoire) expliquant la raison.</Step>
              <Step number={4}>Confirmez la clôture.</Step>
              <InfoBox>
                Le projet clôturé apparaît avec un badge <strong>&quot;Clôturé&quot;</strong> en rouge dans la table, accompagné du motif de clôture.
              </InfoBox>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Rouvrir un projet clôturé <RoleBadge role="admin" />
              </h4>
              <p className="mb-2">
                Un projet clôturé peut être rouvert si nécessaire.
              </p>
              <Step number={1}>Dans la liste des projets, repérez le projet avec le badge <strong>&quot;Clôturé&quot;</strong>.</Step>
              <Step number={2}>Cliquez sur le menu d&apos;actions <strong>(⋮)</strong> et sélectionnez <strong>&quot;Rouvrir&quot;</strong>.</Step>
              <Step number={3}>Confirmez la réouverture.</Step>
              <InfoBox type="tip">
                Après réouverture, le projet retrouve son statut <strong>&quot;Actif&quot;</strong> et le motif de clôture est supprimé.
              </InfoBox>
            </div>
          </AdminOnly>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Gestion des fichiers
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminOnly>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4 text-[#4ba9b7]" />
                    <strong className="text-sm">Upload</strong> <RoleBadge role="admin" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Glissez-déposez ou cliquez pour ajouter des fichiers.</p>
                </div>
              </AdminOnly>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-[#4ba9b7]" />
                  <strong className="text-sm">Prévisualisation</strong>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">PDF, images, documents Office directement dans le navigateur.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "incidents",
      title: "Gestion des Incidents",
      icon: <AlertTriangle className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Consulter les incidents</h4>
            <p>Accédez à <strong>Incidents</strong> dans le sidebar pour voir la liste des incidents.</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><RoleBadge role="admin" /> Voir tous les incidents de tous les partenaires</li>
              <li><RoleBadge role="partner" /> Voir les incidents liés à vos projets</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Statuts d&apos;un incident</h4>
            <p className="mb-2">Un incident peut passer par les statuts suivants :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Ouvert</strong> — L&apos;incident vient d&apos;être créé</li>
              <li><strong>En cours</strong> — L&apos;incident est en cours de traitement</li>
              <li><strong>En attente</strong> — L&apos;incident est suspendu (un motif est requis)</li>
              <li><strong>Résolu</strong> — Le problème a été corrigé</li>
              <li><strong>Fermé</strong> — L&apos;incident est clôturé définitivement</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Détails d&apos;un incident</h4>
            <p className="mb-2">Cliquez sur un incident pour voir sa page complète avec les onglets suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Détails</strong> — Informations générales, statut, priorité, SLA</li>
              <li><strong>Commentaires</strong> — Échanges et notes sur l&apos;incident</li>
              <li><strong>Fichiers</strong> — Documents et pièces jointes</li>
              <li><strong>Résolution</strong> — Notes et détails de la résolution</li>
              <li><strong>Historique</strong> — Timeline complète de toutes les actions effectuées sur l&apos;incident (création, changements de statut, modifications, commentaires)</li>
            </ul>
            <InfoBox>
              L&apos;onglet <strong>Historique</strong> affiche une timeline visuelle avec l&apos;auteur, la date et le détail de chaque action.
            </InfoBox>
          </div>

          <AdminOnly>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Gérer un incident <RoleBadge role="admin" /></h4>
              <p className="mb-2">Les administrateurs peuvent modifier le statut, la priorité, ajouter des notes de résolution et joindre des fichiers.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Mettre un incident en attente <RoleBadge role="admin" />
              </h4>
              <p className="mb-2">
                Lorsqu&apos;un incident nécessite une pause (attente d&apos;informations, dépendance externe, etc.), un administrateur peut le passer en statut <strong>&quot;En attente&quot;</strong>.
              </p>
              <Step number={1}>Depuis la liste des incidents, cliquez sur <strong>&quot;Mettre en pause&quot;</strong> dans le menu d&apos;actions, ou modifiez l&apos;incident et changez le statut à <strong>&quot;En attente&quot;</strong>.</Step>
              <Step number={2}>Un champ <strong>&quot;Motif de mise en attente&quot;</strong> apparaît — saisissez la raison (obligatoire).</Step>
              <Step number={3}>Validez la modification.</Step>
              <InfoBox type="warning">
                Le motif d&apos;attente est obligatoire. Vous ne pourrez pas enregistrer le changement sans l&apos;avoir renseigné.
              </InfoBox>
            </div>
          </AdminOnly>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Exporter les incidents
            </h4>
            <p>
              Depuis la liste des incidents, vous pouvez exporter les données au format souhaité en cliquant sur le bouton <strong>&quot;Exporter&quot;</strong>.
              L&apos;export inclut les informations de chaque incident : numéro, titre, statut, priorité, dates et assignation.
            </p>
            <InfoBox type="tip">
              Utilisez les filtres avant d&apos;exporter pour ne récupérer que les incidents qui vous intéressent.
            </InfoBox>
          </div>
        </div>
      ),
    },
    {
      id: "support",
      title: "Support Technique",
      icon: <Wrench className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Consulter les tickets</h4>
            <p>Accédez à <strong>Support</strong> dans le sidebar pour voir vos tickets de support technique.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Détails d&apos;un ticket</h4>
            <p>
              Cliquez sur un ticket pour voir l&apos;historique complet des échanges, le statut actuel,
              la priorité et les fichiers joints.
            </p>
          </div>
          <AdminOnly>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Gérer un ticket <RoleBadge role="admin" /></h4>
              <p>Les administrateurs peuvent mettre à jour le statut, ajouter des résolutions, réassigner et clôturer les tickets.</p>
            </div>
          </AdminOnly>
        </div>
      ),
    },
    {
      id: "messages",
      title: "Messagerie",
      icon: <MessageSquare className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-4">
          <p>
            La section <strong>Messages</strong> vous permet de communiquer directement avec l&apos;équipe DATALYS.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><RoleBadge role="admin" /> Communiquer avec tous les partenaires</li>
            <li><RoleBadge role="partner" /> Envoyer des messages à l&apos;équipe DATALYS</li>
          </ul>
          <InfoBox type="tip">
            Les nouveaux messages sont signalés en temps réel grâce aux notifications push. Vous recevrez une alerte dès qu&apos;un message arrive.
          </InfoBox>
        </div>
      ),
    },
    {
      id: "utilisateurs",
      title: "Gestion des Utilisateurs",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"],
      content: (
        <div className="space-y-6">
          <p>
            Accessible via <strong>Utilisateurs</strong> dans le sidebar. Cette section permet de gérer tous les comptes utilisateurs de la plateforme.
          </p>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Liste des utilisateurs</h4>
            <p>Consultez tous les utilisateurs (administrateurs et partenaires). Recherchez par nom, email ou entreprise. Filtrez par statut (actif/inactif).</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Créer un utilisateur</h4>
            <Step number={1}>Cliquez sur <strong>&quot;Ajouter un utilisateur&quot;</strong>.</Step>
            <Step number={2}>Remplissez les informations : nom, email, rôle (Admin ou Partenaire).</Step>
            <Step number={3}>Un mot de passe temporaire sera envoyé à l&apos;utilisateur par email.</Step>
            <InfoBox>
              L&apos;utilisateur devra changer son mot de passe temporaire lors de sa première connexion.
            </InfoBox>
          </div>
        </div>
      ),
    },
    {
      id: "partenaires",
      title: "Gestion des Partenaires",
      icon: <Building2 className="h-5 w-5" />,
      roles: ["admin"],
      content: (
        <div className="space-y-6">
          <p>
            Accessible via <strong>Partenaires</strong> dans le sidebar. Gérez les entreprises clientes de DATALYS.
          </p>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Liste des partenaires</h4>
            <p>Consultez toutes les entreprises partenaires, leurs projets associés et leurs utilisateurs.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ajouter un partenaire</h4>
            <Step number={1}>Cliquez sur <strong>&quot;Ajouter un partenaire&quot;</strong>.</Step>
            <Step number={2}>Renseignez les informations de l&apos;entreprise : nom, logo, coordonnées.</Step>
            <Step number={3}>Validez la création du partenaire.</Step>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ["admin"],
      content: (
        <div className="space-y-4">
          <p>
            Le tableau de bord analytique offre une vue globale de l&apos;activité de la plateforme :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Statistiques globales</strong> — Nombre de projets, incidents, utilisateurs actifs</li>
            <li><strong>Activité partenaires</strong> — Rapports d&apos;activité par partenaire</li>
            <li><strong>Performance projets</strong> — Suivi de l&apos;avancement et des délais</li>
            <li><strong>Statistiques incidents</strong> — Taux de résolution, temps moyen de traitement</li>
          </ul>
        </div>
      ),
    },
    {
      id: "roles",
      title: "Rôles & Permissions",
      icon: <ShieldCheck className="h-5 w-5" />,
      roles: ["admin"],
      content: (
        <div className="space-y-4">
          <p>
            Accessible via <strong>Rôles</strong> dans le sidebar. Configurez les droits d&apos;accès des utilisateurs.
          </p>
          <p>
            Chaque rôle définit un ensemble de permissions qui déterminent ce qu&apos;un utilisateur peut voir et faire dans l&apos;application.
          </p>
          <InfoBox type="warning">
            Modifiez les permissions avec précaution. Un changement de rôle affecte immédiatement tous les utilisateurs ayant ce rôle.
          </InfoBox>
        </div>
      ),
    },
    {
      id: "profil",
      title: "Mon Profil",
      icon: <UserCircle className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-6">
          <p>
            Accédez à votre profil via <strong>Profil</strong> dans le sidebar ou en cliquant sur votre avatar en haut à droite.
          </p>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Voir mon profil</h4>
            <p>Consultez vos informations personnelles, votre rôle et votre entreprise associée.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Modifier mon profil</h4>
            <p>Mettez à jour vos informations personnelles (nom, email, etc.).</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Changer mon mot de passe</h4>
            <Step number={1}>Allez dans <strong>Profil &gt; Changer le mot de passe</strong>.</Step>
            <Step number={2}>Entrez votre mot de passe actuel.</Step>
            <Step number={3}>Définissez un nouveau mot de passe (minimum 8 caractères).</Step>
            <Step number={4}>Confirmez le nouveau mot de passe et validez.</Step>
          </div>
        </div>
      ),
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-4">
          <p>L&apos;application vous notifie en temps réel des événements importants :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Nouveaux messages</strong> — Quand vous recevez un message</li>
            <li><strong>Incidents</strong> — Nouveau incident ou mise à jour de statut</li>
            <li><strong>Support</strong> — Réponse à un ticket de support</li>
          </ul>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Types de notifications</h4>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>En temps réel</strong> — Affichées directement dans l&apos;application (icône cloche en haut)</li>
            <li><strong>Push</strong> — Notifications sur votre navigateur même si l&apos;application n&apos;est pas au premier plan</li>
          </ul>
          <InfoBox type="tip">
            Autorisez les notifications push dans votre navigateur pour ne rien manquer.
          </InfoBox>
        </div>
      ),
    },
    {
      id: "recherche",
      title: "Recherche Globale",
      icon: <SearchIcon className="h-5 w-5" />,
      roles: ["all"],
      content: (
        <div className="space-y-4">
          <p>
            La barre de recherche (<strong>Cmd+K</strong> / <strong>Ctrl+K</strong>) en haut de page permet une recherche instantanée dans toute la plateforme.
          </p>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Résultats par type</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Projets</strong> — Redirige vers la page du projet</li>
            <li><strong>Dossiers</strong> — Redirige vers le projet contenant le dossier (onglet fichiers)</li>
            <AdminOnly>
              <li><strong>Utilisateurs</strong> — Redirige vers le profil de l&apos;utilisateur <RoleBadge role="admin" /></li>
              <li><strong>Partenaires</strong> — Redirige vers la fiche du partenaire <RoleBadge role="admin" /></li>
            </AdminOnly>
          </ul>
          <InfoBox>
            Utilisez les filtres (badges cliquables) sous la barre de recherche pour affiner par catégorie.
          </InfoBox>
        </div>
      ),
    },
  ];

  // Filtrer les sections selon le rôle
  const filteredSections = sections.filter((section) => {
    if (section.roles.includes("all")) return true;
    if (isAdmin() && section.roles.includes("admin")) return true;
    if (isPartner() && section.roles.includes("partner")) return true;
    return false;
  });

  // Filtrer par recherche (titre + contenu)
  const searchFilteredSections = searchQuery
    ? filteredSections.filter((section) => {
        const query = searchQuery.toLowerCase();
        return (
          section.title.toLowerCase().includes(query) ||
          extractText(section.content).toLowerCase().includes(query)
        );
      })
    : filteredSections;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4ba9b7]/10">
            <BookOpen className="h-5 w-5 text-[#4ba9b7]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl">
            Guide d&apos;utilisation
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-13">
          Documentation complète pour utiliser la plateforme DATALYS Consulting
        </p>
      </motion.div>

      <div className="flex gap-8">
        {/* Table des matières (desktop) */}
        <motion.nav
          className="hidden w-64 shrink-0 lg:block"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="sticky top-24 space-y-1">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Sommaire
            </h3>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-all focus:border-[#4ba9b7] focus:ring-2 focus:ring-[#4ba9b7]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
            </div>
            {searchFilteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  activeSection === section.id
                    ? "bg-[#4ba9b7]/10 font-medium text-[#4ba9b7]"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {section.icon}
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </div>
        </motion.nav>

        {/* Contenu principal */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Search mobile */}
          <div className="relative mb-6 lg:hidden">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans la documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition-all focus:border-[#4ba9b7] focus:ring-2 focus:ring-[#4ba9b7]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          {searchFilteredSections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="scroll-mt-24"
            >
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {/* Section header (collapsible) */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4ba9b7]/10 text-[#4ba9b7]">
                      {section.icon}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                    <div className="flex gap-1.5">
                      {section.roles.map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {/* Section content */}
                {expandedSections.has(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100 px-6 py-5 dark:border-gray-700"
                  >
                    {section.content}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          {searchFilteredSections.length === 0 && (
            <div className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Aucune section ne correspond à &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
