const express = require('express');

const router = express.Router();
const ALARM_TIMEOUT_MS = 15 * 1000;
const TELEGRAM_MESSAGE = '🔥 Fire alert! Alarm was not muted within 15 seconds. Please check immediately.';

// Only one pending alarm timer is needed for the current single-recipient setup.
let alarmTimer = null;

// Sends the escalation message after the alarm remains unmuted for 15 seconds.
const sendTelegramAlert = async () => {
  const { TELEGRAM_BOT_TOKEN: botToken, TELEGRAM_CHAT_ID: chatId } = process.env;

  if (!botToken || !chatId) {
    console.error('Telegram configuration is missing');
    return;
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: TELEGRAM_MESSAGE })
    });

    const responseText = await telegramResponse.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { description: responseText };
    }

    if (!telegramResponse.ok || responseData.ok === false) {
      console.error('Telegram alert failed:', responseData);
      return;
    }

    console.log('Telegram fire alert sent successfully');
  } catch (error) {
    // Telegram failures must not crash the backend or affect the local alarm UI.
    console.error('Telegram alert network error:', error.message);
  }
};

// POST /api/alarm/start-timer
router.post('/start-timer', (req, res) => {
  // Reset any previous pending timer before starting a new single alarm timer.
  if (alarmTimer) clearTimeout(alarmTimer);

  alarmTimer = setTimeout(async () => {
    alarmTimer = null;
    await sendTelegramAlert();
  }, ALARM_TIMEOUT_MS);

  return res.json({ message: 'Alarm timer started', timeoutSeconds: 15 });
});

// POST /api/alarm/mute
router.post('/mute', (req, res) => {
  if (alarmTimer) {
    clearTimeout(alarmTimer);
    alarmTimer = null;
  }

  return res.json({ message: 'Alarm timer muted' });
});

module.exports = router;
