// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const {
  OMADA_CLIENT_ID,
  OMADA_CLIENT_SECRET,
  OMADA_BASE_URL,
  OMADA_SITE_ID
} = process.env;

let cachedToken = null;
let tokenExpiresAt = null;

// Función para obtener el access_token
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await axios.post(`${OMADA_BASE_URL}/v2/token`, {
    grant_type: 'client_credentials',
    client_id: OMADA_CLIENT_ID,
    client_secret: OMADA_CLIENT_SECRET,
  });

  const { access_token, expires_in } = response.data;
  cachedToken = access_token;
  tokenExpiresAt = now + expires_in * 1000;
  return access_token;
}

// Endpoint para autenticar cliente por MAC
app.post('/auth/omada', async (req, res) => {
  try {
    const { clientMac } = req.body;
    if (!clientMac) return res.status(400).json({ error: 'clientMac requerido' });

    const token = await getAccessToken();

    const result = await axios.post(
      `${OMADA_BASE_URL}/v2/sites/${OMADA_SITE_ID}/hotspot/clients/authenticate`,
      {
        mac: clientMac,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Cliente autenticado:", clientMac);
    res.status(200).json({ success: true, omada: result.data });
  } catch (error) {
    console.error("❌ Error autenticando en Omada:", error?.response?.data || error.message);
    res.status(500).json({ error: 'Error autenticando en Omada', details: error?.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Omada Auth corriendo en puerto ${PORT}`);
});

// ... código existente arriba

// Endpoint temporal para obtener los sitios (siteId)
app.get('/sites', async (req, res) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get(`${OMADA_BASE_URL}/v2/sites`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const sites = response.data.result || [];
    console.log("📋 Sitios disponibles:", sites);
    res.json(sites);
  } catch (error) {
    console.error("❌ Error al obtener sitios:", error?.response?.data || error.message);
    res.status(500).json({ error: 'Error al obtener sitios', details: error?.response?.data || error.message });
  }
});

