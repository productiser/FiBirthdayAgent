import { useState, useEffect } from "react";
import Head from "next/head";

export default function AIChatApp() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	// Auth check on load
	useEffect(() => {
		const auth = localStorage.getItem("aichat-auth");
		if (auth === "verified") {
			setIsAuthenticated(true);
		}
		setIsCheckingAuth(false);
	}, []);

	// Initialize AI chat after authentication
	useEffect(() => {
		if (isAuthenticated) {
			// Load external CSS
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = "/styles.css";
			document.head.appendChild(link);

			// Initialize the AI chat app
			setTimeout(() => {
				initializeAIChat();
			}, 100);
		}
	}, [isAuthenticated]);

	const handleSubmit = async () => {
		if (!code.trim()) return;

		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: code.trim() }),
			});

			const result = await response.json();

			if (result.success) {
				localStorage.setItem("aichat-auth", "verified");
				setIsAuthenticated(true);
			} else {
				setError("Invalid access code");
				setCode("");
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			handleSubmit();
		}
	};

	// AI Chat functionality
	const initializeAIChat = () => {
		const chatbotContainer = document.getElementById("chatbot-container");
		const minimizeBtn = document.getElementById("minimize-btn");
		const chatLoading = document.getElementById("chat-loading");
		const chatError = document.getElementById("chat-error");
		const chatFallback = document.getElementById("chat-fallback");
		const chatStatus = document.getElementById("chat-status");

		let chatbotMinimized = false;
		let chatLoaded = false;
		let conversationHistory = [];

		// Configuration
		const CHAT_CONFIG = {
			iframeUrl: "https://n8n.pankstr.com/webhook/fifi-chat",
			fallbackUrl: "https://n8n.pankstr.com/webhook-test/fifi-chat",
			loadTimeout: 10000,
			localTesting: false,
		};

		const DAILY_LIMIT = 50;

		// Utility functions
		function getDailyMessageCount() {
			const today = new Date().toDateString();
			const stored = localStorage.getItem("aichat_messages");
			if (!stored) return { count: 0, date: today };
			const data = JSON.parse(stored);
			if (data.date !== today) return { count: 0, date: today };
			return data;
		}

		function canSendMessage() {
			return getDailyMessageCount().count < DAILY_LIMIT;
		}

		function incrementMessageCount() {
			const today = new Date().toDateString();
			const data = { count: getDailyMessageCount().count + 1, date: today };
			localStorage.setItem("aichat_messages", JSON.stringify(data));
		}

		// Chat functions
		window.toggleChatbot = function () {
			chatbotMinimized = !chatbotMinimized;
			chatbotContainer?.classList.toggle("minimized", chatbotMinimized);
			if (minimizeBtn) minimizeBtn.textContent = chatbotMinimized ? "▲" : "▼";
		};

		function initializeChat() {
			if (chatLoading) chatLoading.style.display = "none";
			const chatInterface = document.getElementById("chat-interface");
			if (chatInterface) chatInterface.style.display = "flex";
			if (chatStatus) chatStatus.textContent = "AI Assistant Online";
			chatLoaded = true;

			const chatInput = document.getElementById("chat-input");
			if (chatInput) {
				chatInput.addEventListener("keypress", function (e) {
					if (e.key === "Enter") {
						sendMessage();
					}
				});
			}

			const remaining = DAILY_LIMIT - getDailyMessageCount().count;
			addChatMessage(
				"🤖 AI Assistant",
				`Welcome! I'm here to help you with any questions. You have ${remaining} messages available today! 🚀`
			);
		}

		function addChatMessage(sender, message) {
			const messagesContainer = document.getElementById("chat-messages");
			if (!messagesContainer) return;

			const messageDiv = document.createElement("div");
			messageDiv.className = "chat-message";
			messageDiv.style.background = sender.includes("🤖")
				? "rgba(255, 105, 180, 0.2)"
				: "rgba(255, 255, 255, 0.1)";
			messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}

		window.sendMessage = async function () {
			const input = document.getElementById("chat-input");
			if (!input) return;

			const message = input.value.trim();
			if (!message) return;

			if (!canSendMessage()) {
				addChatMessage(
					"🤖 AI Assistant",
					`You've reached your daily message limit (${DAILY_LIMIT} messages). Your next consultation resets at midnight! 🌙✨`
				);
				return;
			}

			addChatMessage("You", message);
			input.value = "";

			conversationHistory.push({
				role: "user",
				content: message,
				timestamp: Date.now(),
			});

			if (conversationHistory.length > 10) {
				conversationHistory = conversationHistory.slice(-10);
			}

			addChatMessage("🤖 AI Assistant", "🤔 Thinking...");
			const messagesContainer = document.getElementById("chat-messages");
			const typingMessage = messagesContainer?.lastElementChild;

			try {
				const response = await fetch(CHAT_CONFIG.iframeUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: message,
						conversationHistory: conversationHistory,
						context: {
							messagesLeft: DAILY_LIMIT - getDailyMessageCount().count - 1,
						},
					}),
				});

				if (typingMessage?.parentNode) {
					typingMessage.remove();
				}

				let botResponse;
				if (response.ok) {
					const contentType = response.headers.get("content-type");
					if (contentType?.includes("application/json")) {
						const data = await response.json();
						botResponse =
							data.response ||
							data.message ||
							data.output ||
							data.text ||
							data.result;
					} else {
						botResponse = await response.text();
					}
				} else {
					botResponse = `Error: ${response.status} - ${response.statusText}`;
				}

				addChatMessage("🤖 AI Assistant", botResponse);

				conversationHistory.push({
					role: "assistant",
					content: botResponse,
					timestamp: Date.now(),
				});

				incrementMessageCount();

				const remaining = DAILY_LIMIT - getDailyMessageCount().count;
				if (remaining <= 5 && remaining > 0) {
					addChatMessage(
						"🤖 AI Assistant",
						`🚨 Only ${remaining} messages remaining today!`
					);
				}
			} catch (error) {
				if (typingMessage?.parentNode) {
					typingMessage.remove();
				}
				console.error("Chat error:", error);
				addChatMessage(
					"🤖 AI Assistant",
					"Oops! Something went wrong. Try again in a moment! 🔧"
				);
			}
		};

		window.sendQuickMessage = function (message) {
			const input = document.getElementById("chat-input");
			if (input) {
				input.value = message;
				sendMessage();
			}
		};

		window.reloadChat = function () {
			chatLoaded = false;
			if (chatFallback) chatFallback.style.display = "none";
			initializeChat();
		};

		// Initialize chat
		initializeChat();

		// Set initial chatbot state
		chatbotContainer?.classList.remove("minimized");
		if (minimizeBtn) minimizeBtn.textContent = "▼";
	};

	if (isCheckingAuth) {
		return (
			<>
				<Head>
					<title>AI Chat Assistant</title>
					<link
						rel="icon"
						href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🤖</text></svg>"
					/>
				</Head>
				<div
					style={{
						minHeight: "100vh",
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "white",
					}}
				>
					Loading...
				</div>
			</>
		);
	}

	if (!isAuthenticated) {
		return (
			<>
				<Head>
					<title>AI Chat Assistant</title>
					<link
						rel="icon"
						href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🤖</text></svg>"
					/>
				</Head>
				<style jsx global>{`
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
					body {
						font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
							sans-serif;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						min-height: 100vh;
					}
				`}</style>

				<div
					style={{
						minHeight: "100vh",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "20px",
					}}
				>
					<div
						style={{
							background: "rgba(255, 255, 255, 0.1)",
							backdropFilter: "blur(10px)",
							borderRadius: "20px",
							padding: "40px",
							width: "100%",
							maxWidth: "400px",
							border: "1px solid rgba(255, 255, 255, 0.2)",
							textAlign: "center",
						}}
					>
						<div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
						<h2
							style={{
								color: "white",
								fontSize: "24px",
								fontWeight: "600",
								marginBottom: "8px",
							}}
						>
							AI Chat Assistant
						</h2>
						<p
							style={{
								color: "rgba(255, 255, 255, 0.8)",
								marginBottom: "32px",
							}}
						>
							Enter your access code to start chatting
						</p>

						{error && (
							<div
								style={{
									color: "#ffcccb",
									marginBottom: "16px",
									padding: "12px",
									background: "rgba(255, 0, 0, 0.1)",
									borderRadius: "8px",
									border: "1px solid rgba(255, 0, 0, 0.2)",
								}}
							>
								{error}
							</div>
						)}

						<input
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							onKeyPress={handleKeyPress}
							placeholder="Access Code"
							disabled={isLoading}
							autoFocus
							style={{
								width: "100%",
								padding: "16px",
								borderRadius: "12px",
								border: "1px solid rgba(255, 255, 255, 0.3)",
								background: "rgba(255, 255, 255, 0.2)",
								color: "white",
								fontSize: "16px",
								marginBottom: "16px",
								outline: "none",
							}}
						/>

						<button
							onClick={handleSubmit}
							disabled={isLoading || !code}
							style={{
								width: "100%",
								padding: "16px",
								borderRadius: "12px",
								border: "none",
								background: "rgba(255, 255, 255, 0.2)",
								color: "white",
								fontSize: "16px",
								fontWeight: "600",
								cursor: isLoading || !code ? "not-allowed" : "pointer",
								opacity: isLoading || !code ? 0.5 : 1,
								marginBottom: "16px",
							}}
						>
							{isLoading ? "Verifying..." : "Start Chatting"}
						</button>

						<p
							style={{
								color: "rgba(255, 255, 255, 0.6)",
								fontSize: "14px",
							}}
						>
							Don't have a code? Contact the administrator! 🤖
						</p>
					</div>
				</div>
			</>
		);
	}

	// Main AI chat app
	return (
		<>
			<Head>
				<title>AI Chat Assistant</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0, user-scalable=no"
				/>
				<link
					rel="icon"
					href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🤖</text></svg>"
				/>
			</Head>

			<div className="container">
				<h1 id="main-title">🤖 AI Chat Assistant</h1>
				<p style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: "2rem", textAlign: "center" }}>
					Your intelligent chat companion is ready to help!
				</p>
			</div>

			<div className="chatbot-container" id="chatbot-container">
				<div
					className="chatbot-header"
					onClick={() => window.toggleChatbot?.()}
				>
					<div>
						<div className="chatbot-title">🤖 AI Assistant</div>
						<div className="chatbot-status">
							<span className="status-indicator"></span>
							<span id="chat-status">AI Assistant Online</span>
						</div>
					</div>
					<button className="minimize-btn" id="minimize-btn">
						▼
					</button>
				</div>
				<div className="chat-iframe-container">
					<div className="chat-loading" id="chat-loading">
						<div className="loading-spinner"></div>
						<div>Loading AI Assistant...</div>
					</div>
					<div className="chat-error" id="chat-error">
						<div>❌ Connection Error</div>
						<div>Unable to load AI assistant</div>
					</div>
					<div className="chat-fallback" id="chat-fallback">
						<div>🤖 AI Assistant Unavailable</div>
						<div>Please check your connection</div>
						<button
							className="fallback-button"
							onClick={() => window.reloadChat?.()}
						>
							Retry
						</button>
					</div>

					<div id="chat-interface" style={{ display: "none" }}>
						<div id="chat-messages"></div>
						<div className="chat-quick-tags">
							<button
								className="quick-tag"
								onClick={() =>
									window.sendQuickMessage?.("What can you help me with?")
								}
							>
								🤖 Get Help
							</button>
							<button
								className="quick-tag"
								onClick={() =>
									window.sendQuickMessage?.("Tell me a fun fact!")
								}
							>
								📚 Fun Fact
							</button>
							<button
								className="quick-tag"
								onClick={() =>
									window.sendQuickMessage?.("Tell me a joke!")
								}
							>
								😂 Tell Joke
							</button>
							<button
								className="quick-tag"
								onClick={() => window.sendQuickMessage?.("Give me motivation!")}
							>
								⚡ Motivate Me
							</button>
						</div>
						<div className="chat-input-container">
							<input
								type="text"
								id="chat-input"
								placeholder="Ask me anything..."
							/>
							<button
								className="chat-send-btn"
								onClick={() => window.sendMessage?.()}
							>
								Send
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}