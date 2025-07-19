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
  RULES_CHANNEL_ID = '1378770594731921498',
  PORT = 10000
} = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !SSU_SSD_CHANNEL_ID) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const imageURL = 'https://cdn.discordapp.com/attachments/1245048324717805568/1378799332014297158/inf-gren_gds_600x600-hmtk.png?ex=687be0f1&is=687a8f71&hm=6f03ed61d6de4034f35a4ae458af4a1e3be1320b300f0eb698d553abd13ee52d';

const commands = [
  new SlashCommandBuilder().setName('ssu').setDescription('Post Server Start Up embed'),
  new SlashCommandBuilder().setName('ssd').setDescription('Post Server Shut Down embed'),
  new SlashCommandBuilder().setName('discordrules').setDescription('Post Discord server rules embed'),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement (admin only)')
    .addStringOption(option =>
      option.setName('message').setDescription('Announcement message').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send a custom embed (admin only)')
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
  console.log(`✅ Logged in as ${client.user.tag}`);
  deployCommands();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const ssuSsdChannel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
  const rulesChannel = await client.channels.fetch(RULES_CHANNEL_ID);

  if (commandName === 'ssu') {
    const embed = new EmbedBuilder()
      .setTitle('Windsor Castle RP — Server Start Up')
      .setColor('#0047AB')
      .setDescription(
        `Welcome to Windsor Castle RP!\n\n` +
        `The server is now **ONLINE**.\n\n` +
        `🔹 Please follow all community rules\n` +
        `🔹 Report any bugs or issues\n` +
        `🔹 Enjoy immersive and respectful RP!`
      )
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP | Server Status' })
      .setTimestamp();

    await interaction.reply({ content: `✅ SSU posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [embed] });

  } else if (commandName === 'ssd') {
    const embed = new EmbedBuilder()
      .setTitle('Windsor Castle RP — Server Shut Down')
      .setColor('#0047AB')
      .setDescription(
        `The server is now **OFFLINE**.\n\n` +
        `Thanks for participating today!\n\n` +
        `🕊️ Make sure to log off properly\n` +
        `📝 Feel free to leave feedback or suggestions\n` +
        `👑 See you next session!`
      )
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP | Server Status' })
      .setTimestamp();

    await interaction.reply({ content: `✅ SSD posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [embed] });

  } else if (commandName === 'discordrules') {
    const embed = new EmbedBuilder()
      .setTitle('📘 Server Rules')
      .setColor('#0099ff')
      .setThumbnail(imageURL)
      .addFields(
        { name: '1. Respect Everyone', value: 'No bullying, discrimination, or harassment.' },
        { name: '2. Follow Discord & Roblox ToS', value: 'No violations tolerated.' },
        { name: '3. No Drama or Arguments', value: 'Take personal issues to DMs.' },
        { name: '4. No Advertising', value: 'Including DMs and off-topic links.' },
        { name: '5. No Spam or Raiding', value: 'Includes large text, emojis, media.' },
        { name: '6. No Threats', value: 'No intimidation or doxxing.' },
        { name: '7. No Malicious Links', value: 'Only safe and relevant links allowed.' },
        { name: '8. Don’t Ping Excessively', value: 'Ping staff/members only when needed.' },
        { name: '9. No NSFW Content', value: 'Keep it clean for everyone.' },
        { name: '10. English Only', value: 'Use English in public channels.' },
        { name: '11. No Impersonation', value: 'Especially staff or other users.' },
        { name: '12. Respect Chain of Command', value: 'Report to proper roles/staff.' },
        { name: '13. Channel Misuse', value: 'Stick to each channel’s purpose.' },
      )
      .setFooter({ text: 'Violating rules may result in punishment. Stay respectful!' })
      .setTimestamp();

    await interaction.reply({ content: `📘 Rules posted in <#${RULES_CHANNEL_ID}>`, ephemeral: true });
    await rulesChannel.send({ embeds: [embed] });

  } else if (commandName === 'announce') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ You lack permission to use this command.', ephemeral: true });
    }

    const msg = interaction.options.getString('message');
    const embed = new EmbedBuilder()
      .setTitle('📢 Announcement')
      .setColor('Gold')
      .setDescription(msg)
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP' })
      .setTimestamp();

    await interaction.reply({ content: `📣 Announcement sent in this channel.`, ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });

  } else if (commandName === 'embed') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ You lack permission to use this command.', ephemeral: true });
    }

    const title = interaction.options.getString('title');
    const desc = interaction.options.getString('description');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(desc)
      .setColor('#5865F2')
      .setThumbnail(imageURL)
      .setFooter({ text: 'Custom Embed' })
      .setTimestamp();

    await interaction.reply({ content: `✅ Embed sent.`, ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);

// Express keep-alive for Render
const app = express();
app.get('/', (_, res) => res.sendStatus(200));
app.listen(PORT, () => {
  console.log(`🌐 HTTP server running on port ${PORT}`);
});