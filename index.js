import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const { CLIENT_ID, CLIENT_SECRET, OMADA_BASE_URL, PORT } = process.env;

let accessToken = null;
let tokenExpiresAt = 0;

// Función para obtener token OAuth2 (client_credentials)
async function getAccessToken() {
  // Si token vigente, retornarlo
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const url = `${OMADA_BASE_URL}/v2/oauth/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error al obtener token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 30) * 1000; // guardamos token 30s antes de expirar

  return accessToken;
}

// Endpoint para listar sitios
app.get("/sites", async (req, res) => {
  try {
    const token = await getAccessToken();
    const url = `${OMADA_BASE_URL}/v2/sites`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Error al obtener sitios", details: errorText });
    }

    const sites = await response.json();
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para autenticar usuario portal cautivo
app.post("/portal/auth", async (req, res) => {
  /*
    Espera JSON con:
    {
      clientMac: "xx:xx:xx:xx:xx:xx",
      // otros parámetros necesarios
    }
  */
  try {
    const { clientMac } = req.body;

    if (!clientMac) {
      return res.status(400).json({ error: "clientMac es requerido" });
    }

    const token = await getAccessToken();
    const url = `${OMADA_BASE_URL}/v2/portal/auth`;

    // Aquí depende de la documentación exacta qué parámetros necesita la API
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ clientMac }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Error en autenticación portal", details: errorText });
    }

    const authResult = await response.json();
    res.json(authResult);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
