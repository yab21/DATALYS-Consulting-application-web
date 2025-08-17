// Test simple de l'API pour vérifier la connectivité
const API_BASE_URL = 'http://82.112.253.137:8082';

async function testApiConnection() {
  try {
    console.log('🧪 Test de connectivité API...');
    console.log('URL de base:', API_BASE_URL);
    
    // Test de connexion simple
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      }),
    });
    
    console.log('📡 Statut login:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login test successful:', loginData);
      
      // Test de getByCriteria
      const partnersResponse = await fetch(`${API_BASE_URL}/partners/getByCriteria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.data?.token || 'fake-token'}`
        },
        body: JSON.stringify({
          index: 0,
          size: 10,
          data: {
            name: "",
            is_active: true
          }
        }),
      });
      
      console.log('📡 Statut getByCriteria:', partnersResponse.status);
      
      if (partnersResponse.ok) {
        const partnersData = await partnersResponse.json();
        console.log('✅ getByCriteria test successful:', partnersData);
      } else {
        const errorText = await partnersResponse.text();
        console.log('❌ getByCriteria error:', errorText);
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur de test API:', error);
  }
}

// Exécuter le test
testApiConnection();