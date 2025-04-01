import {Client, EmbedBuilder, GatewayIntentBits, TextChannel, ActivityType} from 'discord.js';
import 'dotenv/config';
import {OrderType, OrderStatus, PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
});

const orderTypeToChannelMap: Record<OrderType, string> = {
    KILL_TARGET: '1355186283005345922',        // убийства
    LOGISTICS: '1355186314005315817',          // логистика
    SCAN_WORMHOLE: '1355186341817618664',      // вх скаутинг
    ROUTE_PLANNING: '1355186369831637202',     // роутинг ордерс
    OTHER: '1355186397731885146',              // кастом

    SCOUT_SYSTEM: '1355186341817618664',
    ESCORT: '1355186397731885146',
    STRUCTURE_WORK: '1355186397731885146',
    CHARACTER_INFO: '1355186341817618664',
    COUNTER_INTEL: '1355186341817618664',
    EVENT_FARMING: '1355186397731885146',
    PVP_ASSIST: '1355186283005345922',
};


client.on('ready', () => {
    console.log(`🤖 Discord bot logged in as ${client.user?.tag}`);
    updateBotStatus(); // сразу при запуске
    setInterval(updateBotStatus, 30 * 60 * 1000); // каждые 30 минут
});

const updateBotStatus = async () => {
    try {
        const [activeCount, takenCount] = await Promise.all([
            prisma.order.count({ where: { status: OrderStatus.ACTIVE } }),
            prisma.order.count({ where: { status: OrderStatus.TAKEN } }),
        ]);

        const variants = [
            {
                text: ` ${activeCount} active missions 👀`,
                type: ActivityType.Watching,
            },
            {
                text: ` ${takenCount} taken contracts 📦`,
                type: ActivityType.Watching,
            },
        ];

        const chosen = variants[Math.floor(Math.random() * variants.length)];

        client.user?.setPresence({
            activities: [{
                name: chosen.text,
                type: chosen.type,
            }],
            status: 'online',
        });

        console.log(`✅ Updated bot status: ${chosen.text}`);
    } catch (err) {
        console.error('❌ Failed to update bot status:', err);
    }
};

// 💬 Обработка сообщений
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
        if (message.content === '!ping') {
            await message.reply('pong!');
        }

        const commandChannelId = '1355186482050105506';
        if (message.channel.id !== commandChannelId) return;

        // !say <channelId> <message>
        if (message.content.startsWith('!say')) {
            const args = message.content.trim().split(' ');
            if (args.length < 3) {
                return message.reply('❌ Неверный формат. Используй: `!say <channelId> <текст>`');
            }

            const targetChannelId = args[1];
            const text = args.slice(2).join(' ');

            const targetChannel = await client.channels.fetch(targetChannelId);
            if (!targetChannel?.isTextBased?.()) {
                return message.reply('❌ Указанный канал недоступен или не текстовый.');
            }

            await (targetChannel as any).send(text);
            await message.reply('✅ Сообщение отправлено.');
        }
    } catch (err) {
        console.error('Ошибка в messageCreate:', err);
        try {
            await message.reply('❌ Произошла ошибка при обработке команды.');
        } catch (_) {
        }
    }
});


// ▶️ Старт бота
export const startDiscordBot = async () => {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        console.error('❌ DISCORD_TOKEN not found in .env');
        return;
    }

    try {
        await client.login(token);
    } catch (err) {
        console.error('❌ Ошибка при логине Discord-бота:', err);
    }
};

export const setNickname = async (discordId: string, nickname: string) => {
    const guild = client.guilds.cache.get('YOUR_GUILD_ID');
    if (!guild) throw new Error('Guild not found');

    try {
        const member = await guild.members.fetch(discordId);
        if (!member) throw new Error('Member not found');

        await member.setNickname(nickname);
        console.log(`Nickname for ${discordId} set to ${nickname}`);
    } catch (err) {
        console.error('Error setting nickname:', err);
        throw err;
    }
};

// ✅ Добавление в гильдию с ролью
export const addUserToGuildWithRole = async (userId: string, accessToken: string) => {
    const guildId = process.env.DISCORD_GUILD_ID;
    const roleId = '1355171909649698906';

    if (!guildId) {
        console.error('❌ DISCORD_GUILD_ID not найден в .env');
        return;
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.members.add(userId, { accessToken });

        const member = await guild.members.fetch(userId);
        await member.roles.add(roleId);
        console.log(`✅ Добавлен ${member.user.tag} в гильдию с ролью`);
    } catch (error) {
        console.error('❌ Failed to add user to guild or assign role:', error);
    }
};

// 💬 ЛС пользователю
export const sendDM = async (userId: string, message: string) => {
    try {
        const user = await client.users.fetch(userId);
        if (!user) throw new Error('User not found');

        await user.send({ content: message });
        console.log(`✅ DM sent to ${user.tag}`);
    } catch (error) {
        console.error(`❌ Failed to send DM to ${userId}:`, error);
    }
};

export const announceNewOrder = async (
    order: {
        id: string;
        type: OrderType;
        title: string;
        price: number;
        deadline?: string; // 👈 ISO строка, необязательно
    }
) => {
    const channelId = orderTypeToChannelMap[order.type];
    if (!channelId) {
        console.warn(`❗ No channel configured for order type: ${order.type}`);
        return;
    }

    const categoryLabel = order.type
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased?.()) {
            console.warn(`❌ Channel ${channelId} is not text-based`);
            return;
        }

        const orderLink = `https://localhost:3000/order?orderId=${order.id}`; // ← замени на свой домен

        const fields = [
            { name: '🗂 Category', value: categoryLabel, inline: true },
            { name: '💰 Reward', value: `${order.price.toLocaleString()} ISK`, inline: true },
            { name: '📝 Title', value: order.title },
            { name: '🔗 Link', value: `[View Order](${orderLink})` },
        ];

        if (order.deadline) {
            const deadlineDate = new Date(order.deadline);
            const unixTimestamp = Math.floor(deadlineDate.getTime() / 1000);
            fields.push({
                name: '⏳ Deadline',
                value: `<t:${unixTimestamp}:R>`, // ⏱ in 2 hours, in 3 days, etc
                inline: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📦 New Order Received')
            .addFields(fields)
            .setColor(0x0099ff)
            .setTimestamp();

        await (channel as TextChannel).send({ embeds: [embed] });
        console.log(`✅ Posted new ${order.type} order to channel ${channelId}`);
    } catch (err) {
        console.error('❌ Failed to post new order:', err);
    }
};

export const sendToLogChannel = async (content: string) => {
    try {
        const channel = await client.channels.fetch('1356463829755756595');

        if (channel && channel.isTextBased?.()) {
            await (channel as TextChannel).send(content);
        } else {
            console.warn('❌ Канал недоступен или не текстовый');
        }
    } catch (err) {
        console.error('❌ Ошибка при отправке лога в Discord:', err);
    }
};