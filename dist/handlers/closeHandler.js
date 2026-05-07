"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCloseTicket = handleCloseTicket;
exports.handleRatingButton = handleRatingButton;
const discord_js_1 = require("discord.js");
const db_js_1 = require("../data/db.js");
const embeds_js_1 = require("../utils/embeds.js");
async function handleCloseTicket(client, interaction) {
    const ticket = (0, db_js_1.getTicket)(interaction.channelId) ?? (0, db_js_1.getTicketByAdminChannel)(interaction.channelId);
    if (!ticket) {
        await interaction.reply({ content: "❌ هذه القناة ليست تكتاً.", ephemeral: true });
        return;
    }
    const config = (0, db_js_1.getGuildConfig)(interaction.guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isAdmin = member.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageChannels) ||
        config.supportRoleIds.some((id) => member.roles.cache.has(id));
    if (!isAdmin && ticket.userId !== interaction.user.id) {
        await interaction.reply({ content: "❌ لا تملك صلاحية إغلاق هذا التكت.", ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    ticket.status = "closed";
    ticket.closedAt = Date.now();
    (0, db_js_1.saveTicket)(ticket);
    if (ticket.claimedBy) {
        const stats = (0, db_js_1.getAdminStats)(ticket.claimedBy);
        stats.username = ticket.claimedByUsername ?? "Unknown";
        stats.closed = (stats.closed ?? 0) + 1;
        (0, db_js_1.saveAdminStats)(stats);
    }
    const closeEmbed = (0, embeds_js_1.logEmbed)("🔒 تم إغلاق التكت", embeds_js_1.COLOR.red, [
        { name: "رقم التكت", value: ticket.ticketId, inline: true },
        { name: "العضو", value: `<@${ticket.userId}>`, inline: true },
        { name: "الإداري", value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : "غير مستلم", inline: true },
        { name: "مُغلق بواسطة", value: `<@${interaction.user.id}>`, inline: true },
        { name: "المدة", value: formatDuration(Date.now() - ticket.openedAt), inline: true },
    ]);
    const ratingPayload = {
        embeds: [(0, embeds_js_1.ratingEmbed)(ticket.ticketId, ticket.claimedByUsername)],
        components: [(0, embeds_js_1.ratingButtons)(ticket.ticketId)],
    };
    // ── محاولة إرسال التقييم بـ DM ──────────────────────────────────────────
    let ratingInChannel = false;
    try {
        const dmUser = await client.users.fetch(ticket.userId, { force: true });
        // فتح DM channel صراحةً لتجنب مشاكل الـ cache
        const dmChannel = await dmUser.createDM();
        await dmChannel.send(ratingPayload);
        // تأكيد النجاح
    }
    catch {
        ratingInChannel = true;
    }
    // ── إرسال embed الإغلاق في قناة العضو ──────────────────────────────────
    const userCh = client.channels.cache.get(ticket.channelId);
    if (userCh) {
        await userCh.send({ embeds: [closeEmbed] });
        if (ratingInChannel) {
            await userCh.send({
                content: `<@${ticket.userId}> ⭐ **قيّم تجربتك قبل إغلاق القناة** — ستُحذف بعد **30 ثانية**:`,
                ...ratingPayload,
            });
        }
    }
    // ── إرسال في قناة الإدارة ───────────────────────────────────────────────
    if (ticket.adminChannelId) {
        const adminCh = client.channels.cache.get(ticket.adminChannelId);
        if (adminCh)
            await adminCh.send({ embeds: [closeEmbed] });
    }
    // ── لوق ──────────────────────────────────────────────────────────────────
    if (config.logChannelId) {
        const logCh = (await client.channels.fetch(config.logChannelId).catch(() => null));
        await logCh?.send({ embeds: [closeEmbed] });
    }
    await interaction.editReply({ content: "✅ سيُغلق التكت خلال لحظات..." });
    const delay = ratingInChannel ? 30_000 : 8_000;
    setTimeout(async () => {
        await userCh?.delete().catch(() => null);
        if (ticket.adminChannelId) {
            const adminCh = client.channels.cache.get(ticket.adminChannelId);
            await adminCh?.delete().catch(() => null);
        }
    }, delay);
}
// ── Rating Button Handler ──────────────────────────────────────────────────────
async function handleRatingButton(client, interaction) {
    const parts = interaction.customId.split("_");
    const rating = parseInt(parts[1]);
    const ticketId = parts.slice(2).join("_");
    const data = (0, db_js_1.loadData)();
    const ticket = Object.values(data.tickets).find((t) => t.ticketId === ticketId);
    if (!ticket) {
        try {
            await interaction.reply({ content: "❌ التكت غير موجود.", ephemeral: true });
        }
        catch { }
        return;
    }
    if (ticket.rating !== undefined) {
        try {
            await interaction.reply({ content: "✅ لقد قيّمت هذا التكت مسبقاً، شكراً.", ephemeral: true });
        }
        catch { }
        return;
    }
    ticket.rating = rating;
    ticket.ratedBy = interaction.user.id;
    data.tickets[ticketId] = ticket;
    (0, db_js_1.saveData)(data);
    if (ticket.claimedBy) {
        const stats = (0, db_js_1.getAdminStats)(ticket.claimedBy);
        stats.totalRating = (stats.totalRating ?? 0) + rating;
        stats.ratingCount = (stats.ratingCount ?? 0) + 1;
        (0, db_js_1.saveAdminStats)(stats);
    }
    const stars = "⭐".repeat(rating);
    const replyMsg = `✨ شكراً! أعطيت **${stars}** (${rating}/5) — تقييمك يساعدنا على تحسين الخدمة.`;
    // محاولة تحديث الرسالة (DM) أو الرد (قناة)
    try {
        await interaction.update({ content: replyMsg, embeds: [], components: [] });
    }
    catch {
        try {
            await interaction.reply({ content: replyMsg, ephemeral: true });
        }
        catch { }
    }
    // لوق التقييم
    try {
        const config = (0, db_js_1.getGuildConfig)(ticket.guildId);
        if (config.logChannelId) {
            const guild = client.guilds.cache.get(ticket.guildId);
            const logCh = guild?.channels.cache.get(config.logChannelId);
            await logCh?.send({
                embeds: [(0, embeds_js_1.logEmbed)("⭐ تقييم جديد", embeds_js_1.COLOR.gold, [
                        { name: "رقم التكت", value: ticket.ticketId, inline: true },
                        { name: "التقييم", value: `${stars} (${rating}/5)`, inline: true },
                        { name: "العضو", value: `<@${ticket.userId}>`, inline: true },
                        { name: "الإداري", value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : "غير مستلم", inline: true },
                    ])],
            });
        }
    }
    catch { }
}
function formatDuration(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}س ${m}د`;
}
