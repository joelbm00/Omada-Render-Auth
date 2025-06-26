// index.js
const express = require("express");
const fetch = require("node-fetch");
const https = require("https");
const cors = require("cors");
const dns = require("dns");

function verificarDominioNgrok(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        console.error(`🛑 No se pudo resolver ${host}:`, err.message);
        return reject("El controlador no está disponible (ngrok inactivo o mal configurado).");
      }
      console.log(`🔍 Dominio resuelto: ${host} → ${address}`);
      resolve(address);
    });
  });
}


const app = express();
const port = process.env.PORT || 3000;

const CONTROLLER = "b1a4-190-34-133-54.ngrok-free.app";
const CONTROLLER_PORT = 443;
const CONTROLLER_ID = "6657e53f19e72732099b4edd5ab1105b";
const OPERATOR_USER = "guest-portal";
const OPERATOR_PASS = "Tplink!2027";

app.use(express.json());

app.use(cors({
  origin: "https://pumaweb-d8ef2.web.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

app.post("/autorizar", async (req, res) => {
  const { clientMac, clientIp, gatewayMac, vid, redirectURL } = req.body;

  if (!clientMac || !clientIp || !gatewayMac || !vid || !redirectURL) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  try {
    await verificarDominioNgrok(CONTROLLER);
    const loginRes = await fetch(`https://${CONTROLLER}:${CONTROLLER_PORT}/${CONTROLLER_ID}/api/v2/hotspot/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: OPERATOR_USER, password: OPERATOR_PASS }),
      agent: new https.Agent({ rejectUnauthorized: false }),
     });
     console.log("📦 Payload recibido:", req.body);
    if (!loginRes.ok) throw new Error("Login fallido");

    const csrfToken = loginRes.headers.get("x-csrf-token");
    const cookies = loginRes.headers.get("set-cookie");
console.log("🔥 Autorizando con:", {
  csrfToken,
  cookies,
  clientMac,
  clientIp,
  gatewayMac,
  vid,
  redirectURL
});

    const authRes = await fetch(`https://${CONTROLLER}:${CONTROLLER_PORT}/${CONTROLLER_ID}/api/v2/hotspot/extPortal/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        "Cookie": cookies
      },
      body: JSON.stringify({ clientMac, clientIp, gatewayMac, vid, redirectURL }),
      agent: new https.Agent({ rejectUnauthorized: false })
    });

    const authText = await authRes.text();
console.log("📨 Respuesta OC200:", authRes.status, authText);


    if (!authRes.ok) {
  const errorText = await authRes.text();
  throw new Error(`Autorización fallida: ${authRes.status} - ${errorText}`);
}


    return res.status(200).json({ success: true, message: "Cliente autorizado" });
  } catch (err) {
    console.error("❌ Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor escuchando en puerto ${port}`);
});
