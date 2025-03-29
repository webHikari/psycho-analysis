import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const dbUrl =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@db:5432/psycho_analysis";

const sequelize = new Sequelize(dbUrl, {
	dialect: "postgres",
	logging: false,
});

export const connectToDatabase = async () => {
	try {
		await sequelize.authenticate();
		console.log("Database connection has been established successfully.");

		await sequelize.sync();
		console.log("All models were synchronized successfully.");

		await initializeAdmin();
	} catch (error) {
		console.error("Unable to connect to the database:", error);
		throw error;
	}
};

async function initializeAdmin() {
	try {
		const User = (await import("./models/User")).default;

		const adminExists = await User.findOne({
			where: { username: "admin" },
		});

		if (!adminExists) {
			await User.create({
				username: "admin",
				password: "admin",
				role: "admin",
			});
			console.log("Admin user created successfully");
		} else {
			console.log("Admin user already exists");
		}
	} catch (error) {
		console.error("Error initializing admin user:", error);
	}
}

export default sequelize;
