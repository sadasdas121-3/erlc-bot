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
dotenv.config();

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  SSU_SSD_CHANNEL_ID,
  ANNOUNCE_CHANNEL_ID
} = process.env;

const RULES_CHANNEL_ID = '1393480748987715706';

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const commands = [
  new SlashCommandBuilder().setName('ssu').setDescription('Post SSU embed'),
  new SlashCommandBuilder().setName('ssd').setDescription('Post SSD embed'),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement (admin only)')
    .addStringOption(option =>
      option.setName('message').setDescription('Announcement message').setRequired(true)
    ),
  new SlashCommandBuilder().setName('discordrules').setDescription('Post Discord rules embed'),
  new SlashCommandBuilder().setName('ingamerules').setDescription('Post in-game rules embed')
].map(command => command.toJSON());

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    console.log('Refreshing slash commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Commands deployed.');
  } catch (err) {
    console.error('Failed to deploy commands:', err);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  deployCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  const rulesChannel = await client.channels.fetch(RULES_CHANNEL_ID);
  const ssuSsdChannel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
  const announceChannel = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);

  if (commandName === 'ssu') {
    const startTime = Math.floor(Date.now() / 1000);
    const ssuEmbed = new EmbedBuilder()
      .setTitle('🚦 ER:LC Server Start-Up')
      .setColor('#1E90FF')
      .setDescription('Server is now online and accepting players!')
      .addFields(
        { name: '🆔 Server Code', value: '`zoWQH`', inline: true },
        { name: '🕒 Start Time', value: `<t:${startTime}:F>`, inline: true },
        {
          name: '📜 Rules Reminder',
          value: 'No RDM, no fail RP, respect staff, and follow the Roblox TOS.'
        }
      )
      .setFooter({ text: 'Stay safe out there!' })
      .setTimestamp();

    await interaction.reply({ content: `✅ SSU posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [ssuEmbed] });

  } else if (commandName === 'ssd') {
    const shutdownTime = Math.floor(Date.now() / 1000);
    const ssdEmbed = new EmbedBuilder()
      .setTitle('🛑 ER:LC Server Shutdown')
      .setColor('#FF0000')
      .setDescription('Server is now offline.')
      .addFields(
        { name: '🕒 Shutdown Time', value: `<t:${shutdownTime}:F>` },
        { name: '🔒', value: 'Please wait for the next SSU to join again.' }
      )
      .setFooter({ text: 'Thanks for playing!' })
      .setTimestamp();

    await interaction.reply({ content: `✅ SSD posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [ssdEmbed] });

  } else if (commandName === 'announce') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ You lack permission.', ephemeral: true });
    }

    const msg = interaction.options.getString('message');
    const embed = new EmbedBuilder()
      .setTitle('📢 Announcement')
      .setColor('Gold')
      .setDescription(msg)
      .setFooter({ text: 'Server Code: zoWQH' })
      .setTimestamp();

    await interaction.reply({ content: `📣 Sent in <#${ANNOUNCE_CHANNEL_ID}>`, ephemeral: true });
    await announceChannel.send({ embeds: [embed] });

  } else if (commandName === 'discordrules') {
    const embed = new EmbedBuilder()
      .setTitle('📘 NYCRP Discord Rules')
      .setColor('Blurple')
      .setFields(
        {
          name: '📛 Harassment',
          value: [
            '• No bullying, harassment, or server raiding.',
            '• No threats, direct or indirect.',
            '• No doxxing or sharing private info.'
          ].join('\n')
        },
        {
          name: '🛑 Hateful Conduct',
          value: [
            '• No hate speech or slurs.',
            '• No extremist symbols or denial of atrocities.'
          ].join('\n')
        },
        {
          name: '🚨 Dangerous Content',
          value: [
            '• No promoting violence or terrorism.',
            '• No graphic violence, gore, or animal harm.'
          ].join('\n')
        },
        {
          name: '🔞 Sexual Content & Safety',
          value: [
            '• No CSAM or grooming.',
            '• No NSFW content unless age-restricted.',
            '• No sexualizing real or animated minors.'
          ].join('\n')
        },
        {
          name: '🧠 Self-Harm',
          value: '• No glorifying or promoting self-harm or suicide.'
        },
        {
          name: '⚙️ Platform Rules',
          value: [
            '• No spamming, self-bots, or fake engagement.',
            '• No impersonation or alt evasion.',
            '• No phishing, hacking, or malware.'
          ].join('\n')
        }
      )
      .setFooter({ text: 'These rules apply across all NYCRP servers.' });

    await interaction.reply({ content: `📘 Rules posted in <#${RULES_CHANNEL_ID}>`, ephemeral: true });
    await rulesChannel.send({ embeds: [embed] });

  } else if (commandName === 'ingamerules') {
    const embed = new EmbedBuilder()
      .setTitle('📜 NYCRP In-Game Rules')
      .setColor('Green')
      .addFields(
        {
          name: 'General Gameplay',
          value: [
            '1. No RDM (Random Deathmatch)',
            '2. No VDM (Vehicle Deathmatch)',
            '3. No Fail RP or Unrealistic RP',
            '4. No Cop Baiting',
            '5. No Evading without cause',
            '6. No unrealistic pursuits or crashes',
            '7. No ERP (Explicit Roleplay)',
            '8. Spawns (Civilian, Police, Hospital) are safezones',
            '9. Family RP must be realistic',
            '10. Do not impersonate staff or emergency services',
            '11. Use appropriate character names',
            '12. Respect Roblox ToS at all times',
            '13. Do not abuse glitches or exploits'
          ].join('\n')
        },
        {
          name: '🚫 Banned RP Types',
          value: [
            '• Bomb RP',
            '• Terrorist RP',
            '• School shooter RP',
            '• Kidnap RP (unless both parties consent)',
            '• ERP or anything sexual'
          ].join('\n')
        },
        {
          name: '🎖️ Server Booster Perks',
          value: 'Boosters may use banned cars/guns for fun or VIP RP **unless abused**.'
        }
      )
      .setFooter({ text: 'Play fair. Roleplay right. - NYCRP' });

    await interaction.reply({ content: `📜 In-game rules posted in <#${RULES_CHANNEL_ID}>`, ephemeral: true });
    await rulesChannel.send({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);

// Express Web Server for Uptime Monitoring
import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Web server live on port ${PORT}`));
