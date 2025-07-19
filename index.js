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

const RULES_CHANNEL_ID = '1393480748987715706';

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !SSU_SSD_CHANNEL_ID || !ANNOUNCE_CHANNEL_ID) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const imageURL = 'https://cdn.discordapp.com/attachments/1245048324717805568/1378799332014297158/inf-gren_gds_600x600-hmtk.png?ex=687be0f1&is=687a8f71&hm=6f03ed61d6de4034f35a4ae458af4a1e3be1320b300f0eb698d553abd13ee52d';

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
  new SlashCommandBuilder().setName('ingamerules').setDescription('Post in-game rules embed'),
  new SlashCommandBuilder()  // Added /embed command
    .setName('embed')
    .setDescription('Create a custom embed (admin only)')
    .addStringOption(option =>
      option.setName('title').setDescription('Embed title').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description').setDescription('Embed description').setRequired(true)
    )
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
      .setTitle('Windsor Castle RP — Server Start Up')
      .setColor('#0047AB') // Royal Blue
      .setDescription(
        `Welcome to Windsor Castle Roleplay!\n\n` +
        `The server is now online and ready for duty.\n` +
        `Please ensure you’re familiar with the rules and ready to engage respectfully and fairly with all members.\n\n` +
        `Remember:\n` +
        `- Follow the chain of command.\n` +
        `- Keep communications clear and respectful.\n` +
        `- Report any issues to staff promptly.\n` +
        `- Stay immersive and enjoy the experience!`
      )
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP | Server Status' })
      .setTimestamp(startTime * 1000);

    await interaction.reply({ content: `✅ SSU posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [ssuEmbed] });

  } else if (commandName === 'ssd') {
    const shutdownTime = Math.floor(Date.now() / 1000);
    const ssdEmbed = new EmbedBuilder()
      .setTitle('Windsor Castle RP — Server Shut Down')
      .setColor('#0047AB')
      .setDescription(
        `The server is now going offline.\n\n` +
        `Thank you all for your time and dedication today.\n` +
        `Please log off safely and remember to follow up on any pending tasks or reports.\n\n` +
        `We look forward to seeing you back soon for another immersive session.`
      )
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP | Server Status' })
      .setTimestamp(shutdownTime * 1000);

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
      .setThumbnail(imageURL)
      .setFooter({ text: 'Server Code: zoWQH' })
      .setTimestamp();

    await interaction.reply({ content: `📣 Sent in <#${ANNOUNCE_CHANNEL_ID}>`, ephemeral: true });
    await announceChannel.send({ embeds: [embed] });

  } else if (commandName === 'discordrules') {
    const embed = new EmbedBuilder()
      .setTitle('Server Rules')
      .setDescription('Please read and follow all the rules carefully.')
      .setColor('#0099ff')
      .setThumbnail(imageURL)
      .addFields(
        { name: 'Rule 1 - Respect all Members', value: 'Treat everyone with respect. Bullying, discrimination or harassment will not be tolerated.' },
        { name: 'Rule 2 - Follow Discord & Roblox ToS', value: 'You are expected to follow the official Discord ToS and Roblox ToS at all times.' },
        { name: 'Rule 3 - Keep it Civil', value: 'No excessive arguing, drama, or politics. Take personal issues to DMs.' },
        { name: 'Rule 4 - Advertising', value: "Don't advertise irrelevant media, servers or ROBLOX groups/servers. This includes direct messaging users from the server." },
        { name: 'Rule 5 - Spamming and Raiding', value: 'Spamming large chunks of text, media, and expressions in our channels is prohibited.' },
        { name: 'Rule 6 - Threats and Intimidation', value: 'Threatening, intimidating, or leaking personal information about a user is prohibited regardless of how you know the user.' },
        { name: 'Rule 7 - External Links', value: 'Do not post any external links which may lead to content that breaks the rules, or which is malicious.' },
        { name: 'Rule 8 - Over Usage of Pings', value: 'Do not ping others unless you absolutely need to, overusing the ping access will result in punishments.' },
        { name: 'Rule 9 - Not Safe For Work Material', value: 'No NSFW or NSFL content, this should not be used whilst communicating throughout our Discord server.' },
        { name: 'Rule 10 - English Only', value: 'Do not speak in any different languages in public channels, this is an English-only server.' },
        { name: 'Rule 11 - Impersonation', value: 'Do not impersonate anyone, including staff, officers, or other members. Impersonation is a serious offence.' },
        { name: 'Rule 12 - Follow the Chain of Command', value: 'Do not skip ranks when asking for help or reporting an issue, start with your immediate superior.' },
        { name: 'Rule 13 - Channel Misuse', value: 'Channel misuse is prohibited, e.g. sending commands in main chats or side chatting in bot commands channel.' },
      )
      .setFooter({ text: 'Please adhere to all rules to maintain a friendly community.' })
      .setTimestamp();

    await interaction.reply({ content: `📘 Rules posted in <#${RULES_CHANNEL_ID}>`, ephemeral: true });
    await rulesChannel.send({ embeds: [embed] });

  } else if (commandName === 'ingamerules') {
    const embed = new EmbedBuilder()
      .setTitle('📜 NYCRP In-Game Rules')
      .setColor('Green')
      .setThumbnail(imageURL)
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
            '8. Spawns (Civil

