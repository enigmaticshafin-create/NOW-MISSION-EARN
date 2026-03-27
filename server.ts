import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // OTP Storage (In-memory for simplicity in this demo, or use Firestore)
  const otpStore = new Map<string, { otp: string, expires: number }>();

  // Nodemailer transporter setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // API routes
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(email, { otp, expires });

    const mailOptions = {
      from: `"NOW MISSION EARN" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code - NOW MISSION EARN",
      text: `Welcome to NOW MISSION EARN!

We are the ultimate task-based earning platform where you can complete simple missions and earn real money daily. Our platform is secure, fast, and built for everyone who wants to grow their income from home.

Your OTP verification code is: ${otp}

This code will expire in 5 minutes. Please do not share this code with anyone.

Best regards,
The NOW MISSION EARN Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ec4899; text-align: center;">NOW MISSION EARN</h2>
          <p>Welcome to <strong>NOW MISSION EARN</strong>!</p>
          <p>We are the ultimate task-based earning platform where you can complete simple missions and earn real money daily. Our platform is secure, fast, and built for everyone who wants to grow their income from home.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 16px;">Your OTP verification code is:</p>
          <div style="background: #fdf2f8; padding: 20px; text-align: center; border-radius: 10px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ec4899;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">This code will expire in 5 minutes. Please do not share this code with anyone.</p>
          <p style="font-size: 12px; color: #666;">Best regards,<br/>The NOW MISSION EARN Team</p>
        </div>
      `
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent successfully to your email" });
      } else {
        // Fallback for demo if env vars are missing
        console.log(`[DEMO MODE - OTP for ${email}]: ${otp}`);
        res.json({ message: "OTP generated (Demo Mode: Check server logs)" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email OTP" });
    }
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);

    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    otpStore.delete(email);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server is listening on 0.0.0.0:${PORT}`);
    console.log(`>>> NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

console.log(">>> Starting server...");
startServer().catch(err => {
  console.error(">>> FAILED TO START SERVER:", err);
});
