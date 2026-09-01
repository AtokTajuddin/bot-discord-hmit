const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/database');
const { getLevelFromXP } = require('../utils/xpCalculator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('score')
        .setDescription('Lihat statistik XP detail kamu atau member lain')
        .addUserOption(opt =>
            opt
                .setName('user')
                .setDescription('Member yang ingin dilihat statistiknya')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guild.id;

        // Fetch dari DB
        const userData = getUser.get(target.id, guildId);

        // Guard: user belum punya data
        if (!userData) {
            return interaction.followUp({
                content: `**${target.username}** belum punya data XP. Mulai chat dulu!`,
                ephemeral: true,
            });
        }

        const { level, currentXP, requiredXP, percentage } = getLevelFromXP(userData.xp);

        // ── Progress bar (20 karakter) ──
        const filled = Math.floor(percentage / 5);
        const empty = 20 - filled;
        const progress = '█'.repeat(filled) + '░'.repeat(empty);

        // ── Format last active timestamp ──
        const lastActive = userData.last_message_at
            ? `<t:${Math.floor(userData.last_message_at / 1000)}:R>` // Discord relative timestamp
            : 'Belum pernah aktif';

        // ── Hitung XP yang dibutuhkan untuk level berikutnya ──
        const xpToNext = requiredXP - currentXP;

        // ── Estimasi pesan untuk naik level ──
        // Asumsi rata-rata XP per pesan = 20 (tengah dari range 15-25)
        const avgXPPerMsg = 20;
        const msgsToNextLvl = Math.ceil(xpToNext / avgXPPerMsg);

        const embed = new EmbedBuilder()
            .setColor(0x57F287) // Discord Green
            .setAuthor({
                name: `${target.username}'s Score`,
                iconURL: target.displayAvatarURL(),
            })
            .setThumbnail(target.displayAvatarURL({ size: 128 }))
            .addFields(
                // Row 1: Level info
                {
                    name: 'Level Sekarang',
                    value: `**${level}**`,
                    inline: true,
                },
                {
                    name: 'Total XP',
                    value: `**${userData.xp.toLocaleString()}**`,
                    inline: true,
                },
                {
                    name: 'Total Pesan',
                    value: `**${userData.messages.toLocaleString()}**`,
                    inline: true,
                },

                // Row 2: Progress ke level berikutnya
                {
                    name: `Progress ke Level ${level + 1} (${percentage}%)`,
                    value: `\`${progress}\`\n**${currentXP.toLocaleString()}** / **${requiredXP.toLocaleString()}** XP`,
                    inline: false,
                },

                // Row 3: Info tambahan
                {
                    name: 'XP Kurang',
                    value: `**${xpToNext.toLocaleString()}** XP lagi`,
                    inline: true,
                },
                {
                    name: 'Estimasi Pesan',
                    value: `~**${msgsToNextLvl}** pesan lagi`,
                    inline: true,
                },
                {
                    name: 'Terakhir Aktif',
                    value: lastActive,
                    inline: true,
                },
            )
            .setFooter({
                text: `ID: ${target.id}`,
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};