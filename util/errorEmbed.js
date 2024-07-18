const { EmbedBuilder } = require('discord.js');

function createErrorEmbed(stack) {
    return new EmbedBuilder()
        .setAuthor({ name: 'An error has occurred', iconURL: 'https://bignutty.gitlab.io/webstorage4/v2/assets/icons/core/ico_notice_error.png' })
        .setDescription(`\`\`\`\n${stack.toString().substring(0, 2000)}\n\`\`\``)
        .setColor('#f94d66')
        .setTimestamp();
}

function createVagueErrorEmbed() {
    return new EmbedBuilder()
        .setAuthor({ name: 'An error has occurred', iconURL: 'https://bignutty.gitlab.io/webstorage4/v2/assets/icons/core/ico_notice_error.png' })
        .setColor('#f94d66')
        .setTimestamp();
}

module.exports = { createErrorEmbed, createVagueErrorEmbed };
