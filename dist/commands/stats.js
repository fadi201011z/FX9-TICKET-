"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const db_js_1 = require("../data/db.js");
const embeds_js_1 = require("../utils/embeds.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("stats")
    .setDescription("📊 إحصائيات نظام التكتات FX9")
    .setDefaultMemberPermissions(discord_js_1.PermissionsBitField.Flags.ManageChannels);
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;
    const config = (0, db_js_1.getGuildConfig)(guildId);
    const open = (0, db_js_1.getAllOpenTickets)(guildId);
    const all = (0, db_js_1.getAllTickets)(guildId);
    const closed = (0, db_js_1.getClosedTicketsCount)(guildId);
    const rated = all.filter((t) => t.rating !== undefined);
    const avgRating = rated.length > 0
        ? rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length
        : 0;
    const top5 = (0, db_js_1.getAllAdminStats)()
        .filter((s) => s.ratingCount > 0)
        .sort((a, b) => (b.totalRating / b.ratingCount) - (a.totalRating / a.ratingCount))
        .slice(0, 5);
    const catCount = { technical: 0, complaint: 0, partnership: 0, other: 0 };
    for (const t of all)
        catCount[t.category] = (catCount[t.category] ?? 0) + 1;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_js_1.COLOR.blue)
        .setTitle("📊 إحصائيات FX9 Ticket System")
        .setDescription("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        .addFields({ name: "🟢 مفتوحة", value: `**${open.length}**`, inline: true }, { name: "📩 Claimed", value: `**${open.filter((t) => t.status === "claimed").length}**`, inline: true }, { name: "🔒 مغلقة", value: `**${closed}**`, inline: true }, { name: "📁 الإجمالي", value: `**${all.length}**`, inline: true }, { name: "⭐ متوسط التقييم", value: rated.length > 0 ? `**${avgRating.toFixed(1)}/5** (${rated.length})` : "لا يوجد", inline: true }, { name: "🛡️ رتب الدعم", value: `**${config.supportRoleIds.length}**`, inline: true }, { name: "🔐 نظام الريلاي", value: config.adminCategoryId ? "✅ مفعّل" : "❌ معطّل", inline: true }, {
        name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📂 توزيع الأقسام",
        value: [
            `🛠️ دعم فني: **${catCount.technical ?? 0}**`,
            `🚫 شكاوى: **${catCount.complaint ?? 0}**`,
            `🤝 شراكات: **${catCount.partnership ?? 0}**`,
            `❓ أخرى: **${catCount.other ?? 0}**`,
        ].join(" | "),
    });
    if (top5.length > 0) {
        const medals = ["🥇", "🥈", "🥉", "`4.`", "`5.`"];
        embed.addFields({
            name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏆 أفضل المشرفين تقييماً",
            value: top5
                .map((s, i) => `${medals[i]} <@${s.adminId}> — ⭐ **${(s.totalRating / s.ratingCount).toFixed(1)}**/5 | 📩 ${s.claimed ?? 0} | 🔒 ${s.closed ?? 0}`)
                .join("\n"),
        });
    }
    embed.setFooter({ text: "FX9 Support System • Statistics" }).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
