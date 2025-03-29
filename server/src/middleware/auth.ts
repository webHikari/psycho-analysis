import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends Request {
	user?: {
		id: number;
		username: string;
		role: string;
	};
}

export const authMiddleware = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");

		if (!token) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const decoded = jwt.verify(token, JWT_SECRET) as {
			id: number;
			username: string;
			role: string;
		};

		req.user = decoded;
		next();
	} catch (error) {
		console.error("Auth error:", error);
		res.status(401).json({ error: "Invalid token" });
	}
};

export const adminMiddleware = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	if (!req.user) {
		return res.status(401).json({ error: "Authentication required" });
	}

	if (req.user.role !== "admin") {
		return res.status(403).json({ error: "Admin access required" });
	}

	next();
};
