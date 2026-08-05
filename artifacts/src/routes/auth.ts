import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /auth/me
router.get("/auth/me", (req, res) => {
  const session = (req as any).session;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: session.userId,
    username: session.username,
    name: session.name,
    role: session.role,
    email: session.email ?? null,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (!user) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "This account has been deactivated. Contact an administrator." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    // Update lastLogin
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));

    const session = (req as any).session;
    session.userId = user.id;
    session.username = user.username;
    session.name = user.name;
    session.role = user.role;
    session.email = user.email;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error during login");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /auth/users — admin only
router.get("/auth/users", async (req, res) => {
  try {
    const session = (req as any).session;
    if (!session?.userId || session.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      role: usersTable.role,
      email: usersTable.email,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    }).from(usersTable).orderBy(usersTable.id);
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Error listing users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/users — admin only: create a new user
router.post("/auth/users", async (req, res) => {
  try {
    const session = (req as any).session;
    if (!session?.userId || session.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { username, password, name, role, email } = req.body;
    if (!username || !password || !name || !role) {
      res.status(400).json({ error: "username, password, name, and role are required." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      username,
      passwordHash: hash,
      name,
      role: role || "clerk",
      email: email || null,
      isActive: true,
    }).returning({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      role: usersTable.role,
      email: usersTable.email,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    });
    res.status(201).json(user);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Username already exists." });
      return;
    }
    req.log.error({ err }, "Error creating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /auth/users/:id — admin only: update role or active status
router.patch("/auth/users/:id", async (req, res) => {
  try {
    const session = (req as any).session;
    if (!session?.userId || session.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (id === session.userId) {
      res.status(400).json({ error: "You cannot modify your own account here." });
      return;
    }
    const { role, isActive, name, email } = req.body;
    const updates: Record<string, any> = {};
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      role: usersTable.role,
      email: usersTable.email,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      lastLogin: usersTable.lastLogin,
    });
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /auth/users/:id — admin only: permanently delete
router.delete("/auth/users/:id", async (req, res) => {
  try {
    const session = (req as any).session;
    if (!session?.userId || session.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (id === session.userId) {
      res.status(400).json({ error: "You cannot delete your own account." });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
