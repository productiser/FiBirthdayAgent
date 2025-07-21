export default function handler(req, res) {
	// Only allow POST requests
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { code } = req.body;

	// Get access codes from environment variable - simplified for AI chat app
	const validCodes = process.env.ACCESS_CODES?.split(",") || ["AICHAT2025"];

	// Check if provided code is valid
	if (validCodes.includes(code?.toUpperCase())) {
		return res.json({ success: true });
	}

	// Invalid code
	res.status(401).json({ success: false });
}