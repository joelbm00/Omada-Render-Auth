import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  const loginUrl = `${process.env.OMADA_OAUTH_URL}?client_id=${process.env.OMADA_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.OMADA_REDIRECT_URI)}&response_type=code&scope=omada.cloud.access`;
  res.send(`<a href="${loginUrl}">Iniciar sesión con Omada</a>`);
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No se recibió el código de autorización");

  try {
    const response = await axios.post(process.env.OMADA_TOKEN_URL, {
      clientId: process.env.OMADA_CLIENT_ID,
      clientSecret: process.env.OMADA_CLIENT_SECRET,
      code,
      grantType: "authorization_code",
      redirectUri: process.env.OMADA_REDIRECT_URI,
      omadaId: process.env.OMADA_ID
    });

    res.json({
      access_token: response.data.accessToken,
      refresh_token: response.data.refreshToken,
      expires_in: response.data.expiresIn
    });
  } catch (error) {
    console.error("Error al obtener token:", error.response?.data || error.message);
    res.status(500).json({
      error: "Error al obtener token",
      details: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor Omada OAuth corriendo en puerto ${port}`);
});
