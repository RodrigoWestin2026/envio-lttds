/* Serviço de envio da Plataforma TX — Latitudes (v2 — API Brevo)
   Motivo da v2: o plano gratuito do Render bloqueia as portas de SMTP
   (25/465/587) desde set/2025. O Brevo envia por HTTPS (porta 443),
   que não é bloqueada. Nenhuma senha fica neste arquivo. */

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const {
  BREVO_API_KEY,      // chave criada no painel do Brevo
  REMETENTE = "contato@lttds.com.br",
  CHAVE_API,          // código combinado com a plataforma
  BCC = "rodrigo@lttds.com.br,ana@lttds.com.br"
} = process.env;

app.get("/", (req, res) => {
  res.send("Serviço de envio Latitudes ativo (v2 — Brevo).");
});

app.post("/enviar", async (req, res) => {
  try {
    if (!CHAVE_API || req.get("x-chave") !== CHAVE_API) {
      return res.status(401).json({ erro: "chave inválida" });
    }
    const { para, assunto, corpo, pdfBase64, nomeArquivo } = req.body || {};
    if (!para || !assunto || !corpo) {
      return res.status(400).json({ erro: "campos obrigatórios: para, assunto, corpo" });
    }

    const payload = {
      sender: { name: "Latitudes — Estratégias para Futuros", email: REMETENTE },
      to: [{ email: para }],
      bcc: BCC.split(",").map(s => ({ email: s.trim() })).filter(x => x.email),
      subject: assunto,
      textContent: corpo
    };
    if (pdfBase64) {
      payload.attachment = [{
        name: nomeArquivo || "diagnostico-tx.pdf",
        content: pdfBase64
      }];
    }

    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      console.error("Brevo recusou:", resposta.status, detalhe);
      return res.status(500).json({ erro: "falha no envio" });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("Falha no envio:", e.message);
    res.status(500).json({ erro: "falha no envio" });
  }
});

const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log("Serviço de envio (v2) na porta " + porta));
