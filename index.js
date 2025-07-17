import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  SSU_SSD_CHANNEL_ID,
  ANNOUNCE_CHANNEL_ID
} = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !SSU_SSD_CHANNEL_ID || !ANNOUNCE_CHANNEL_ID) {
  console.error('Missing one or more required environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('ssu')
    .setDescription('Post the ER:LC Server Start-Up embed'),
  new SlashCommandBuilder()
    .setName('ssd')
    .setDescription('Post the ER:LC Server Shutdown embed'),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement (admin only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Announcement message')
        .setRequired(true))
].map(cmd => cmd.toJSON());

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    console.log('Refreshing application commands...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Successfully reloaded commands.');
  } catch (error) {
    console.error('Failed to reload commands:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  deployCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const command = interaction.commandName;
    const ssuSsdChannel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
    const announceChannel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);

    if (!ssuSsdChannel?.isTextBased()) {
      return interaction.reply({ content: 'Error: SSU/SSD channel is not a text channel.', ephemeral: true });
    }

    if (!announceChannel?.isTextBased()) {
      return interaction.reply({ content: 'Error: Announcement channel is not a text channel.', ephemeral: true });
    }

    if (command === 'ssu') {
      const startTimeUnix = Math.floor(Date.now() / 1000);
      const ssuEmbed = new EmbedBuilder()
        .setTitle('🚦 ER:LC Server Start-Up')
        .setDescription('The **Emergency Response: Liberty County** server is now **online** and accepting players! Prepare for duty and follow the rules.')
        .setColor('#1E90FF')
        .addFields(
          { name: '🆔 Server Code', value: '`zoWQH`', inline: true },
          { name: '🕒 Start Time (Local)', value: `<t:${startTimeUnix}:F>`, inline: true },
          { name: '📜 Rules Reminder', value: 'No random deathmatch (RDM), respect staff and players, use proper roleplay.' }
        )
        .setTimestamp()
        .setFooter({ text: 'Stay safe out there!' });

      await interaction.reply({ content: `✅ SSU posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
      await ssuSsdChannel.send({ embeds: [ssuEmbed] });

    } else if (command === 'ssd') {
      const shutdownTimeUnix = Math.floor(Date.now() / 1000);
      const ssdEmbed = new EmbedBuilder()
        .setTitle('🛑 ER:LC Server Shutdown')
        .setDescription('The **Emergency Response: Liberty County** server is now **offline**. Please wait for the next start-up announcement.')
        .setColor('#FF0000')
        .addFields(
          { name: '🕒 Shutdown Time (Local)', value: `<t:${shutdownTimeUnix}:F>`, inline: true },
          { name: 'SERVER CLOSED', value: 'Our server has now shutdown. You are not permitted to join the in-game server. You will be notified when we next start up the server via this channel.' }
        )
        .setTimestamp()
        .setFooter({ text: 'Thanks for your patience!' });

      await interaction.reply({ content: `✅ SSD posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
      await ssuSsdChannel.send({ embeds: [ssdEmbed] });

    } else if (command === 'announce') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
      }

      const message = interaction.options.getString('message');
      const announceEmbed = new EmbedBuilder()
        .setTitle('📢 Announcement')
        .setDescription(message)
        .setColor('Gold')
        .setFooter({ text: 'Server Code: zoWQH' })
        .setTimestamp();

      await interaction.reply({ content: `📣 Announcement sent in <#${ANNOUNCE_CHANNEL_ID}>`, ephemeral: true });
      await announceChannel.send({ embeds: [announceEmbed] });
    }

  } catch (error) {
    console.error('Command error:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
    }
  }
});

client.login(DISCORD_TOKEN);
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(PORT, () => {
  console.log(`Web server running on http://localhost:${PORT}`);
});
