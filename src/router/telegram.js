const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(message, options = {}) {
    if (!BOT_TOKEN || !CHAT_ID) {
        return;
    }

    try {
        const payload = {
            chat_id: CHAT_ID,
            text: message,
            ...options
        };

        await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            payload
        );
    } catch (error) {
        console.log(error.response?.data || error.message);
    }
}

module.exports = sendTelegram;