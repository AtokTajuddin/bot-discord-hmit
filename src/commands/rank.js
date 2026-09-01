const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getUserRank } = require('../utils/database');
const { getLevelFromXP } = require('../utils/xpCalculator')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Lihat rank dan progress XP member')
        .addUserOption(opt => opt.setName('user')
            .setDescription('Member yang ingin dicek')
            .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guild.id;

        const userData = getUser.get(target.id, guildId);

        if (!userData) {
            return interaction.editReply({
                content: `❌ **${target.username}** belum punya data XP. Mulai chat dulu!`
            });
        }

        const { level, currentXP, requiredXP, percentage } = getLevelFromXP(userData.xp)
        // Calculate rank position in a server
        const rankResult = getUserRank.get(guildId, target.id, guildId);
        const rank = rankResult ? (rankResult.rank || 0) + 1 : 1;

        const filled = Math.floor(percentage / 5);
        const empty = 20 - filled;
        const progress = '█'.repeat(filled) + '░'.repeat(empty);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord Blurple
            .setAuthor({
                name: `${target.username}'s Rank Card`,
                iconURL: target.displayAvatarURL()
            })
            .addFields(
                { name: 'Server Rank', value: `#${rank}`, inline: true },
                { name: 'Level', value: `${level}`, inline: true },
                { name: 'Total Messages', value: `${userData.messages}`, inline: true },
                {
                    name: `XP Progress (${percentage}%)`,
                    value: `\`${progress}\`\n${currentXP} / ${requiredXP} XP`,
                    inline: false
                }
            )
            .setFooter({ text: `Total XP: ${userData.xp}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
