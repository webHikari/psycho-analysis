import { Outlet, Link, useNavigate } from "react-router-dom";
import { Suspense, useState, useEffect } from "react";
import { Layout, Menu, Typography, Spin, theme, Button } from "antd";
import {
	HomeOutlined,
	MessageOutlined,
	LoginOutlined,
	LogoutOutlined,
	UserAddOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/app/providers/Auth.provider";
import styles from "./RootLayout.module.css";
import { ItemType, MenuItemType } from "antd/es/menu/interface";

const { Content, Footer, Sider } = Layout;
const { Title } = Typography;

export const RootLayout = () => {
	const { token } = theme.useToken();
	const { isAuthenticated, logout } = useAuth();
	const navigate = useNavigate();
	const [collapsed, setCollapsed] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkIfMobile();
		window.addEventListener("resize", checkIfMobile);

		return () => {
			window.removeEventListener("resize", checkIfMobile);
		};
	}, []);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<Layout className={styles.layout}>
			<Sider
				collapsible
				collapsed={collapsed}
				onCollapse={(value) => setCollapsed(value)}
				className={styles.sider}
				theme="light"
				style={{ background: token.colorBgContainer }}
				width={200}
				collapsedWidth={80}
			>
				<div className={styles.logoContainer}>
					<Title
						level={collapsed ? 5 : 4}
						style={{ margin: "16px 0", textAlign: "center" }}
					>
						{collapsed ? "PA" : "Psycho Analysis"}
					</Title>
				</div>
				<Menu
					mode="inline"
					className={styles.sideMenu}
					selectedKeys={[
						window.location.pathname === "/"
							? "home"
							: window.location.pathname.slice(1),
					]}
					items={
						[
							{
								key: "home",
								icon: <HomeOutlined />,
								label: <Link to="/">Home</Link>,
							},
							isAuthenticated && {
								key: "messages",
								icon: <MessageOutlined />,
								label: <Link to="/messages">Сообщения</Link>,
							},
							isAuthenticated && {
								key: "users",
								icon: <UserOutlined />,
								label: <Link to="/users">Юзеры</Link>,
							},
							isAuthenticated && {
								key: "logout",
								icon: <LogoutOutlined />,
								label: "Выйти",
								onClick: handleLogout,
							},
						].filter(Boolean) as ItemType<MenuItemType>[]
					}
				/>
				{!isAuthenticated && (
					<div className={styles.sidebarFooter}>
						<div className={styles.authButtons}>
							<Button
								icon={<LoginOutlined />}
								onClick={() => navigate("/login")}
								type="text"
								block
								className={styles.textAlignLeft}
							>
								Войти
							</Button>
							<Button
								icon={<UserAddOutlined />}
								onClick={() => navigate("/register")}
								type="text"
								block
								className={styles.textAlignLeft}
							>
								Регистрация
							</Button>
						</div>
					</div>
				)}
			</Sider>
			<Layout
				className={styles.mainContent}
				style={{
					marginLeft: isMobile ? 0 : collapsed ? "80px" : "200px",
					transition: "margin-left 0.3s",
				}}
			>
				<Content className={styles.content}>
					<Suspense
						fallback={
							<div className={styles.loadingContainer}>
								<Spin size="large" />
							</div>
						}
					>
						<Outlet />
					</Suspense>
				</Content>
				<Footer className={styles.footer}>
					Psycho Analysis ©{new Date().getFullYear()}
				</Footer>
			</Layout>
		</Layout>
	);
};
