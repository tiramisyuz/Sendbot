const { Events, ActivityType } = require('discord.js');
const { startupMessage, logChannel } = require('../config.json');
const { createErrorEmbed } = require('../util/errorEmbed');
const fs = require('fs');
const path = require('path');

const remindersFile = path.resolve(__dirname, '../reminders.json');

// Ensure the reminders file exists
if (!fs.existsSync(remindersFile)) {
    fs.writeFileSync(remindersFile, JSON.stringify({}));
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`, `\nMongolia has been located.`);

        const yapChannel = await client.channels.fetch("1263307389642211330");
        const reminderChannelId = "1263558221608779919";
        const reminderChannel = await client.channels.fetch(reminderChannelId);

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

        function checkReminders() {
            const reminders = JSON.parse(fs.readFileSync(remindersFile));
            const currentTime = Date.now();

            for (const userId in reminders) {
                if (reminders[userId].timestamp <= currentTime) {
                    if (reminderChannel) {
                        reminderChannel.send(`⏰ <@${userId}> Reminder: ${reminders[userId].reminder}`);
                    }

                    // Remove the reminder after notifying the user
                    delete reminders[userId];
                }
            }

            fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
        }

        // Check reminders every 10 seconds
        setInterval(checkReminders, 10000);
    },
};
