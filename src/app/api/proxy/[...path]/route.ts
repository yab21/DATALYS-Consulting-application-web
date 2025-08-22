import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BACKEND_URL || 'http://82.112.253.137:8082';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, params, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxyRequest(request, params, 'PATCH');
}

async function handleProxyRequest(
  request: NextRequest, 
  params: Promise<{ path: string[] }>, 
  method: string
) {
  try {
    const { path } = await params;
    const apiPath = path.join('/');
    const targetUrl = `${API_BASE_URL}/${apiPath}`;
    
    // Construire l'URL avec les query parameters
    const url = new URL(targetUrl);
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Préparer les headers
    const headers: Record<string, string> = {};
    
    // Copier les headers importants du request original
    const importantHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'x-requested-with'
    ];
    
    importantHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value) {
        headers[headerName] = value;
      }
    });

    // Préparer le body pour les méthodes qui l'acceptent
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const text = await request.text();
        if (text) {
          body = text;
        }
      } catch (error) {
        console.warn('Erreur lors de la lecture du body:', error);
      }
    }

    // Faire l'appel à l'API backend
    console.log(`🔄 Proxy ${method} vers:`, url.toString());
    
    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
    });

    // Récupérer la réponse
    const responseText = await response.text();
    
    // Créer la réponse Next.js
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Erreur proxy API:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur du proxy API', 
        message: error instanceof Error ? error.message : 'Erreur inconnue' 
      },
      { status: 500 }
    );
  }
}

// Gestion des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}