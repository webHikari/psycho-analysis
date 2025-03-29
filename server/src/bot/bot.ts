import { Bot, Context } from "grammy";
import dotenv from "dotenv";
import Message from "../database/models/Message";
import TelegramUser from "../database/models/TelegramUser";
import ChatWithLLM from "./mistral/ChatWithLLM";

dotenv.config();

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
	throw new Error("BOT_TOKEN is not defined in the environment variables");
}
const bot = new Bot<Context>(botToken);

bot.on("message:text", async (ctx) => {
	try {
		const message = ctx.message;
		const user = message.from;

		const userId = user.id.toString();
		const username = user.username || null;
		const firstName = user.first_name;
		const lastName = user.last_name || null;

		let avatarUrl = null;
		try {
			const userProfile = await bot.api.getUserProfilePhotos(user.id, {
				limit: 1,
			});
			if (userProfile.total_count > 0) {
				const fileId = userProfile.photos[0][0].file_id;
				const file = await bot.api.getFile(fileId);
				avatarUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
			}
		} catch (error) {
			console.error("Error getting user avatar:", error);
		}

		const [telegramUser, created] = await TelegramUser.findOrCreate({
			where: { userId },
			defaults: {
				userId,
				username: username || "",
				firstName,
				lastName: lastName || "",
				avatarUrl,
				psychoAnalysis: null,
			},
		});

		if (!created) {
			await telegramUser.update({
				username: username || "",
				firstName,
				lastName: lastName || "",
				avatarUrl,
			});
		}

		await Message.create({
			messageId: message.message_id.toString(),
			userId: userId,
			username: username || `${firstName} ${lastName || ""}`.trim(),
			avatarUrl: avatarUrl,
			text: message.text,
		});

		console.log(`Message from ${username || firstName} saved to database`);

		const recentMessages = await Message.findAll({
			order: [["createdAt", "DESC"]],
			limit: 50,
		});

		const conversationContext = recentMessages
			.reverse()
			.map((msg) => {
				return `${msg.username}: ${msg.text}`;
			})
			.join("\n");

		const userPsychoAnalysis = telegramUser.psychoAnalysis;

		const prompt1 = `
# Behavioral Data Extractor for User Profiling

## ROLE
You are an assistant specializing in extracting *observable behavioral indicators* and illustrative examples from user messages for psychological profiling. Your output serves as raw data for a subsequent synthesis step.

## OBJECTIVE
Analyze the provided messages to identify and list key patterns in communication, emotion, interaction, and interests. Focus on concrete examples and observable actions, avoiding deep interpretation.

## EXTRACTION TASKS
1.  **Identify Communication Style:** Focus on *how* the user communicates (e.g., Direct, informal, uses slang, short sentences, sarcastic tone, emojis). *Provide a brief example/quote if illustrative.*
2.  **Pinpoint Emotional Expressions:** Note *observable displays* of emotion (e.g., Expresses frustration: 'this bug again!', shows enthusiasm: 'awesome update!'). *Stick to visible cues.*
3.  **Describe Social Interaction Patterns:** Detail *how* the user interacts (e.g., Initiates topics, answers directly, shares info proactively: 'try this link'). *Focus on dynamics.*
4.  **List Observable Interests:** Identify topics the user *explicitly discusses* (e.g., Technology updates, specific platforms, gaming).
5.  **Note Overall Impression (Optional):** If a consistent 'vibe' emerges, note it briefly (e.g., 'Appears energetic', 'Seems stressed', 'Comes across as helpful').

## CORE PRINCIPLES & CONSTRAINTS
- **BEHAVIOR-FOCUSED:** Extract *what* the user does/says, not *why*.
- **OBJECTIVE & DESCRIPTIVE:** Stick strictly to patterns in messages. **NO** deep psychological analysis or assumptions.
- **CONCISE:** Keep points brief. Use simple, clear language.
- **EXAMPLE-DRIVEN:** Include short, illustrative examples/quotes where helpful.
- **NO JARGON:** Avoid technical psychological terms.
- **ENGLISH OUTPUT:** Format *strictly* as a bulleted list in English.
- **RAW DATA:** You are providing factual points for the *next* step.

---
### **Recent Messages (timestamped):**
${conversationContext}

---
Extract key behavioral points (with examples where possible) in English as a bulleted list for the user (${
			username || firstName
		}), following all principles:
`;

		try {
			const analysisResult = await ChatWithLLM(prompt1);

			const prompt2 = `
			You are a psychological profiling assistant. Your task is to synthesize a brief but insightful psychological portrait of a user based on extracted behavioral traits.
			
			### **Guidelines:**
			1. **Synthesize & Summarize:**  
			   - Integrate the \`Extracted Key Points\` into a cohesive and structured user profile.  
			   - If the new points don't significantly alter the profile, note that it remains consistent.  
			
			2. **Maintain Observational Objectivity:**  
			   - Describe communication style, emotional patterns, and interests.  
			   - Avoid assumptions and speculative psychological conclusions.  
			
			3. **STRICT Format:**  
			   - **Language:** **Russian (по-русски).**  
			   - **Max Length:** **120 words.**  
			   - **Output must follow this structure:**  
			
			---
			\`\`\`
			🧠 Психоанализ:
			Пользователь ${username || firstName} демонстрирует ${analysisResult}.
			
			🔹 Основные черты:
			
			[Черта 1] – краткое описание, подтвержденное примерами.  
			[Черта 2] – краткое описание, подтвержденное примерами.  
			[Черта 3] – краткое описание, подтвержденное примерами.  
			
			⚖ Вероятный психотип:
			
			[Уровень экстраверсии] – описание.  
			[Уровень нейротизма] – описание.  
			[Уровень уступчивости] – описание.  
			
			📌 Вывод:
			Краткое резюме личности пользователя в одном-двух предложениях.
			\`\`\`
			
			---
			### **Current Profile:**  
			${userPsychoAnalysis || "Профиль пока не составлен."}
			
			### **Extracted Key Points:**  
			${analysisResult}
			
			Update and synthesize the user (${
				username || firstName
			}) profile following the strict format in Russian:
			`;
			const updatedPsychoAnalysis = await ChatWithLLM(prompt2);

			await telegramUser.update({
				psychoAnalysis: updatedPsychoAnalysis,
			});

			console.log(
				`Psycho analysis updated for user ${username || firstName}`
			);
		} catch (error) {
			console.error("Error creating psycho analysis:", error);
		}
	} catch (error) {
		console.error("Error processing message:", error);
	}
});

export async function startBot() {
	try {
		await bot.start();
		console.log("Telegram bot started successfully");
	} catch (error) {
		console.error("Error starting the bot:", error);
	}
}
