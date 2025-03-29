import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/Auth.provider";
import styles from "./LoginPage.module.css";

const { Title } = Typography;

interface LocationState {
	from?: {
		pathname: string;
	};
}

export default function LoginPage() {
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const locationState = location.state as LocationState;
	const from = locationState?.from?.pathname || "/";

	const onFinish = async (values: { username: string; password: string }) => {
		try {
			setLoading(true);
			await login(values.username, values.password);
			message.success("Вход выполнен успешно!");
			navigate(from, { replace: true });
		} catch (error) {
			console.error("Login error:", error);
			message.error("Ошибка входа. Проверьте имя пользователя и пароль.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			<Card className={styles.card}>
				<Title level={2} className={styles.title}>
					Вход в систему
				</Title>
				<Form
					name="login"
					initialValues={{ remember: true }}
					onFinish={onFinish}
					layout="vertical"
				>
					<Form.Item
						name="username"
						rules={[
							{
								required: true,
								message:
									"Пожалуйста, введите имя пользователя!",
							},
						]}
					>
						<Input
							prefix={<UserOutlined />}
							placeholder="Имя пользователя"
							size="large"
						/>
					</Form.Item>
					<Form.Item
						name="password"
						rules={[
							{
								required: true,
								message: "Пожалуйста, введите пароль!",
							},
						]}
					>
						<Input.Password
							prefix={<LockOutlined />}
							placeholder="Пароль"
							size="large"
						/>
					</Form.Item>

					<Form.Item>
						<Button
							type="primary"
							htmlType="submit"
							size="large"
							block
							loading={loading}
						>
							Войти
						</Button>
					</Form.Item>
				</Form>
				<div className={styles.footer}>
					Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
				</div>
			</Card>
		</div>
	);
}
