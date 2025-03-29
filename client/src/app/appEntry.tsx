import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import "./styles/global.css";
import { Router } from "./providers/Router.provider";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: "#646cff",
				},
			}}
		>
			<Router />
		</ConfigProvider>
	</StrictMode>
);
