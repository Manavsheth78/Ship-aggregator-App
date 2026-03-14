import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name required" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, hash, name],
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (e) {
    if (e.code === "23505")
      return res.status(400).json({ error: "Email already registered" });
    res.status(500).json({ error: e.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });
    const result = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email],
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
