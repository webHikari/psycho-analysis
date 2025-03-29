import { useEffect, useState } from "react";
import { List, Avatar, Card, Typography, Spin, Empty } from "antd";
import { messagesApi } from "@/shared/api/api";
import styles from "./MessagesPage.module.css";

const { Title, Text, Paragraph } = Typography;

interface Message {
	id: number;
	messageId: string;
	userId: string;
	username: string;
	avatarUrl: string | null;
	text: string;
	createdAt: string;
}

export default function MessagesPage() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchMessages = async () => {
			try {
				setLoading(true);
				const data = await messagesApi.getMessages();
				setMessages(data);
				setError(null);
			} catch (err) {
				setError("Не удалось загрузить сообщения");
				console.error("Error fetching messages:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchMessages();
	}, []);

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
				Сообщения из Telegram
			</Title>

			{messages.length === 0 ? (
				<Empty description="Сообщений пока нет" />
			) : (
				<Card className={styles.card}>
					<List
						itemLayout="horizontal"
						dataSource={messages}
						renderItem={(message) => (
							<List.Item
								key={message.id}
								className={styles.messageItem}
							>
								<List.Item.Meta
									avatar={
										<Avatar
											src={message.avatarUrl || undefined}
											size="large"
											className={styles.avatar}
										>
											{!message.avatarUrl &&
												message.username
													.charAt(0)
													.toUpperCase()}
										</Avatar>
									}
									title={
										<div className={styles.messageHeader}>
											<Text strong>
												{message.username}
											</Text>
											<Text
												type="secondary"
												className={styles.messageDate}
											>
												{new Date(
													message.createdAt
												).toLocaleString()}
											</Text>
										</div>
									}
									description={
										<Paragraph
											className={styles.messageText}
										>
											{message.text}
										</Paragraph>
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
