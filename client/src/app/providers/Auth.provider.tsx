import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { authApi } from "@/shared/api/api";

interface User {
	id: number;
	username: string;
	role: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (username: string, password: string) => Promise<void>;
	register: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}

		setIsLoading(false);

		if (storedToken) {
			authApi
				.getCurrentUser()
				.catch(() => {
					localStorage.removeItem("token");
					localStorage.removeItem("user");
					setToken(null);
					setUser(null);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, []);

	const login = async (username: string, password: string) => {
		setIsLoading(true);
		try {
			const data = await authApi.login(username, password);
			setToken(data.token);
			setUser(data.user);

			localStorage.setItem("token", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));
		} finally {
			setIsLoading(false);
		}
	};

	const register = async (username: string, password: string) => {
		setIsLoading(true);
		try {
			const data = await authApi.register(username, password);
			setToken(data.token);
			setUser(data.user);

			localStorage.setItem("token", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isAuthenticated: !!token,
				isLoading,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
