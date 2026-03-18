import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);

  const decodedHeader = jwt.decode(token, { complete: true });
  console.log("authMiddleware incoming token header:", decodedHeader?.header);

  if (!decodedHeader?.header?.alg) {
    console.error("Token missing alg");
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    let verified;
    if (decodedHeader.header.alg === "HS256") {
      verified = jwt.verify(token, process.env.JWT_SECRET);
    } else if (decodedHeader.header.alg === "RS256") {
      if (!process.env.JWT_PUBLIC_KEY) {
        console.error("Missing JWT_PUBLIC_KEY for RS256 token");
        return res.status(401).json({ error: "Invalid token" });
      }
      verified = jwt.verify(token, process.env.JWT_PUBLIC_KEY);
    } else {
      console.error("Unsupported token algorithm", decodedHeader.header.alg);
      return res.status(401).json({ error: "Invalid token algorithm" });
    }

    req.userId = verified.userId || verified.id || verified.sub;
    if (!req.userId) {
      console.error("Verified token missing user ID payload", verified);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    console.log(
      "Auth succeeded for userId",
      req.userId,
      "alg",
      decodedHeader.header.alg,
    );
    next();
  } catch (err) {
    console.error("Token verification failed in authMiddleware:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function getUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader?.header?.alg) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    let verified;
    if (decodedHeader.header.alg === "HS256") {
      verified = jwt.verify(token, process.env.JWT_SECRET);
    } else if (decodedHeader.header.alg === "RS256") {
      if (!process.env.JWT_PUBLIC_KEY) {
        return res.status(401).json({ error: "Invalid token" });
      }
      verified = jwt.verify(token, process.env.JWT_PUBLIC_KEY);
    } else {
      return res.status(401).json({ error: "Invalid token algorithm" });
    }

    const userId = verified.userId || verified.id || verified.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const result = await pool.query(
      "SELECT id, email, name FROM users WHERE id = $1",
      [userId],
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: "User not found" });
    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error("Token verification failed in getUser:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
