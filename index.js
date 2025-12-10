// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const QRIS_URL = process.env.QRIS_URL;
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID || null; // e.g. "1447897488106455065"
const OWNER_ID = process.env.OWNER_ID || null; // optional pemilik bot selalu boleh
const PREFIX = process.env.PREFIX || '!';

if (!TOKEN) {
  console.error('ERROR: DISCORD_TOKEN belum diset di environment variables.');
  process.exit(1);
}
if (!QRIS_URL) {
  console.error('ERROR: QRIS_URL belum diset di environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag} (${client.user.id})`);
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase();

    if (cmd !== 'qris') return;

    // Perintah hanya boleh di server (guild)
    if (!message.guild) {
      return message.reply('Perintah ini hanya dapat dipakai di server, bukan DM.');
    }

    const member = message.member;
    if (!member) {
      return message.reply('Gagal memeriksa peran Anda. Coba lagi nanti.');
    }

    // OWNER override (opsional)
    if (OWNER_ID && message.author.id === OWNER_ID) {
      // pemilik bot diizinkan
    } else {
      // Periksa apakah user punya role ID yang diizinkan atau permission Administrator
      const hasRole = ADMIN_ROLE_ID ? member.roles.cache.has(ADMIN_ROLE_ID) : false;
      const isAdminPerm = member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasRole && !isAdminPerm) {
        return message.reply('Kamu tidak punya izin menjalankan perintah ini. (Role admin dibutuhkan)');
      }
    }

    // Buat embed dengan gambar QRIS (URL)
    const embed = new EmbedBuilder()
      .setTitle('QRIS')
      .setDescription('Silakan scan QRIS berikut untuk pembayaran.')
      .setImage(QRIS_URL)
      .setFooter({ text: `Diminta oleh ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ forceStatic: false }) })
      .setTimestamp();

    // Kirim embed
    await message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Error saat memproses !qris:', err);
    try { await message.reply('Terjadi kesalahan saat mencoba mengirim QRIS.'); } catch (e) {}
  }
});

client.login(TOKEN).catch(err => {
  console.error('Failed to login:', err);
  process.exit(1);
});
