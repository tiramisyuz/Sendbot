const fs = require('fs');

const { processPrompt } = require('../util/gemini');

const { Events } = require('discord.js');

var onCooldown = [];

const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        if (message.mentions.has(message.client.user) && process.env.GEMINI_API_KEY) {
            processPrompt(message);
            return;
        }

        if (onCooldown.includes(message.author.id)) return;

        const responseMessages = [];

        for (const key in responses) {
            if (message.content.toLowerCase().includes(key.toLowerCase())) {
                responseMessages.push(responses[key]);
            }
        }

        if (responseMessages.length > 0) {
            onCooldown.push(message.author.id);

            setTimeout(() => {
                const index = onCooldown.indexOf(message.author.id);

                if (index !== -1) {
                    onCooldown.splice(index, 1);
                }
            }, 2000);

            await message.reply(responseMessages.join('\n'));
        }
    },
};
