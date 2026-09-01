require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN belum diset di .env');
}

if (!process.env.CLIENT_ID) {
    throw new Error('CLIENT_ID belum diset di .env');
}

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    if (!command.data) continue;
    commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
    console.log('Mendaftarkan slash commands...');

    const route = process.env.GUILD_ID
        ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(route, { body: commands });

    const target = process.env.GUILD_ID ? `guild ${process.env.GUILD_ID}` : 'global';
    console.log(`Slash commands berhasil didaftarkan ke ${target}.`);
})();
