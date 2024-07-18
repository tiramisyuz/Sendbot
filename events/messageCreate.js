const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { gemini, logChannel } = require('../config.json');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(gemini);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
var chat = model.startChat({});

const { createErrorEmbed, createVagueErrorEmbed } = require('../util/errorEmbed');

// Load JSON file
const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

var onCooldown = [];

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore messages from bots
        if (message.author.bot) return;

        if (message.mentions.has(message.client.user)) {
            // it's a gemini command

            message.channel.sendTyping();

            if (message.content.toLowerCase().includes("whack")) {
                message.channel.send("Ugh....... my probe hurts.");
                chat = model.startChat({});
                return;
            }

            const prompt = message.content;

            var result;

            if (message.attachments.size) {
                const imageParts = [];

                for (const attachment of message.attachments.values()) {
                    const filename = attachment.name;
                    const mimeType = attachment.contentType;

                    // Download the attachment
                    const response = await fetch(attachment.url);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Save the file to the "tmp" directory
                    const filePath = path.join('tmp', filename);
                    fs.writeFileSync(filePath, buffer);

                    imageParts.push(fileToGenerativePart(filePath, mimeType));

                    fs.unlink(filePath, (err) => {
                        if (err) throw err;
                        console.log(`Unlinked ${filePath}`);
                    });
                }

                try {
                    result = await chat.sendMessage([prompt, ...imageParts]);
                } catch (err) {
                    message.reply({ embeds: [createVagueErrorEmbed()] });
                    message.client.channels.fetch(logChannel)
                        .then(channel => {
                            const embed = createErrorEmbed(err.stack.toString().substring(0, 2000));
                            channel.send({ embeds: [embed] });
                        })
                        .catch(console.error);
                    return;
                }
            } else {
                try {
                    result = await chat.sendMessage(prompt);
                } catch (err) {
                    message.reply({ embeds: [createVagueErrorEmbed()] });
                    message.client.channels.fetch(logChannel)
                        .then(channel => {
                            const embed = createErrorEmbed(err.stack.toString().substring(0, 2000));
                            channel.send({ embeds: [embed] });
                        })
                        .catch(console.error);
                    return;
                }
            }

            try {
                const response = await result.response;
                const text = response.text();

                await message.reply({ content: text.substring(0, 2000), allowedMentions: { repliedUser: false } });

            } catch (err) {
                message.reply({ embeds: [createVagueErrorEmbed()] });
                client.channels.fetch('1263586948614848633')
                    .then(channel => {
                        const embed = createErrorEmbed(err.stack.toString().substring(0, 2000));
                        channel.send({ embeds: [embed] });
                    })
                    .catch(console.error);
            }

            return;
        }

        if (onCooldown.includes(message.author.id)) return;

        // Collect responses for all matches
        const responseMessages = [];

        for (const key in responses) {
            if (message.content.toLowerCase().includes(key.toLowerCase())) {
                responseMessages.push(responses[key]);
            }
        }

        // If there are any collected responses, reply with them combined
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
