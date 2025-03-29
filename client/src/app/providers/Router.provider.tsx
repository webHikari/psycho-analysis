import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { RootLayout } from "@/shared/layouts/RootLayout/RootLayout";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute/ProtectedRoute";
import { AuthProvider } from "./Auth.provider";

const Main = lazy(() => import("@/pages/Main/Main"));
const NotFound = lazy(() => import("@/pages/NotFound/NotFound"));
const LoginPage = lazy(() => import("@/pages/Login/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/Register/RegisterPage"));
const MessagesPage = lazy(() => import("@/pages/Messages/MessagesPage"));
const UsersPage = lazy(() => import("@/pages/Users/UsersPage"));
const OneUserPage = lazy(() => import("@/pages/Users/OneUserPage"));

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{
				index: true,
				element: <Main />,
			},
			{
				path: "messages",
				element: (
					<ProtectedRoute>
						<MessagesPage />
					</ProtectedRoute>
				),
			},
			{
				path: "users",
				element: (
					<ProtectedRoute>
						<UsersPage />
					</ProtectedRoute>
				),
			},
			{
				path: "users/:userId",
				element: (
					<ProtectedRoute>
						<OneUserPage />
					</ProtectedRoute>
				),
			},
			{
				path: "login",
				element: <LoginPage />,
			},
			{
				path: "register",
				element: <RegisterPage />,
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
]);

export const Router = () => {
	return (
		<AuthProvider>
			<RouterProvider router={router} />
		</AuthProvider>
	);
};

export default Router;
