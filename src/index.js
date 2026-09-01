require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs'); // Filesystem module
const path = require('path');

if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN belum diset di .env');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,   // Wajib di Developer Portal
        GatewayIntentBits.GuildMembers,
    ]
});

// Load commands
client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (!command.data || !command.execute) continue;
    client.commands.set(command.data.name, command);
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => {
        Promise.resolve(event.execute(...args)).catch(console.error);
    });
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Bot login sebagai ${readyClient.user.tag}`);
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const msg = { content: 'Terjadi error saat menjalankan command.', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(msg);
        } else {
            await interaction.reply(msg);
        }
    }
});

client.login(process.env.BOT_TOKEN);
