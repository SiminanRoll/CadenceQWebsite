const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const siteRoot = __dirname;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(siteRoot));

app.post("/api/contact", async (req, res) => {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim();
  const company = (req.body.company || "").trim();
  const message = (req.body.message || "").trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Please complete name, email, and message." });
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailIsValid) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <h2>New CadenceQ Demo Request</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: "support@cadenceq.com",
      replyTo: email,
      subject: `New Demo Request from ${name}`,
      html,
      text: [
        "New CadenceQ Demo Request",
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "Not provided"}`,
        `Submitted: ${submittedAt}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    return res.json({ message: "Thanks. Your request has been sent and we will be in touch shortly." });
  } catch (error) {
    console.error("Contact form send failed:", error);
    return res.status(500).json({ error: "We could not send your request right now. Please try again shortly." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(siteRoot, "index.html"));
});

app.get("/about", (_req, res) => {
  res.sendFile(path.join(siteRoot, "about", "index.html"));
});

app.get("/contact", (_req, res) => {
  res.sendFile(path.join(siteRoot, "contact", "index.html"));
});

app.get("/pricing", (_req, res) => {
  res.sendFile(path.join(siteRoot, "pricing", "index.html"));
});

app.get("/product", (_req, res) => {
  res.sendFile(path.join(siteRoot, "product", "index.html"));
});

app.listen(port, () => {
  console.log(`CadenceQ site running on port ${port}`);
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
