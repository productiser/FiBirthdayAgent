# AI Chat Assistant - Minified Version

A clean, minimal AI chat application extracted from the original fibirthday app. This version contains only the AI chat functionality with a streamlined interface.

## Features

- **AI Chat Interface**: Interactive chat with an AI assistant
- **Authentication**: Simple code-based access control
- **Responsive Design**: Works on desktop and mobile
- **Daily Limits**: Configurable message limits per day
- **Clean UI**: Minimalist design focused on chat functionality

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
```bash
# Create .env.local file
ACCESS_CODES=AICHAT2025,MYCUSTOMCODE
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Access Code
The default access code is `AICHAT2025` (case insensitive).

## Configuration

### Environment Variables
- `ACCESS_CODES`: Comma-separated list of valid access codes (default: "AICHAT2025")

### Chat Configuration
The AI chat is configured to connect to:
- Primary endpoint: `https://n8n.pankstr.com/webhook/fifi-chat`
- Fallback endpoint: `https://n8n.pankstr.com/webhook-test/fifi-chat`

### Features Removed
This minified version removes the following from the original app:
- Birthday countdown functionality
- Mission system and game mechanics
- Birthday vault and letters system
- Test mode toggles
- Floating animations and birthday-themed elements
- Complex state management for missions

### What's Included
- Core AI chat functionality
- Authentication system
- Responsive chat interface
- Quick message tags
- Message history (last 10 messages)
- Daily message limits (50 messages/day)
- Loading states and error handling

## Deployment

### Build for production:
```bash
npm run build
npm start
```

### Deploy to Vercel:
This is a Next.js app and can be easily deployed to Vercel, Netlify, or any platform that supports Node.js.

## File Structure

```
minified/
├── pages/
│   ├── api/
│   │   └── auth.js          # Authentication endpoint
│   └── index.js             # Main chat app component
├── public/
│   └── styles.css           # Minified chat-focused styles
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Customization

### Changing the AI Endpoint
Edit the `CHAT_CONFIG` object in `pages/index.js`:
```javascript
const CHAT_CONFIG = {
    iframeUrl: "your-ai-endpoint-here",
    fallbackUrl: "your-fallback-endpoint-here",
    loadTimeout: 10000,
};
```

### Modifying Daily Limits
Change the `DAILY_LIMIT` constant in `pages/index.js`:
```javascript
const DAILY_LIMIT = 50; // Change to your desired limit
```

### Styling
The styles are contained in `public/styles.css` and focus only on the chat interface components.

## Original Source
This minified version was extracted from the fibirthday app, keeping only the AI chat functionality.