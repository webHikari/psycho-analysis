import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;

const ChatWithLLM = async (message: string) => {
	try {
		const response = await fetch(
			"https://api.mistral.ai/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: "mistral-large-latest",
					max_tokens: 1000,
					temperature: 0.8,
					messages: [{ role: "user", content: message }],
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				`API error: ${response.status} - ${JSON.stringify(errorData)}`
			);
		}

		const data = await response.json();

		console.log(data);
		if (!data?.choices?.length) {
			throw new Error("No response from LLM");
		}

		return data.choices[0].message.content;
	} catch (error) {
		console.error("Error calling Mistral API:", error);
		throw error;
	}
};

export default ChatWithLLM;
