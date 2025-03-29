import { DataTypes, Model } from "sequelize";
import sequelize from "../db";
import bcrypt from "bcryptjs";

interface UserAttributes {
	id?: number;
	username: string;
	password: string;
	role: string;
	createdAt?: Date;
	updatedAt?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
	public id!: number;
	public username!: string;
	public password!: string;
	public role!: string;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;

	public async comparePassword(candidatePassword: string): Promise<boolean> {
		return bcrypt.compare(candidatePassword, this.password);
	}
}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		role: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "user",
		},
	},
	{
		sequelize,
		modelName: "User",
		hooks: {
			beforeCreate: async (user: User) => {
				const salt = await bcrypt.genSalt(10);
				user.password = await bcrypt.hash(user.password, salt);
			},
			beforeUpdate: async (user: User) => {
				if (user.changed("password")) {
					const salt = await bcrypt.genSalt(10);
					user.password = await bcrypt.hash(user.password, salt);
				}
			},
		},
	}
);

export default User;
