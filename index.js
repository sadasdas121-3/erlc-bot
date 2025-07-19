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
  RULES_CHANNEL_ID = '1393480748987715706'
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
    .setDescription('Send an announcement to a specific channel')
    .addStringOption(option => option.setName('message').setDescription('The announcement message').setRequired(true)),
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message to a user')
    .addUserOption(option => option.setName('user').setDescription('The user to DM').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message content').setRequired(true))
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
  client.user.setPresence({
    activities: [{ name: 'Windsor Castle RP', type: 3 }], // Watching
    status: 'online'
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ssu') {
    const ssuSsdChannel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
    const startTime = new Date();

    const ssuEmbed = new EmbedBuilder()
      .setTitle('Windsor Castle RP — Server Start Up')
      .setColor('#0047AB')
      .setDescription(
        `Welcome to Windsor Castle Roleplay!

The server is now online and ready for session.

Please ensure you’re familiar with the rules and ready to engage respectfully and fairly with all members.

**Remember:**
- Follow the chain of command
- Keep communications clear and respectful
- Report any issues to staff promptly
- Stay immersive and enjoy the experience!`
      )
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP | Server Status' })
      .setTimestamp(startTime);

    await interaction.reply({ content: `✅ SSU posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [ssuEmbed] });

  } else if (interaction.commandName === 'ssd') {
    const ssuSsdChannel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
    const shutdownTime = new Date();

    const ssdEmbed = new EmbedBuilder()
      .setTitle('Windsor Castle RP — Server Shut Down')
      .setColor('#0047AB')
      .setDescription(
        `The server is now going offline.

Thank you all for your time and dedication today.
Please log off safely and remember to follow up on any pending tasks or reports.

We look forward to seeing you back soon for another immersive session.`
      )
      .setThumbnail(imageURL)
      .setFooter({ text: 'Windsor Castle RP | Server Status' })
      .setTimestamp(shutdownTime);

    await interaction.reply({ content: `✅ SSD posted in <#${SSU_SSD_CHANNEL_ID}>`, ephemeral: true });
    await ssuSsdChannel.send({ embeds: [ssdEmbed] });

  } else if (interaction.commandName === 'discordrules') {
    const rulesChannel = await client.channels.fetch(RULES_CHANNEL_ID);

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
        { name: 'Rule 13 - Channel Misuse', value: 'Channel misuse is prohibited, e.g. sending commands in main chats or side chatting in bot commands channel.' }
      )
      .setFooter({ text: 'Please adhere to all rules to maintain a friendly community.' })
      .setTimestamp();

    await interaction.reply({ content: `📘 Rules posted in <#${RULES_CHANNEL_ID}>`, ephemeral: true });
    await rulesChannel.send({ embeds: [embed] });

  } else if (interaction.commandName === 'announce') {
    const message = interaction.options.getString('message');
    const channel = await client.channels.fetch(SSU_SSD_CHANNEL_ID);
    await channel.send(`📢 ${message}`);
    await interaction.reply({ content: '✅ Announcement sent.', ephemeral: true });
  } else if (interaction.commandName === 'dm') {
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');
    try {
      await user.send(message);
      await interaction.reply({ content: `📨 Message sent to ${user.tag}`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: '❌ Failed to send DM.', ephemeral: true });
    }
  }
});

client.login(DISCORD_TOKEN);
