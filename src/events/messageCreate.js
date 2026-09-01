const { Events } = require('discord.js')
const { getUser, setUser } = require('../utils/database')
const { getLevelFromXP, randomXP } = require('../utils/xpCalculator')

const xpCooldowns = new Map();
const Cooldown_Seconds = 60;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.system) return;

        const { author, guild } = message;
        const userId = author.id;
        const guildId = guild.id;
        const now = Date.now();

        const cooldownKey = `${userId}-${guildId}`;
        const lastXPTime = xpCooldowns.get(cooldownKey) || 0

        if (now - lastXPTime < Cooldown_Seconds * 1000) return;
        xpCooldowns.set(cooldownKey, now);

        let userData = getUser.get(userId, guildId);
        if (!userData) {
            userData = {
                id: `${guildId}-${userId}`,
                user_id: userId,
                guild_id: guildId,
                xp: 0,
                level: 0,
                messages: 0,
                last_message_at: 0,
            };
        }

        const xpGain = randomXP(50, 100);
        const oldLevel = userData.level;
        userData.xp += xpGain;
        userData.messages++;
        userData.last_message_at = now;

        const { level: newLevel } = getLevelFromXP(userData.xp);
        userData.level = newLevel;

        setUser.run(userData);

        if (newLevel > oldLevel) {
            await handleLevelUp(message, newLevel, guild);
        }

    }
};

async function handleLevelUp(message, newLevel, guild) {
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('Hooray...Level up!')
        .setDescription(
            `Selamat **${message.author.username}**! Kamu naik ke **Level ${newLevel}**! 🚀`)
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();

    await message.channel.send({ embeds: [embed] });
    await assignRoleReward(message.member, newLevel, guild);
}

async function assignRoleReward(member, level, guild) {
    const Role_Rewards = {
        //Bisa disesuaikan nantinya...
        5: 'Role_Id_Levl_5',   // Contoh: "Starter"
        10: 'Role_Id_Level_10',  // Contoh: "Initiator"
        20: 'Role_Id_Level_20',  // Contoh: "Influencer"
        30: 'Role_Id_Level_30',  // Contoh: "Veteran"
        50: 'Role_Id_Level_50',  // Contoh: "Maestro"
    };

    const roleId = Role_Rewards[level];
    if (!roleId || roleId.startsWith('Role_Id_')) return;

    try {
        const role = guild.roles.cache.get(roleId);
        if (role) await member.roles.add(role);
    }
    catch (err) {
        console.log(`Gagal assign role di level ${level}:`, err);
    }
}
