import { Express, Request, Response } from "express";
import Message from "../database/models/Message";
import TelegramUser from "../database/models/TelegramUser";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import authRoutes from "./auth";

export function setupApiRoutes(app: Express) {
	app.get("/api/health", (req: Request, res: Response) => {
		res.status(200).json({ status: "ok", message: "API is working" });
	});

	app.use("/api/auth", authRoutes);

	app.get(
		"/api/messages",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const messages = await Message.findAll({
					order: [["createdAt", "DESC"]],
					limit: 100,
				});
				res.status(200).json(messages);
			} catch (error) {
				console.error("Error fetching messages:", error);
				res.status(500).json({ error: "Failed to fetch messages" });
			}
		}
	);

	app.get(
		"/api/telegram-users",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const users = await TelegramUser.findAll({
					order: [["createdAt", "DESC"]],
				});
				res.status(200).json(users);
			} catch (error) {
				console.error("Error fetching telegram users:", error);
				res.status(500).json({
					error: "Failed to fetch telegram users",
				});
			}
		}
	);

	app.delete(
		"/api/telegram-users/:userId/psycho-analysis",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const { userId } = req.params;

				const user = await TelegramUser.findOne({
					where: { userId },
				});

				if (!user) {
					return res
						.status(404)
						.json({ error: "Пользователь не найден" });
				}

				await user.update({
					psychoAnalysis: null,
				});

				res.status(200).json({
					message: "Психоанализ пользователя успешно очищен",
				});
			} catch (error) {
				console.error("Error clearing user psycho analysis:", error);
				res.status(500).json({
					error: "Не удалось очистить психоанализ пользователя",
				});
			}
		}
	);
}
