import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Card,
	Typography,
	Avatar,
	Spin,
	Button,
	Tag,
	Popconfirm,
	message,
	Divider,
	Row,
	Col,
	Statistic,
	Empty,
} from "antd";
import {
	ArrowLeftOutlined,
	DeleteOutlined,
	MessageOutlined,
	CalendarOutlined,
} from "@ant-design/icons";
import { telegramUsersApi, messagesApi } from "@/shared/api/api";
import { Markdown } from "@/shared/components/Markdown/Markdown";
import styles from "./OneUserPage.module.css";

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

interface UserMessage {
	id: number;
	messageId: string;
	text: string;
	createdAt: string;
}

export default function OneUserPage() {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const [user, setUser] = useState<TelegramUser | null>(null);
	const [messages, setMessages] = useState<UserMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [messagesLoading, setMessagesLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [clearingAnalysis, setClearingAnalysis] = useState(false);

	useEffect(() => {
		const fetchUser = async () => {
			if (!userId) return;

			try {
				setLoading(true);
				const userData = await telegramUsersApi.getUserById(userId);
				setUser(userData);
				setError(null);
			} catch (err) {
				setError("Не удалось загрузить информацию о пользователе");
				console.error("Error fetching user:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, [userId]);

	useEffect(() => {
		const fetchUserMessages = async () => {
			if (!userId) return;

			try {
				setMessagesLoading(true);
				const messagesData = await messagesApi.getUserMessages(userId);
				setMessages(messagesData);
			} catch (err) {
				console.error("Error fetching user messages:", err);
			} finally {
				setMessagesLoading(false);
			}
		};

		fetchUserMessages();
	}, [userId]);

	const handleClearAnalysis = async () => {
		if (!userId) return;

		try {
			setClearingAnalysis(true);
			await telegramUsersApi.clearUserPsychoAnalysis(userId);
			message.success("Психоанализ пользователя успешно очищен");

			const userData = await telegramUsersApi.getUserById(userId);
			setUser(userData);
		} catch (err) {
			console.error("Error clearing user psycho analysis:", err);
			message.error("Не удалось очистить психоанализ пользователя");
		} finally {
			setClearingAnalysis(false);
		}
	};

	const handleGoBack = () => {
		navigate("/users");
	};

	if (loading) {
		return (
			<div className={styles.loadingContainer}>
				<Spin size="large" />
			</div>
		);
	}

	if (error || !user) {
		return (
			<div className={styles.errorContainer}>
				<Title level={4} type="danger">
					{error || "Пользователь не найден"}
				</Title>
				<Button
					type="primary"
					onClick={handleGoBack}
					icon={<ArrowLeftOutlined />}
				>
					Вернуться к списку пользователей
				</Button>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<Button
				onClick={handleGoBack}
				icon={<ArrowLeftOutlined />}
				className={styles.backButton}
			>
				Вернуться к списку пользователей
			</Button>

			<Card className={styles.userCard}>
				<div className={styles.userHeader}>
					<Avatar
						src={user.avatarUrl || undefined}
						size={80}
						className={styles.avatar}
					>
						{!user.avatarUrl &&
							(user.username || user.firstName)
								.charAt(0)
								.toUpperCase()}
					</Avatar>

					<div className={styles.userInfo}>
						<Title level={3} className={styles.userName}>
							{user.firstName} {user.lastName || ""}
						</Title>

						{user.username && (
							<Tag color="blue" className={styles.usernameTag}>
								@{user.username}
							</Tag>
						)}

						<Text type="secondary" className={styles.userSince}>
							<CalendarOutlined style={{ marginRight: 8 }} />
							Пользователь с{" "}
							{new Date(user.createdAt).toLocaleDateString()}
						</Text>
					</div>
				</div>

				<Divider />

				<Row gutter={[16, 16]}>
					<Col xs={24} md={12}>
						<Statistic
							title="ID пользователя"
							value={user.userId}
							formatter={(value) => value.toString().replace(/,/g, '')}

							className={styles.statistic}
						/>
					</Col>
					<Col xs={24} md={12}>
						<Statistic
							title="Количество сообщений"
							value={messages.length}
							prefix={<MessageOutlined />}
							className={styles.statistic}
						/>
					</Col>
				</Row>

				<Divider />

				<div className={styles.analysisSection}>
					<div className={styles.sectionHeader}>
						<Title level={4}>Психоанализ</Title>

						{user.psychoAnalysis && (
							<Popconfirm
								title="Очистить психоанализ"
								description="Вы уверены, что хотите очистить психоанализ этого пользователя?"
								onConfirm={handleClearAnalysis}
								okText="Да"
								cancelText="Нет"
							>
								<Button
									type="text"
									danger
									icon={<DeleteOutlined />}
									loading={clearingAnalysis}
								>
									Очистить
								</Button>
							</Popconfirm>
						)}
					</div>

					{user.psychoAnalysis ? (
						<Card className={styles.analysisCard}>
							<Markdown text={user.psychoAnalysis} />
						</Card>
					) : (
						<Empty description="Психоанализ еще не проведен" />
					)}
				</div>

				<Divider />

				<div className={styles.messagesSection}>
					<Title level={4}>Последние сообщения</Title>

					{messagesLoading ? (
						<div className={styles.messagesLoading}>
							<Spin />
						</div>
					) : messages.length > 0 ? (
						<div className={styles.messagesList}>
							{messages.slice(0, 10).map((message) => (
								<Card
									key={message.id}
									className={styles.messageCard}
								>
									<div className={styles.messageHeader}>
										<Text type="secondary">
											{new Date(
												message.createdAt
											).toLocaleString()}
										</Text>
									</div>
									<Paragraph className={styles.messageText}>
										{message.text}
									</Paragraph>
								</Card>
							))}

							{messages.length > 10 && (
								<div className={styles.moreMessages}>
									<Text type="secondary">
										И еще {messages.length - 10} сообщений
									</Text>
								</div>
							)}
						</div>
					) : (
						<Empty description="Сообщений пока нет" />
					)}
				</div>
			</Card>
		</div>
	);
}
