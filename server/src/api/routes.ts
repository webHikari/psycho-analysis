import { Express, Request, Response } from "express";
import Message from "../database/models/Message";
import TelegramUser from "../database/models/TelegramUser";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import authRoutes from "./auth";
import { Op } from "sequelize";

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

	app.get(
		"/api/stats/users-growth",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const users = await TelegramUser.findAll({
					attributes: [
						[
							app
								.get("sequelize")
								.fn(
									"date_trunc",
									"day",
									app.get("sequelize").col("createdAt")
								),
							"date",
						],
						[app.get("sequelize").fn("count", "*"), "count"],
					],
					where: {
						createdAt: {
							[Op.gte]: thirtyDaysAgo,
						},
					},
					group: ["date"],
					order: [[app.get("sequelize").col("date"), "ASC"]],
					raw: true,
				});

				const result = fillMissingDates(users, 30);

				res.status(200).json(result);
			} catch (error) {
				console.error("Error fetching users growth stats:", error);
				res.status(500).json({
					error: "Failed to fetch users growth stats",
				});
			}
		}
	);

	app.get(
		"/api/stats/messages-per-day",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const messages = await Message.findAll({
					attributes: [
						[
							app
								.get("sequelize")
								.fn(
									"date_trunc",
									"day",
									app.get("sequelize").col("createdAt")
								),
							"date",
						],
						[app.get("sequelize").fn("count", "*"), "count"],
					],
					where: {
						createdAt: {
							[Op.gte]: thirtyDaysAgo,
						},
					},
					group: ["date"],
					order: [[app.get("sequelize").col("date"), "ASC"]],
					raw: true,
				});

				const result = fillMissingDates(messages, 30);

				res.status(200).json(result);
			} catch (error) {
				console.error("Error fetching messages per day stats:", error);
				res.status(500).json({
					error: "Failed to fetch messages per day stats",
				});
			}
		}
	);

	app.get(
		"/api/stats/active-users",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const activeUsers = await Message.findAll({
					attributes: [
						"userId",
						"username",
						"avatarUrl",
						[app.get("sequelize").fn("COUNT", "*"), "messageCount"],
					],
					group: ["userId", "username", "avatarUrl"],
					order: [
						[
							app.get("sequelize").literal('"messageCount"'),
							"DESC",
						],
					],
					limit: 10,
					raw: true,
				});

				const usersWithDetails = await Promise.all(
					activeUsers.map(async (user: any) => {
						const telegramUser = await TelegramUser.findOne({
							where: { userId: user.userId },
							attributes: ["firstName", "lastName"],
							raw: true,
						});

						return {
							userId: user.userId,
							username: user.username,
							firstName: telegramUser?.firstName || "",
							lastName: telegramUser?.lastName || "",
							avatarUrl: user.avatarUrl,
							messageCount: parseInt(user.messageCount),
						};
					})
				);

				res.status(200).json(usersWithDetails);
			} catch (error) {
				console.error("Error fetching active users stats:", error);
				res.status(500).json({
					error: "Failed to fetch active users stats",
				});
			}
		}
	);

	app.get(
		"/api/stats/summary",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const totalUsers = await TelegramUser.count();
				const totalMessages = await Message.count();

				const usersWithAnalysis = await TelegramUser.count({
					where: {
						psychoAnalysis: {
							[Op.not]: null,
						},
					},
				});

				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

				const activeUsers = await Message.findAll({
					attributes: [
						[
							app
								.get("sequelize")
								.fn(
									"DISTINCT",
									app.get("sequelize").col("userId")
								),
							"userId",
						],
					],
					where: {
						createdAt: {
							[Op.gte]: sevenDaysAgo,
						},
					},
					raw: true,
				}).then((results) => results.length);

				res.status(200).json({
					totalUsers,
					totalMessages,
					usersWithAnalysis,
					activeUsers,
					analysisCompletionRate:
						totalUsers > 0
							? (usersWithAnalysis / totalUsers) * 100
							: 0,
				});
			} catch (error) {
				console.error("Error fetching summary stats:", error);
				res.status(500).json({
					error: "Failed to fetch summary stats",
				});
			}
		}
	);

	app.get(
		"/api/telegram-users/:userId",
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

				res.status(200).json(user);
			} catch (error) {
				console.error("Error fetching telegram user:", error);
				res.status(500).json({
					error: "Failed to fetch telegram user",
				});
			}
		}
	);

	app.get(
		"/api/messages/user/:userId",
		authMiddleware,
		async (req: AuthRequest, res: Response) => {
			try {
				const { userId } = req.params;

				const messages = await Message.findAll({
					where: { userId },
					order: [["createdAt", "DESC"]],
					limit: 100,
				});

				res.status(200).json(messages);
			} catch (error) {
				console.error("Error fetching user messages:", error);
				res.status(500).json({
					error: "Failed to fetch user messages",
				});
			}
		}
	);
}

function fillMissingDates(data: any[], days: number) {
	const result = [];
	const now = new Date();

	const dateMap = new Map();
	data.forEach((item) => {
		const date = new Date(item.date).toISOString().split("T")[0];
		dateMap.set(date, parseInt(item.count));
	});

	for (let i = days - 1; i >= 0; i--) {
		const date = new Date();
		date.setDate(now.getDate() - i);
		const dateStr = date.toISOString().split("T")[0];

		result.push({
			date: dateStr,
			count: dateMap.has(dateStr) ? dateMap.get(dateStr) : 0,
		});
	}

	return result;
}
