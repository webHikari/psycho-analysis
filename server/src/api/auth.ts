import { Router, Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import User from "../database/models/User";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "sometihng";

// Register a new user
router.post("/register", async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ error: "Username and password are required" });
		}

		// Check if user already exists
		const existingUser = await User.findOne({ where: { username } });
		if (existingUser) {
			return res.status(400).json({ error: "Username already exists" });
		}

		// Create new user
		const user = await User.create({
			username,
			password, // Password will be hashed by the model hook
			role: "user",
		});

		// Generate JWT token
		const token = jwt.sign(
			{ id: user.id, username: user.username, role: user.role },
			JWT_SECRET,
		);

		res.status(201).json({
			token,
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({ error: "Failed to register user" });
	}
});

// Login user
router.post("/login", async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ error: "Username and password are required" });
		}

		// Find user
		const user = await User.findOne({ where: { username } });
		if (!user) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Verify password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Generate JWT token
		const token = jwt.sign(
			{ id: user.id, username: user.username, role: user.role },
			JWT_SECRET as Secret,
		);

		res.status(200).json({
			token,
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Failed to login" });
	}
});

// Get current user
router.get("/me", authMiddleware, (req: AuthRequest, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		res.status(200).json({
			user: {
				id: req.user.id,
				username: req.user.username,
				role: req.user.role,
			},
		});
	} catch (error) {
		console.error("Get current user error:", error);
		res.status(500).json({ error: "Failed to get user information" });
	}
});

export default router;
