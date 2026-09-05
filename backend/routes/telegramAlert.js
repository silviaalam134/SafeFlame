const express = require('express');

const router = express.Router();
const TELEGRAM_MESSAGE = '🔥 Fire alert! Fire has been continuously detected for 15+ seconds. Please check immediately.';

// POST /api/alarm/notify
router.post('/notify', async (req, res) => {
  const { TELEGRAM_BOT_TOKEN: botToken, TELEGRAM_CHAT_ID: chatId } = process.env;

  if (!botToken || !chatId) {
    console.error('Telegram configuration is missing');
    return res.status(500).json({ message: 'Telegram configuration is missing' });
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: TELEGRAM_MESSAGE })
    });
    const responseData = await telegramResponse.json();

    if (!telegramResponse.ok || responseData.ok === false) {
      console.error('Telegram alert failed:', responseData);
      return res.status(502).json({ message: 'Telegram alert failed' });
    }

    console.log('Telegram fire alert sent successfully');
    return res.json({ message: 'Telegram alert sent' });
  } catch (error) {
    // Telegram failures are reported to the caller but never crash the server.
    console.error('Telegram alert network error:', error.message);
    return res.status(502).json({ message: 'Unable to send Telegram alert' });
  }
});

module.exports = router;