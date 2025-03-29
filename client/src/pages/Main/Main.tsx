import { useState } from "react";
import { Button, Card, Typography, Space, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import "./Main.css";

const { Title, Paragraph, Text } = Typography;

function Main() {
	const [count, setCount] = useState(0);

	return (
		<div className="main-container">
			<Title level={1}>Psycho Analysis</Title>

			<Card className="card">
				<Space
					direction="vertical"
					size="middle"
					style={{ width: "100%" }}
				>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => setCount((count) => count + 1)}
					>
						Счетчик: {count}
					</Button>

					<Paragraph>
						Это пример использования компонентов{" "}
						<Text code>Ant Design</Text> в вашем проекте.
					</Paragraph>
				</Space>
			</Card>

			<Divider />

			<Paragraph className="read-the-docs">
				Проект использует React, TypeScript и Ant Design для создания
				современного пользовательского интерфейса.
			</Paragraph>
		</div>
	);
}

export default Main;
