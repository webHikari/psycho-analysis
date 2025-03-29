import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

interface MessageAttributes {
	id?: number;
	messageId: string;
	userId: string;
	username: string;
	avatarUrl: string | null;
	text: string;
	createdAt?: Date;
	updatedAt?: Date;
}

class Message extends Model<MessageAttributes> implements MessageAttributes {
	public id!: number;
	public messageId!: string;
	public userId!: string;
	public username!: string;
	public avatarUrl!: string | null;
	public text!: string;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

Message.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		messageId: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		userId: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		avatarUrl: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: "Message",
	}
);

export default Message;
