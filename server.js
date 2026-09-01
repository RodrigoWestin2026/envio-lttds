/* Serviço de envio da Plataforma TX — Latitudes
   A senha do e-mail NUNCA fica neste arquivo: ela entra como
   variável de ambiente no painel da hospedagem (Render/Vercel). */

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const {
  SMTP_HOST = "smtp.hostinger.com",
  SMTP_PORT = "465",
  SMTP_USER,          // contato@lttds.com.br
  SMTP_SENHA,         // definida só no painel da hospedagem
  CHAVE_API,          // código combinado com a plataforma
  BCC = "rodrigo@lttds.com.br,ana@lttds.com.br"
} = process.env;

app.get("/", (req, res) => {
  res.send("Serviço de envio Latitudes ativo.");
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

    const transporte = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_SENHA }
    });

    await transporte.sendMail({
      from: `"Latitudes — Estratégias para Futuros" <${SMTP_USER}>`,
      to: para,
      bcc: BCC.split(",").map(s => s.trim()).filter(Boolean),
      subject: assunto,
      text: corpo,
      attachments: pdfBase64 ? [{
        filename: nomeArquivo || "diagnostico-tx.pdf",
        content: pdfBase64,
        encoding: "base64",
        contentType: "application/pdf"
      }] : []
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("Falha no envio:", e.message);
    res.status(500).json({ erro: "falha no envio" });
  }
});

const porta = process.env.PORT || 3000;
app.listen(porta, () => console.log("Serviço de envio na porta " + porta));
