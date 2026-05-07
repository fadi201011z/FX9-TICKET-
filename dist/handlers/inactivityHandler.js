"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startInactivityMonitor = startInactivityMonitor;
exports.updateTicketActivity = updateTicketActivity;
const db_js_1 = require("../data/db.js");
const embeds_js_1 = require("../utils/embeds.js");
const WARN_MS = 24 * 60 * 60 * 1000;
const CLOSE_MS = 36 * 60 * 60 * 1000;
function startInactivityMonitor(client) {
    setInterval(() => checkAll(client), 30 * 60 * 1000);
    console.log("  ⏰  مراقب الخمول يعمل (فحص كل 30 دقيقة)");
}
function updateTicketActivity(channelId) {
    const t = (0, db_js_1.getTicket)(channelId);
    if (t && t.status !== "closed") {
        t.lastActivity = Date.now();
        t.inactivityWarned = false;
        (0, db_js_1.saveTicket)(t);
    }
}
async function checkAll(client) {
    const now = Date.now();
    for (const guild of client.guilds.cache.values()) {
        for (const ticket of (0, db_js_1.getAllOpenTickets)(guild.id)) {
            const elapsed = now - ticket.lastActivity;
            if (elapsed >= CLOSE_MS)
                await autoClose(client, ticket);
            else if (elapsed >= WARN_MS && !ticket.inactivityWarned)
                await warn(client, ticket);
        }
    }
}
async function warn(client, ticket) {
    try {
        const ch = client.channels.cache.get(ticket.channelId);
        if (!ch)
            return;
        ticket.inactivityWarned = true;
        (0, db_js_1.saveTicket)(ticket);
        await ch.send({ content: `<@${ticket.userId}>`, embeds: [(0, embeds_js_1.inactivityEmbed)(ticket.ticketId)] });
        // أرسل في قناة الإدارة أيضاً
        if (ticket.adminChannelId) {
            const adminCh = client.channels.cache.get(ticket.adminChannelId);
            await adminCh?.send({ embeds: [(0, embeds_js_1.inactivityEmbed)(ticket.ticketId)] });
        }
    }
    catch { }
}
async function autoClose(client, ticket) {
    try {
        ticket.status = "closed";
        ticket.closedAt = Date.now();
        (0, db_js_1.saveTicket)(ticket);
        const config = (0, db_js_1.getGuildConfig)(ticket.guildId);
        const embed = (0, embeds_js_1.logEmbed)("🔒 إغلاق تلقائي (خمول)", embeds_js_1.COLOR.red, [
            { name: "رقم التكت", value: ticket.ticketId, inline: true },
            { name: "العضو", value: `<@${ticket.userId}>`, inline: true },
            { name: "السبب", value: "خمول لمدة 36 ساعة" },
        ]);
        const ratingData = {
            embeds: [(0, embeds_js_1.ratingEmbed)(ticket.ticketId, ticket.claimedByUsername)],
            components: [(0, embeds_js_1.ratingButtons)(ticket.ticketId)],
        };
        // محاولة إرسال التقييم بـ DM
        let ratingInChannel = false;
        try {
            const user = await client.users.fetch(ticket.userId);
            await user.send(ratingData);
        }
        catch {
            ratingInChannel = true;
        }
        // قناة العضو
        const userCh = client.channels.cache.get(ticket.channelId);
        if (userCh) {
            await userCh.send({ embeds: [embed] });
            if (ratingInChannel) {
                await userCh.send({
                    content: `<@${ticket.userId}> ⭐ **قيّم تجربتك قبل إغلاق هذه القناة** — ستُحذف بعد 30 ثانية:`,
                    ...ratingData,
                });
            }
        }
        // قناة الإدارة
        if (ticket.adminChannelId) {
            const adminCh = client.channels.cache.get(ticket.adminChannelId);
            await adminCh?.send({ embeds: [embed] });
        }
        // لوق
        if (config.logChannelId) {
            const logCh = (await client.channels.fetch(config.logChannelId).catch(() => null));
            await logCh?.send({ embeds: [embed] });
        }
        // حذف القناتين
        const delay = ratingInChannel ? 30_000 : 8_000;
        setTimeout(async () => {
            await userCh?.delete().catch(() => null);
            if (ticket.adminChannelId) {
                const adminCh = client.channels.cache.get(ticket.adminChannelId);
                await adminCh?.delete().catch(() => null);
            }
        }, delay);
    }
    catch (err) {
        console.error("[Inactivity AutoClose]", err);
    }
}
