const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('link')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Name of the Sendchat account you want to link')
                .setRequired(true))
        .setDescription('Gets the user\'s linked Sendchat account'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const sendchatName = interaction.options.getString('name');

        // Path to the users.json file
        const filePath = 'users.json';

        // Read the existing data
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return interaction.reply('There was an error linking your Sendchat account.');
            }

            let users;
            try {
                users = JSON.parse(data);
            } catch (err) {
                console.error('Error parsing JSON:', err);
                return interaction.reply('There was an error processing the user data.');
            }

            // Check if the Sendchat account is already linked to another user
            for (const key in users) {
                if (users[key] === sendchatName && key !== userId) {
                    return interaction.reply('This Sendchat account is already linked to another user.');
                }
            }

            // Add or update the user data
            users[userId] = sendchatName;

            // Write the updated data back to the file
            fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing to the file:', err);
                    return interaction.reply('There was an error saving your Sendchat account.');
                }

                return interaction.reply(`The account, "${sendchatName}", was linked successfully.`);
            });
        });
    },
};
