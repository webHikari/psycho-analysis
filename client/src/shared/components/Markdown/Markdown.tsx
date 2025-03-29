import ReactMarkdown from "react-markdown";
import styles from "./Markdown.module.css";

export const Markdown = ({ text }: { text: string }) => {
	return (
		<div className={styles.markdownContent}>
			<ReactMarkdown>{text}</ReactMarkdown>
		</div>
	);
};
