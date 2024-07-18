const { Events, ActivityType } = require('discord.js');
const { startupMessage, logChannel } = require('../config.json');
const { createErrorEmbed } = require('../util/errorEmbed');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`, `\nMongolia has been located.`);

        const yapChannel = await client.channels.fetch("1263307389642211330");

        if (yapChannel) {
            if (startupMessage !== '') {
                yapChannel.send(startupMessage);
            }
        } else {
            console.log("yapChannel not found");
        }

        async function updateStatus() {
            try {
                const response = await fetch('https://sendchat.xyz/api/users');
                const data = await response.json();
                const userCount = data.length;

                client.user.setPresence({
                    activities: [{
                        name: `${userCount} Sendchat users`,
                        type: ActivityType.Watching
                    }],
                    status: 'idle'
                });
            } catch (err) {
                client.channels.fetch(logChannel)
                    .then(channel => {
                        const embed = createErrorEmbed(err.stack);
                        channel.send({ embeds: [embed] });
                    })
                    .catch(console.error);
            }
        }

        updateStatus();
        setInterval(updateStatus, 1 * 60000);
    },
};