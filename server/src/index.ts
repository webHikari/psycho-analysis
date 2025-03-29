import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { startBot } from "./bot/bot";
import { setupApiRoutes } from "./api/routes";
import { connectToDatabase } from "./database/db";
import "./database/models/Message";
import "./database/models/User";
import "./database/models/TelegramUser";
import sequelize from "./database/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

setupApiRoutes(app);

app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error(err.stack);
		res.status(500).json({ error: "Internal server error" });
	}
);

const startServer = async () => {
	try {
		await connectToDatabase();

		app.set("sequelize", sequelize);

		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});

		await startBot();
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
