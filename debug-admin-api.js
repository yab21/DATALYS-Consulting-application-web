// Script de test pour l'API admin
console.log("🧪 Test API Admin Dashboard");

const API_BASE_URL = "http://82.112.253.137:8082";
const endpoint = "/dashboard/admin/overview";

// Simuler un token admin (remplacez par votre vrai token)
const token = "YOUR_ADMIN_TOKEN_HERE";

fetch(`${API_BASE_URL}${endpoint}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
.then(async response => {
  console.log("📡 Status:", response.status);
  console.log("📡 Status Text:", response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur:", errorText);
    return;
  }
  
  const data = await response.json();
  console.log("✅ Données reçues:", JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error("❌ Erreur réseau:", error);
});