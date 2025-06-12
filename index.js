const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/omada/auth', async (req, res) => {
  try {
    const {
      clientMac,
      clientIp,
      site,
      vid,
      t,
      gatewayMac,
      redirectUrl
    } = req.body;

    const authUrl = `http://190.34.133.54/portal/radius/auth?clientMac=${clientMac}&clientIp=${clientIp}&t=${t}&site=${site}&redirectUrl=${encodeURIComponent(redirectUrl)}&gatewayMac=${gatewayMac}&vid=${vid}`;

    const response = await axios.post(authUrl);

    res.status(response.status).send(response.data);
  } catch (err) {
    console.error('Error al contactar Omada:', err.message);
    res.status(500).send('Error al autenticar con el router.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy en http://localhost:${PORT}`);
});
