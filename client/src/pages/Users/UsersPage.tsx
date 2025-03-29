import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Avatar,
	Card,
	Typography,
	Spin,
	Empty,
	Tag,
	Button,
	message,
	Popconfirm,
	Row,
	Col,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { telegramUsersApi } from "@/shared/api/api";
import styles from "./UsersPage.module.css";
const { Title, Text } = Typography;

interface TelegramUser {
	id: number;
	userId: string;
	username: string | null;
	firstName: string;
	lastName: string | null;
	avatarUrl: string | null;
	psychoAnalysis: string | null;
	createdAt: string;
}

export default function UsersPage() {
	const navigate = useNavigate();
	const [users, setUsers] = useState<TelegramUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [clearingAnalysis, setClearingAnalysis] = useState<string | null>(
		null
	);

	// Создаем карту цветов для каждого пользователя
	const fetchUsers = async () => {
		try {
			setLoading(true);
			const data = await telegramUsersApi.getUsers();
			setUsers(data);

			setError(null);
		} catch (err) {
			setError("Не удалось загрузить пользователей");
			console.error("Error fetching users:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleClearAnalysis = async (userId: string, e: React.MouseEvent) => {
		e.stopPropagation(); // Предотвращаем переход на страницу пользователя
		try {
			setClearingAnalysis(userId);
			await telegramUsersApi.clearUserPsychoAnalysis(userId);
			message.success("Психоанализ пользователя успешно очищен");

			fetchUsers();
		} catch (err) {
			console.error("Error clearing user psycho analysis:", err);
			message.error("Не удалось очистить психоанализ пользователя");
		} finally {
			setClearingAnalysis(null);
		}
	};

	const handleUserClick = (userId: string) => {
		navigate(`/users/${userId}`);
	};

	if (loading) {
		return (
			<div className={styles.loadingContainer}>
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.errorContainer}>
				<Title level={4} type="danger">
					{error}
				</Title>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<Title level={2} className={styles.pageTitle}>
				Пользователи Telegram
			</Title>

			{users.length === 0 ? (
				<Empty description="Пользователей пока нет" />
			) : (
				<Row gutter={[16, 16]} className={styles.usersGrid}>
					{users.map((user) => (
						<Col xs={24} sm={12} md={8} lg={6} key={user.id}>
							<Card
								className={styles.userCard}
								hoverable
								
								onClick={() => handleUserClick(user.userId)}
							>
								<div className={styles.userCardContent}>
									<Avatar
										src={user.avatarUrl || undefined}
										size="large"
										className={styles.avatar}
									>
										{!user.avatarUrl &&
											(user.username || user.firstName)
												.charAt(0)
												.toUpperCase()}
									</Avatar>

									<div className={styles.userInfo}>
										<Text
											strong
											className={styles.userName}
										>
											{user.firstName}{" "}
											{user.lastName || ""}
										</Text>

										{user.username && (
											<Tag
												color="blue"
												className={styles.usernameTag}
											>
												@{user.username}
											</Tag>
										)}
									</div>

									<div className={styles.userStatus}>
										{user.psychoAnalysis ? (
											<div
												className={
													styles.statusWithAction
												}
											>
												<Tag color="green">
													Анализ проведен
												</Tag>
												<Popconfirm
													title="Очистить психоанализ"
													description="Вы уверены, что хотите очистить психоанализ этого пользователя?"
													onConfirm={(e) =>
														handleClearAnalysis(
															user.userId,
															e as React.MouseEvent
														)
													}
													okText="Да"
													cancelText="Нет"
												>
													<Button
														type="text"
														danger
														size="small"
														icon={
															<DeleteOutlined />
														}
														loading={
															clearingAnalysis ===
															user.userId
														}
														onClick={(e) =>
															e.stopPropagation()
														}
														className={
															styles.clearButton
														}
													/>
												</Popconfirm>
											</div>
										) : (
											<Tag color="orange">
												Анализ не проведен
											</Tag>
										)}
									</div>
								</div>
							</Card>
						</Col>
					))}
				</Row>
			)}
		</div>
	);
}
