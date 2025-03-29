import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

interface TelegramUserAttributes {
	id?: number;
	userId: string;
	username: string;
	firstName: string;
	lastName?: string | null;
	avatarUrl: string | null;
	psychoAnalysis: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

class TelegramUser
	extends Model<TelegramUserAttributes>
	implements TelegramUserAttributes
{
	public id!: number;
	public userId!: string;
	public username!: string;
	public firstName!: string;
	public lastName!: string | null;
	public avatarUrl!: string | null;
	public psychoAnalysis!: string | null;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

TelegramUser.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		username: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		firstName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		avatarUrl: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		psychoAnalysis: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	},
	{
		sequelize,
		modelName: "TelegramUser",
	}
);

export default TelegramUser;
