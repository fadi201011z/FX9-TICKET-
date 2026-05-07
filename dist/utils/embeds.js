"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOR = void 0;
exports.panelEmbed = panelEmbed;
exports.panelMenu = panelMenu;
exports.ticketEmbed = ticketEmbed;
exports.ticketButtons = ticketButtons;
exports.ratingEmbed = ratingEmbed;
exports.ratingButtons = ratingButtons;
exports.logEmbed = logEmbed;
exports.inactivityEmbed = inactivityEmbed;
exports.successEmbed = successEmbed;
exports.errorEmbed = errorEmbed;
const discord_js_1 = require("discord.js");
const index_js_1 = require("../types/index.js");
exports.COLOR = {
    blue: 0x1a6fff,
    black: 0x0d0d0d,
    red: 0xe53935,
    white: 0xffffff,
    gold: 0xffd700,
    green: 0x00c853,
    orange: 0xff9800,
    purple: 0x7c4dff,
};
const CATEGORY_COLOR = {
    technical: exports.COLOR.blue,
    complaint: exports.COLOR.red,
    partnership: exports.COLOR.green,
    other: exports.COLOR.gold,
};
// ── Panel ─────────────────────────────────────────────────────────────────────
function panelEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setColor(0x0099FF) // اللون الأزرق الاحترافي (Deep Azure)
        .setTitle("〉FX9 Ticket Tool🎫 — مـركـز الـدعم الـفني")
        .setDescription([
        "### 〉مرحباً بك في واجهة التحكم ",
        "نحن هنا لضمان تقديم أفضل خدمة لك. يرجى اختيار القسم المناسب من القائمة بالأسفل لبدء المحادثة مع فريق العمل المختص.",
        "",
        "**◈ الأقسام المتاحة حالياً :**",
        "```",
        "🛠️ | الدعم التقني   • للمشاكل والأخطاء التقنية",
        "🚫 | البلاغات      • لتقديم الشكاوى الرسمية",
        "🤝 | الشراكات     • لعروض التعاون والاستضافة",
        "❓ | استفسارات عامة • لأي سؤال أو مساعدة أخرى",
        "```",
        "",
        "**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**",
        "### 〉إرشادات هامة",
        "> 💡 **وضوح الطلب:** يرجى كتابة تفاصيل مشكلتك فور فتح التذكرة لسرعة الرد.",
        "> ⏱️ **وقت الاستجابة:** يعمل فريقنا على الرد خلال مدة أقصاها **24 ساعة**.",
        "> 🔒 **الخصوصية:** محادثتك خاصة تماماً ولا يراها إلا المسؤولين.",
        "**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**",
        "",
        "**｢ اضغط على الزر المناسب بالأسفل لفتح تذكرة جديدة ｣**"
    ].join("\n"))
        .setFooter({
        text: "FX9 Ticket Tool🎫 • نظام الدعم الفني حد",
    })
        .setTimestamp();
}
function panelMenu() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("ticket_category")
        .setPlaceholder("📋 اختر نوع طلبك لفتح تكت...")
        .addOptions(new discord_js_1.StringSelectMenuOptionBuilder().setLabel("دعم فني").setDescription("مشاكل تقنية وأعطال").setValue("technical").setEmoji("🛠️"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("شكاوى").setDescription("الإبلاغ عن تصرف أو مشكلة").setValue("complaint").setEmoji("🚫"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("شراكات").setDescription("عروض تعاون وشراكة").setValue("partnership").setEmoji("🤝"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("أخرى").setDescription("استفسارات لا تندرج في الأقسام أعلاه").setValue("other").setEmoji("❓")));
}
// ── Ticket ────────────────────────────────────────────────────────────────────
function ticketEmbed(t, adminChannel = false) {
    const PRIORITY_LABEL = { high: "🔴 عالية", medium: "🟡 متوسطة", low: "🟢 منخفضة" };
    return new discord_js_1.EmbedBuilder()
        .setColor(adminChannel ? exports.COLOR.purple : (CATEGORY_COLOR[t.category] ?? exports.COLOR.blue))
        .setTitle(adminChannel
        ? `🔐 [إداري] ${t.ticketId} — ${index_js_1.CATEGORY_LABEL[t.category] ?? t.category}`
        : `🎫 ${t.ticketId} — ${index_js_1.CATEGORY_LABEL[t.category] ?? t.category}`)
        .setDescription([
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        adminChannel
            ? "**⚠️ هذه القناة للإدارة فقط — اكتب ردك هنا وسيصل للعضو تلقائياً**"
            : "**✅ تم فتح تكتك — فريق الدعم سيتواصل معك قريباً**",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `**👤 العضو:** <@${t.userId}> \`(${t.username})\``,
        `**📂 القسم:** ${index_js_1.CATEGORY_LABEL[t.category] ?? t.category}`,
        `**🎯 الأولوية:** ${PRIORITY_LABEL[t.priority]}`,
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "**📌 العنوان:**",
        `> ${t.title}`,
        "",
        "**📝 الوصف:**",
        `> ${t.description}`,
        t.evidence ? `\n**🔗 الأدلة:**\n> ${t.evidence}` : "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].filter(Boolean).join("\n"))
        .setFooter({ text: adminChannel ? "FX9 Support System • Admin View" : "FX9 Support System • User View" })
        .setTimestamp();
}
/**
 * @param adminMode - إذا true يُضاف Quick Reply (للقناة الإدارية فقط)
 */
function ticketButtons(claimed, claimedByUsername, adminMode = false) {
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("ticket_claim")
        .setLabel(claimed ? `✅ ${claimedByUsername ?? "مستلم"}` : "📩 Claim")
        .setStyle(claimed ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Primary)
        .setDisabled(claimed), new discord_js_1.ButtonBuilder().setCustomId("ticket_unclaim").setLabel("📤 Unclaim").setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(!claimed), new discord_js_1.ButtonBuilder().setCustomId("ticket_rename").setLabel("✏️ Rename").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Close").setStyle(discord_js_1.ButtonStyle.Danger));
    const rows = [row1];
    // Quick Reply يظهر فقط في القناة الإدارية أو عند عدم وجود قناة إدارية
    if (adminMode) {
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("ticket_quickreply")
            .setPlaceholder("📋 Quick Reply — اختر رداً سريعاً...")
            .addOptions(new discord_js_1.StringSelectMenuOptionBuilder().setLabel("قيد المراجعة").setDescription("نراجع طلبك حالياً").setValue("reviewing").setEmoji("🔍"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("طلب أدلة").setDescription("طلب صور أو أدلة إضافية").setValue("need_evidence").setEmoji("📸"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("تم الحل").setDescription("تم حل المشكلة").setValue("resolved").setEmoji("✅"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("يرجى التوضيح").setDescription("نحتاج توضيحاً إضافياً").setValue("clarify").setEmoji("❓"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("شكراً للتواصل").setDescription("رسالة ترحيب وشكر").setValue("thanks").setEmoji("🙏"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("سيتم التحويل").setDescription("تحويل الطلب لجهة أخرى").setValue("transfer").setEmoji("🔄"), new discord_js_1.StringSelectMenuOptionBuilder().setLabel("مشكلة معروفة").setDescription("نعمل على حلها حالياً").setValue("known_issue").setEmoji("⚠️")));
        rows.push(row2);
    }
    return rows;
}
// ── Rating ────────────────────────────────────────────────────────────────────
function ratingEmbed(ticketId, adminUsername) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLOR.gold)
        .setTitle("⭐  كيف كانت تجربتك مع الدعم؟")
        .setDescription([
        "```",
        "  شكراً لتواصلك مع FX9 Support  ",
        "```",
        adminUsername ? `\nالإداري الذي ساعدك: **${adminUsername}**` : "",
        "",
        "**قيّم تجربتك من ١ إلى ٥ نجوم:**",
        "",
        "> ⭐ — تجربة ضعيفة جداً",
        "> ⭐⭐ — تجربة ضعيفة",
        "> ⭐⭐⭐ — تجربة مقبولة",
        "> ⭐⭐⭐⭐ — تجربة جيدة",
        "> ⭐⭐⭐⭐⭐ — تجربة ممتازة",
        "",
        `> *رقم التكت: \`${ticketId}\`*`,
        "\n> 💙 تقييمك يساعدنا على تحسين جودة الخدمة.",
    ].filter(Boolean).join("\n"))
        .setFooter({ text: "FX9 Support System • Feedback" });
}
function ratingButtons(ticketId) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`rate_1_${ticketId}`).setLabel("⭐ 1").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId(`rate_2_${ticketId}`).setLabel("⭐ 2").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId(`rate_3_${ticketId}`).setLabel("⭐ 3").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId(`rate_4_${ticketId}`).setLabel("⭐ 4").setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId(`rate_5_${ticketId}`).setLabel("⭐ 5").setStyle(discord_js_1.ButtonStyle.Success));
}
// ── Log / Misc ────────────────────────────────────────────────────────────────
function logEmbed(title, color, fields) {
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(`📋 ${title}`)
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: "FX9 Support System • Log" });
}
function inactivityEmbed(ticketId) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLOR.orange)
        .setTitle("⚠️ تحذير خمول التكت")
        .setDescription([
        `**رقم التكت: \`${ticketId}\`**`,
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "⏰ لم يتم إرسال أي رسائل منذ **24 ساعة**.",
        "",
        "إذا لم يكن هناك نشاط خلال **12 ساعة إضافية** سيُغلق التكت تلقائياً.",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "> يرجى الرد إذا كنت لا تزال تحتاج للمساعدة.",
    ].join("\n"))
        .setFooter({ text: "FX9 Support System • Inactivity Warning" })
        .setTimestamp();
}
function successEmbed(desc) {
    return new discord_js_1.EmbedBuilder().setColor(exports.COLOR.green).setTitle("✅ تم بنجاح").setDescription(desc).setTimestamp();
}
function errorEmbed(desc) {
    return new discord_js_1.EmbedBuilder().setColor(exports.COLOR.red).setTitle("❌ خطأ").setDescription(desc).setTimestamp();
}
