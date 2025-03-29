import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export const authApi = {
	login: async (username: string, password: string) => {
		const response = await api.post("/auth/login", { username, password });
		return response.data;
	},

	register: async (username: string, password: string) => {
		const response = await api.post("/auth/register", {
			username,
			password,
		});
		return response.data;
	},

	getCurrentUser: async () => {
		const response = await api.get("/auth/me");
		return response.data;
	},
};

export const messagesApi = {
	getMessages: async () => {
		const response = await api.get("/messages");
		return response.data;
	},
};

export const telegramUsersApi = {
	getUsers: async () => {
		const response = await api.get("/telegram-users");
		return response.data;
	},

	clearUserPsychoAnalysis: async (userId: string) => {
		const response = await api.delete(
			`/telegram-users/${userId}/psycho-analysis`
		);
		return response.data;
	},
};

export const analysisApi = {
	getAnalysis: async (params?: { userId?: string; limit?: number }) => {
		const queryParams = new URLSearchParams();
		if (params?.userId) queryParams.append("userId", params.userId);
		if (params?.limit) queryParams.append("limit", params.limit.toString());

		const url = `/analysis${
			queryParams.toString() ? `?${queryParams.toString()}` : ""
		}`;
		const response = await api.get(url);
		return response.data;
	},

	getUserAnalysis: async (userId: string) => {
		const response = await api.get(`/analysis/user/${userId}`);
		return response.data;
	},

	analyzeText: async (text: string) => {
		const response = await api.post("/analyze", { text });
		return response.data;
	},
};
