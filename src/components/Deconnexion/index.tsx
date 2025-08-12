"use client";

import Link from "next/link";

const DeconnexionButton: React.FC = () => {
  return (
    <Link href="/connexion">
      <button>
        Se déconnecter
      </button>
    </Link>
  );
};

export default DeconnexionButton;
