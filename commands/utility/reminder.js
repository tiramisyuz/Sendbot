const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const remindersFile = path.resolve(__dirname, '../../reminders.json');

// Ensure the reminders file exists
if (!fs.existsSync(remindersFile)) {
    fs.writeFileSync(remindersFile, JSON.stringify({}));
}

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option
                .setName('reminder')
                .setDescription('What would you like to be reminded about?')
                .setMaxLength(1000)
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('time')
                .setDescription('In minutes, when the timer should go off counting from the current time')
                .setRequired(true)),
    async execute(interaction) {
        const reminder = interaction.options.getString('reminder');
        const time = interaction.options.getInteger('time');
        const userId = interaction.user.id;

        const currentTime = Date.now();
        const reminderTimestamp = currentTime + time * 60 * 1000;

        const reminders = JSON.parse(fs.readFileSync(remindersFile));

        reminders[userId] = {
            reminder,
            timestamp: reminderTimestamp
        };

        fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));

        await interaction.reply(`Your reminder has been set! I will remind you in ${time} minutes.`);
    },
};
