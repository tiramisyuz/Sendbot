const fs = require('fs');
const path = require('path');

const { logChannel } = require('../config.json');

const { GoogleGenerativeAI } = require("@google/generative-ai");
let genAI, model, chat;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    chat = model.startChat({});
}

const { createErrorEmbed, createVagueErrorEmbed } = require('../util/errorEmbed');

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

async function processPrompt(message) {
    message.channel.sendTyping();

    if (message.content.toLowerCase().includes("whack")) {
        message.channel.send("Ugh....... my probe hurts.");
        chat = model.startChat({});
        return;
    }

    var prompt = message.content;

    if (prompt === '' || !prompt) {
        prompt = '[no prompt provided]';
    }

    var result;

    if (message.attachments.size) {
        const imageParts = [];

        for (const attachment of message.attachments.values()) {
            const filename = attachment.name;
            const mimeType = attachment.contentType;

            const response = await fetch(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

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
                    const embed = createErrorEmbed(err.stack);
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
                    const embed = createErrorEmbed(err.stack);
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
        message.client.channels.fetch(logChannel)
            .then(channel => {
                const embed = createErrorEmbed(err.stack);
                channel.send({ embeds: [embed] });
            })
            .catch(console.error);
    }

    return;
}

module.exports = { processPrompt };
