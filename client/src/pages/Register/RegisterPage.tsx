import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/Auth.provider";
import styles from "./RegisterPage.module.css";

const { Title } = Typography;

export default function RegisterPage() {
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const onFinish = async (values: {
		username: string;
		password: string;
		confirm: string;
	}) => {
		if (values.password !== values.confirm) {
			message.error("Пароли не совпадают!");
			return;
		}

		try {
			setLoading(true);
			await register(values.username, values.password);
			message.success("Регистрация выполнена успешно!");
			navigate("/");
		} catch (error) {
			console.error("Ошибка регистрации:", error);
			message.error(
				"Ошибка регистрации. Возможно, имя пользователя уже занято."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			<Card className={styles.card}>
				<Title level={2} className={styles.title}>
					Регистрация
				</Title>
				<Form
					name="register"
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
							{
								min: 3,
								message:
									"Имя пользователя должно содержать минимум 3 символа!",
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
							{
								min: 5,
								message:
									"Пароль должен содержать минимум 5 символов!",
							},
						]}
					>
						<Input.Password
							prefix={<LockOutlined />}
							placeholder="Пароль"
							size="large"
						/>
					</Form.Item>
					<Form.Item
						name="confirm"
						dependencies={["password"]}
						rules={[
							{
								required: true,
								message: "Пожалуйста, подтвердите пароль!",
							},
							({ getFieldValue }) => ({
								validator(_, value) {
									if (
										!value ||
										getFieldValue("password") === value
									) {
										return Promise.resolve();
									}
									return Promise.reject(
										new Error("Пароли не совпадают!")
									);
								},
							}),
						]}
					>
						<Input.Password
							prefix={<LockOutlined />}
							placeholder="Подтвердите пароль"
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
							Зарегистрироваться
						</Button>
					</Form.Item>
				</Form>
				<div className={styles.footer}>
					Уже есть аккаунт? <Link to="/login">Войти</Link>
				</div>
			</Card>
		</div>
	);
}
