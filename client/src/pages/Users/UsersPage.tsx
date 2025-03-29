import { useEffect, useState } from "react";
import {
	List,
	Avatar,
	Card,
	Typography,
	Spin,
	Empty,
	Tag,
	Button,
	message,
	Popconfirm,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { telegramUsersApi } from "@/shared/api/api";
import styles from "./UsersPage.module.css";
import { Markdown } from "@/shared/components/Markdown/Markdown";
const { Title, Text, Paragraph } = Typography;

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
	const [users, setUsers] = useState<TelegramUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [clearingAnalysis, setClearingAnalysis] = useState<string | null>(
		null
	);

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

	const handleClearAnalysis = async (userId: string) => {
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
				<Card className={styles.card}>
					<List
						itemLayout="horizontal"
						dataSource={users}
						renderItem={(user) => (
							<List.Item
								key={user.id}
								className={styles.userItem}
								actions={[
									user.psychoAnalysis && (
										<Popconfirm
											title="Очистить психоанализ"
											description="Вы уверены, что хотите очистить психоанализ этого пользователя?"
											onConfirm={() =>
												handleClearAnalysis(user.userId)
											}
											okText="Да"
											cancelText="Нет"
										>

										</Popconfirm>
									),
								].filter(Boolean)}
							>
								<List.Item.Meta
									avatar={
										<Avatar
											src={user.avatarUrl || undefined}
											size="large"
											className={styles.avatar}
										>
											{!user.avatarUrl &&
												(
													user.username ||
													user.firstName
												)
													.charAt(0)
													.toUpperCase()}
										</Avatar>
									}
									title={
										<div className={styles.userHeader}>
											<Text strong>
												{user.firstName}{" "}
												{user.lastName || ""}
											</Text>
											{user.username && (
												<Tag color="blue">
													@{user.username}
												</Tag>
											)}
										</div>
									}
									description={
										<div>
											{user.psychoAnalysis ? (
												<div
													className={
														styles.analysisContainer
													}
												>
													<div
														className={
															styles.analysisHeader
														}
													>
														<Text type="secondary">
															Психоанализ:{" "}
														</Text>
														{user.psychoAnalysis && (
															<Popconfirm
																title="Очистить психоанализ"
																description="Вы уверены, что хотите очистить психоанализ этого пользователя?"
																onConfirm={() =>
																	handleClearAnalysis(
																		user.userId
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
																/>
															</Popconfirm>
														)}
													</div>
													<Paragraph
														className={
															styles.analysisText
														}
													>
														<Markdown text={user.psychoAnalysis} />
													</Paragraph>
												</div>
											) : (
												<Text type="secondary" italic>
													Психоанализ еще не проведен
												</Text>
											)}
										</div>
									}
								/>
							</List.Item>
						)}
					/>
				</Card>
			)}
		</div>
	);
}
