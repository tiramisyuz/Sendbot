const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('user')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Who to get the linked Sendchat account of')
                .setRequired(true))
        .setDescription('Gets the user\'s linked Sendchat account'),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const targetUserId = targetUser.id;

        // Path to the users.json file
        const filePath = 'users.json';

        // Read the existing data
        fs.readFile(filePath, 'utf8', async (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return interaction.reply('There was an error retrieving the linked Sendchat account.');
            }

            let users;
            try {
                users = JSON.parse(data);
            } catch (err) {
                console.error('Error parsing JSON:', err);
                return interaction.reply('There was an error processing the user data.');
            }

            // Get the Sendchat account name linked to the target user
            const sendchatName = users[targetUserId];

            if (!sendchatName) {
                return interaction.reply('This user does not have a linked Sendchat account.');
            }

            try {
                // Fetch Sendchat account details from the API
                const response = await fetch(`https://sendchat.xyz/api/users/${sendchatName}`);
                const sendchatData = await response.json();

                const embed = new EmbedBuilder()
                    .setColor(0xbd79ff)
                    .setTitle(`@${sendchatData.username} on Sendchat`)
                    .setURL(`https://sendchat.xyz/@${sendchatName}`)
                    .setThumbnail(sendchatData.picture == '' ? "https://sendchat.xyz/blank.webp" : sendchatData.picture)
                    .addFields(
                        { name: 'ID', value: sendchatData._id, inline: true },
                        { name: 'Created at', value: new Date(sendchatData.createdAt).toLocaleString(), inline: true },
                        { name: 'Updated at', value: new Date(sendchatData.updatedAt).toLocaleString(), inline: true }
                    )
                    .setTimestamp();

                // Reply with the embed
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error fetching Sendchat data:', error);
                return interaction.reply('There was an error fetching the Sendchat account details.');
            }
        });
    },
};
