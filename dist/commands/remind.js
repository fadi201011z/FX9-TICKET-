"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const db_js_1 = require("../data/db.js");
const embeds_js_1 = require("../utils/embeds.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("remind")
    .setDescription("⏰ تذكير العضو بالرد على التكت")
    .setDefaultMemberPermissions(discord_js_1.PermissionsBitField.Flags.ManageChannels)
    .addStringOption((o) => o.setName("message")
    .setDescription("رسالة مخصصة للتذكير (اختياري)")
    .setRequired(false)
    .setMaxLength(300));
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    // البحث عن التكت في القناة الحالية أو قناة الإدارة
    const ticket = (0, db_js_1.getTicket)(interaction.channelId) ??
        (0, db_js_1.getTicketByAdminChannel)(interaction.channelId);
    if (!ticket) {
        await interaction.editReply({ content: "❌ هذا الأمر يعمل فقط داخل قناة تكت." });
        return;
    }
    if (ticket.status === "closed") {
        await interaction.editReply({ content: "❌ التكت مغلق." });
        return;
    }
    const config = (0, db_js_1.getGuildConfig)(interaction.guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isSupport = member.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageChannels) ||
        config.supportRoleIds.some((id) => member.roles.cache.has(id));
    if (!isSupport) {
        await interaction.editReply({ content: "❌ هذا الأمر لفريق الدعم فقط." });
        return;
    }
    const custom = interaction.options.getString("message");
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_js_1.COLOR.orange)
        .setTitle("⏰ تذكير — يرجى الرد")
        .setDescription([
        `<@${ticket.userId}>`,
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        custom
            ? `📣 **رسالة من فريق الدعم:**\n> ${custom}`
            : "📣 **فريق الدعم بانتظار ردك على هذا التكت.**\nيرجى الرد في أقرب وقت ممكن.",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `> رقم التكت: \`${ticket.ticketId}\``,
        "> إذا لم يكن هناك رد سيُغلق التكت تلقائياً.",
    ].join("\n"))
        .setFooter({ text: `بواسطة: ${interaction.user.username} • FX9 Support` })
        .setTimestamp();
    // إرسال في قناة العضو دائماً
    const userCh = interaction.client.channels.cache.get(ticket.channelId);
    if (userCh) {
        await userCh.send({ content: `<@${ticket.userId}>`, embeds: [embed] });
    }
    // إرسال في قناة الإدارة إن وُجدت
    if (ticket.adminChannelId) {
        const adminCh = interaction.client.channels.cache.get(ticket.adminChannelId);
        await adminCh?.send({ embeds: [embed] });
    }
    await interaction.editReply({ content: `✅ تم إرسال التذكير لـ <@${ticket.userId}>` });
}
