import { Metadata } from 'next';
import IncidentDetail from '@/components/TableauDeBord/Incidents/Voir';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Incident ${resolvedParams.id} - DATALYS Consulting`,
    description: `Détails de l'incident ${resolvedParams.id}`,
  };
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const incidentId = parseInt(resolvedParams.id);
  
  if (isNaN(incidentId)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
          <p className="text-gray-600">ID d'incident invalide</p>
        </div>
      </div>
    );
  }

  return <IncidentDetail incidentId={incidentId} />;
}