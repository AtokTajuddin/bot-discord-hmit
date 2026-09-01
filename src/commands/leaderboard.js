const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../utils/database');
const { getLevelFromXP } = require('../utils/xpCalculator');
// Show Top 30 Leaderboard that actively chat 
module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Tampilkan top 30 member paling aktif di server'),

    async execute(interaction) {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        const topUsers = getLeaderboard.all(guildId, 30);

        if (!topUsers.length) {
            return interaction.editReply('Belum ada data XP di server ini.');
        }
        const medals = ['🥇', '🥈', '🥉'];

        const description = (await Promise.all(
            topUsers.map(async (user, index) => {
                const { level } = getLevelFromXP(user.xp);
                const medal = medals[index] || `**#${index + 1}**`;

                let username;
                try {
                    const member = await interaction.guild.members.fetch(user.user_id);
                    username = member.displayName;
                }
                catch {
                    username = `Unknown User`;
                }

                return `${medal} **${username}** — Level ${level} • ${user.xp} XP`;
            })
        )).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0xFFD700) // Gold
            .setTitle(`Leaderboard — ${interaction.guild.name}`)
            .setDescription(description)
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'XP diperbarui setiap pesan (cooldown 1 menit)' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
