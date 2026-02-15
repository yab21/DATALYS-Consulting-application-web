"use client";

import dynamic from "next/dynamic";

const ConnexionLoading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4ba9b7] border-t-transparent"></div>
  </div>
);

const Connexion = dynamic(() => import("@/components/Connexion"), {
  ssr: false,
  loading: () => <ConnexionLoading />,
});

export default function ConnexionClient() {
  return <Connexion />;
}
