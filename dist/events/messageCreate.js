"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const inactivityHandler_js_1 = require("../handlers/inactivityHandler.js");
const db_js_1 = require("../data/db.js");
// ── تنسيق الرسالة كنص احترافي ────────────────────────────────────────────────
function formatUserRelay(msg) {
    const parts = [];
    parts.push(`📩 **${msg.author.username}:** ${msg.content || ""}`);
    if (msg.attachments.size > 0) {
        for (const att of msg.attachments.values()) {
            parts.push(att.url);
        }
    }
    return parts.join("\n");
}
async function formatAdminRelay(msg, guildId, client) {
    const parts = [];
    // جلب رتب الإداري
    let roleDisplay = "";
    try {
        const guild = client.guilds.cache.get(guildId);
        const member = guild ? await guild.members.fetch(msg.author.id) : null;
        if (member) {
            const config = (0, db_js_1.getGuildConfig)(guildId);
            // 1. جلب الرتبة المضافة في الإعدادات (إذا وجدت) لتعطيها الأولوية
            const supportRoleId = config.supportRoleIds.find((id) => member.roles.cache.has(id));
            if (supportRoleId) {
                const roleName = member.roles.cache.get(supportRoleId)?.name;
                roleDisplay = `[${roleName}] `;
            }
            // 2. إذا لم تكن الرتبة مضافة في الإعدادات، نجلب "أعلى رتبة" لدى الشخص
            else {
                // فلترة الرتب لتجنب جلب رتبة "@everyone"
                const highestRole = member.roles.highest;
                if (highestRole && highestRole.name !== "@everyone") {
                    roleDisplay = `[${highestRole.name}] `;
                }
                else {
                    roleDisplay = "[STAFF] "; // لقب احتياطي جداً في حال عدم وجود رتب
                }
            }
        }
    }
    catch { }
    parts.push(`📨 **${roleDisplay}${msg.author.username}:** ${msg.content || ""}`);
    if (msg.attachments.size > 0) {
        for (const att of msg.attachments.values()) {
            parts.push(att.url);
        }
    }
    return parts.join("\n");
}
// ── المعالج الرئيسي ────────────────────────────────────────────────────────
async function handleMessage(client, message) {
    if (message.author.bot || !message.guildId)
        return;
    if (!message.content && message.attachments.size === 0)
        return;
    const guildId = message.guildId;
    // ── رسالة من قناة العضو → أرسلها لقناة الإدارة ──────────────────────────
    const userTicket = (0, db_js_1.getTicket)(message.channelId);
    if (userTicket && userTicket.status !== "closed" && userTicket.adminChannelId) {
        (0, inactivityHandler_js_1.updateTicketActivity)(message.channelId);
        try {
            const adminCh = (await client.channels.fetch(userTicket.adminChannelId).catch(() => null));
            if (adminCh) {
                await adminCh.send(formatUserRelay(message));
            }
        }
        catch { }
        return;
    }
    // ── رسالة من قناة الإدارة → أرسلها لقناة العضو ──────────────────────────
    const adminTicket = (0, db_js_1.getTicketByAdminChannel)(message.channelId);
    if (adminTicket && adminTicket.status !== "closed") {
        // تحقق أن المرسل من فريق الدعم
        const config = (0, db_js_1.getGuildConfig)(guildId);
        try {
            const guild = client.guilds.cache.get(guildId);
            const member = guild ? await guild.members.fetch(message.author.id).catch(() => null) : null;
            if (!member)
                return;
            const isSupport = member.permissions.has(8n) || // ADMINISTRATOR
                member.permissions.has(16n) || // MANAGE_CHANNELS
                config.supportRoleIds.some((id) => member.roles.cache.has(id));
            if (!isSupport)
                return;
            const userCh = (await client.channels.fetch(adminTicket.channelId).catch(() => null));
            if (userCh) {
                const text = await formatAdminRelay(message, guildId, client);
                await userCh.send(text);
                (0, inactivityHandler_js_1.updateTicketActivity)(adminTicket.channelId);
                // لا نحذف رسالة الإداري — تبقى في قناته للمرجعية
            }
        }
        catch { }
        return;
    }
    // ── تكت بقناة واحدة فقط ─────────────────────────────────────────────────
    if (userTicket && userTicket.status !== "closed") {
        (0, inactivityHandler_js_1.updateTicketActivity)(message.channelId);
    }
}
