import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors());

// بس عشان نشوف القيم
console.log("📩 MAIL_TO =", process.env.MAIL_TO);
console.log("📩 SMTP_USER =", process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// اختبر الاتصال (مهم)
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP error:", err);
  } else {
    console.log("✅ SMTP ready to send");
  }
});

app.post("/api/send-email", async (req, res) => {
  console.log("📥 incoming /api/send-email:", req.body);  // <– هنا بنشوف الإحداثيات

  const {
    lat,
    lng,
    accuracy,
    ts,
    jobField,
    notes,
    from = "unknown",
  } = req.body || {};

  const to = process.env.MAIL_TO || process.env.SMTP_USER;
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;

  // نبني نص الإيميل
  const parts = [];
  parts.push(`مصدر الطلب: ${from}`);
  if (ts) parts.push(`الوقت: ${ts}`);
  if (lat && lng) {
    parts.push(`📍 الإحداثيات:`);
    parts.push(`- Latitude: ${lat}`);
    parts.push(`- Longitude: ${lng}`);
    if (accuracy) parts.push(`- الدقة: ~${Math.round(accuracy)} متر`);
    parts.push(
      `رابط الخرائط: https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    );
  }
  if (jobField) parts.push(`المجال المطلوب: ${jobField}`);
  if (notes) parts.push(`الملاحظات: ${notes}`);

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: "📍 إحداثيات زائر جديد + طلب وظيفة",
      text: parts.join("\n"),
    });
    console.log("✅ email sent:", info.messageId);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ email send failed:", err);
    res.status(500).json({ error: "email failed", details: err.toString() });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
