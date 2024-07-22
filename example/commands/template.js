const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('template')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('This is a template option. Hello world')
                .setRequired(true))
        .setDescription('Hello world'),
    async execute(interaction) {
        await interaction.reply("Hello, world!");
    },
};
