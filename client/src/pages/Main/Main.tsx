import { useEffect, useState } from "react";
import {
	Card,
	Typography,
	Row,
	Col,
	Statistic,
	Progress,
	Spin,
	Alert,
	List,
	Avatar,
} from "antd";
import {
	UserOutlined,
	MessageOutlined,
	FileTextOutlined,
	TrophyOutlined,
} from "@ant-design/icons";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title as ChartTitle,
	Tooltip as ChartTooltip,
	Legend as ChartLegend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { statsApi } from "@/shared/api/api";
import styles from "./Main.module.css";

// Регистрируем необходимые компоненты Chart.js
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	ChartTitle,
	ChartTooltip,
	ChartLegend
);

const { Title } = Typography;

interface StatsDataPoint {
	date: string;
	count: number;
}

interface SummaryStats {
	totalUsers: number;
	totalMessages: number;
	usersWithAnalysis: number;
	activeUsers: number;
	analysisCompletionRate: number;
}

interface ActiveUser {
	userId: string;
	username: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
	messageCount: number;
}

export default function MainPage() {
	const [usersGrowth, setUsersGrowth] = useState<StatsDataPoint[]>([]);
	const [messagesPerDay, setMessagesPerDay] = useState<StatsDataPoint[]>([]);
	const [summary, setSummary] = useState<SummaryStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
	const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);
	const [activeUsersError, setActiveUsersError] = useState<string | null>(
		null
	);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				// Fetch all stats data in parallel
				const [usersGrowthData, messagesPerDayData, summaryData] =
					await Promise.all([
						statsApi.getUsersGrowth(),
						statsApi.getMessagesPerDay(),
						statsApi.getSummary(),
					]);

				setUsersGrowth(usersGrowthData);
				setMessagesPerDay(messagesPerDayData);
				setSummary(summaryData);
				setError(null);
			} catch (err) {
				console.error("Error fetching dashboard data:", err);
				setError("Не удалось загрузить данные для дашборда");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	useEffect(() => {
		const fetchActiveUsers = async () => {
			try {
				setLoadingActiveUsers(true);
				const data = await statsApi.getActiveUsers();
				setActiveUsers(data);
				setActiveUsersError(null);
			} catch (error) {
				console.error("Error fetching active users:", error);
				setActiveUsersError(
					"Не удалось загрузить активных пользователей"
				);
			} finally {
				setLoadingActiveUsers(false);
			}
		};

		fetchActiveUsers();
	}, []);

	// Функция для форматирования даты
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return `${date.getDate()}.${date.getMonth() + 1}`;
	};

	// Подготовка данных для графиков
	const prepareChartData = (
		data: StatsDataPoint[],
		label: string,
		color: string
	) => {
		return {
			labels: data.map((item) => formatDate(item.date)),
			datasets: [
				{
					label,
					data: data.map((item) => item.count),
					borderColor: color,
					backgroundColor: color + "33", // добавляем прозрачность
					tension: 0.1,
					fill: true,
				},
			],
		};
	};

	// Общие опции для графиков
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "top" as const,
			},
			tooltip: {
				callbacks: {
					label: function (context: any) {
						let label = context.dataset.label || "";
						if (label) {
							label += ": ";
						}
						if (context.parsed.y !== null) {
							label += context.parsed.y;
						}
						return label;
					},
				},
			},
		},
		scales: {
			y: {
				beginAtZero: true,
			},
		},
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
				<Alert
					message="Ошибка"
					description={error}
					type="error"
					showIcon
				/>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<Title level={2} className={styles.pageTitle}>
				Дашборд
			</Title>

			{/* Summary Statistics Cards */}
			<Row gutter={[16, 16]} className={styles.statsRow}>
				<Col xs={24} sm={12} md={8}>
					<Card className={styles.statCard}>
						<Statistic
							title="Всего пользователей"
							value={summary?.totalUsers || 0}
							prefix={<UserOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} md={8}>
					<Card className={styles.statCard}>
						<Statistic
							title="Всего сообщений"
							value={summary?.totalMessages || 0}
							prefix={<MessageOutlined />}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} md={8}>
					<Card className={styles.statCard}>
						<Statistic
							title="Пользователей с анализом"
							value={summary?.usersWithAnalysis || 0}
							prefix={<FileTextOutlined />}
						/>
						<Progress
							percent={Math.round(
								summary?.analysisCompletionRate || 0
							)}
							status="active"
							className={styles.progressBar}
						/>
					</Card>
				</Col>
			</Row>

			{/* Charts */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<Card
						title="Рост пользователей"
						className={styles.chartCard}
					>
						<div style={{ height: 300 }}>
							<Line
								data={prepareChartData(
									usersGrowth,
									"Новые пользователи",
									"#8884d8"
								)}
								options={chartOptions}
							/>
						</div>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title="Сообщения в день" className={styles.chartCard}>
						<div style={{ height: 300 }}>
							<Line
								data={prepareChartData(
									messagesPerDay,
									"Сообщения",
									"#82ca9d"
								)}
								options={chartOptions}
							/>
						</div>
					</Card>
				</Col>
			</Row>

			{/* Активные пользователи */}
			<Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
				<Col xs={24}>
					<Card
						title={
							<div className={styles.cardTitleContainer}>
								<TrophyOutlined
									className={styles.cardTitleIcon}
								/>
								<span>Топ-10 активных пользователей</span>
							</div>
						}
						className={styles.chartCard}
					>
						{loadingActiveUsers ? (
							<div className={styles.loadingContainer}>
								<Spin />
							</div>
						) : activeUsersError ? (
							<Alert type="error" message={activeUsersError} />
						) : (
							<List
								dataSource={activeUsers}
								className={styles.activeUsersList}
								renderItem={(user, index) => (
									<List.Item
										className={styles.activeUserItem}
									>
										<List.Item.Meta
											avatar={
												<div
													className={
														styles.userRankContainer
													}
												>
													<div
														className={`${
															styles.userRank
														} ${
															index < 3
																? styles.topRank
																: ""
														}`}
													>
														{index + 1}
													</div>
													<Avatar
														src={user.avatarUrl}
														size="large"
														className={
															index < 3
																? styles.topUserAvatar
																: styles.userAvatar
														}
													>
														{!user.avatarUrl &&
															(user.firstName.charAt(
																0
															) ||
																user.username.charAt(
																	0
																))}
													</Avatar>
												</div>
											}
											title={
												<div
													className={
														styles.userTitleContainer
													}
												>
													<span
														className={
															styles.userName
														}
													>
														{user.firstName}{" "}
														{user.lastName}
													</span>
													{user.username && (
														<span
															className={
																styles.userHandle
															}
														>
															@{user.username}
														</span>
													)}
												</div>
											}
											description={
												<div
													className={
														styles.userDescription
													}
												>
													<span>
														{user.messageCount}{" "}
														сообщений
													</span>
													<Progress
														percent={Math.round(
															(user.messageCount /
																(activeUsers[0]
																	?.messageCount ||
																	1)) *
																100
														)}
														size="small"
														showInfo={false}
														strokeColor={
															index < 3
																? "#f5a623"
																: "#1890ff"
														}
														className={
															styles.userProgress
														}
													/>
												</div>
											}
										/>
									</List.Item>
								)}
							/>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	);
}
