const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
        const discordName = interaction.user.username;
        const sendchatName = interaction.options.getString('name');

        try {
            // Fetch Sendchat account data
            const response = await fetch(`https://sendchat.xyz/api/users/${sendchatName}`);
            if (!response.ok) {
                return interaction.reply(`Could not find Sendchat account with username "${sendchatName}".`);
            }

            const sendchatData = await response.json();

            // Verify that the Sendchat account's bio contains the user's Discord name
            if (!sendchatData.bio.includes(discordName)) {
                return interaction.reply(`Please include your Discord username "${discordName}" in your Sendchat bio.`);
            }

            // Path to the users.json file
            const filePath = path.resolve('users.json');

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

                    return interaction.reply(`The account "${sendchatName}" was linked successfully.`);
                });
            });
        } catch (error) {
            console.error('Error fetching Sendchat account data:', error);
            return interaction.reply('There was an error verifying your Sendchat account.');
        }
    },
};
