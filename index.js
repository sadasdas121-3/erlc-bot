import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionsBitField 
} from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';

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

// Set up Discord client
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
    .addStringOption(opt =>
      opt.setName('message')
         .setDescription('Announcement message')
         .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed (admin only)')
    .addStringOption(opt =>
      opt.setName('title')
         .setDescription('Embed title')
         .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('description')
         .setDescription('Embed description')
         .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// Deploy slash commands to your guild
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

// Bot ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  deployCommands();
});

// Handle interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const ssuSsdChannel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
  const announceChannel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);

  // Helper: ensure channel is text-based
  function isText(channel) {
    return channel && 'send' in channel;
  }

  try {
    if (commandName === 'ssu') {
      const startUnix = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder()
        .setTitle('🚦 ER:LC Server Start-Up')
        .setDescription('The **Emergency Response: Liberty County** server is now **online**!')
        .setColor('#1E90FF')
        .addFields(
          { name: '🆔 Server Code', value: '`zoWQH`', inline: true },
          { name: '🕒 Start Time', value: `<t:${startUnix}:F>`, inline: true },
          { name: '📜 Rules', value: 'No RDM; respect staff & players; proper roleplay.' }
        )
        .setTimestamp()
        .setFooter({ text: 'Stay safe out there!' });

      await interaction.reply({ content: `✅ SSU posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
      if (isText(ssuSsdChannel)) await ssuSsdChannel.send({ embeds: [embed] });

    } else if (commandName === 'ssd') {
      const shutUnix = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder()
        .setTitle('🛑 ER:LC Server Shutdown')
        .setDescription('The **ER:LC** server is now **offline**.')
        .setColor('#FF0000')
        .addFields(
          { name: '🕒 Shutdown Time', value: `<t:${shutUnix}:F>`, inline: true },
          { name: 'Server Closed', value: 'You are not permitted to join until next start-up.' }
        )
        .setTimestamp()
        .setFooter({ text: 'Thanks for your patience!' });

      await interaction.reply({ content: `✅ SSD posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
      if (isText(ssuSsdChannel)) await ssuSsdChannel.send({ embeds: [embed] });

    } else if (commandName === 'announce') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
      }
      const message = interaction.options.getString('message');
      const embed = new EmbedBuilder()
        .setTitle('📢 Announcement')
        .setDescription(message)
        .setColor('Gold')
        .setFooter({ text: 'Server Code: zoWQH' })
        .setTimestamp();

      await interaction.reply({ content: `📣 Announcement sent in <#${ANNOUNCE_CHANNEL_ID}>`, ephemeral: true });
      if (isText(announceChannel)) await announceChannel.send({ embeds: [embed] });

    } else if (commandName === 'embed') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
      }
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor('Blurple')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

  } catch (error) {
    console.error('Command error:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ There was an error.', ephemeral: true });
    }
  }
});

// Login the bot
client.login(DISCORD_TOKEN);

// Express keep‑alive server
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_req, res) => res.send('Bot is alive!'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
