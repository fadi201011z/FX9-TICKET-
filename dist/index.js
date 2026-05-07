"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const bot_js_1 = require("./bot.js");
const interactionCreate_js_1 = require("./events/interactionCreate.js");
const messageCreate_js_1 = require("./events/messageCreate.js");
const inactivityHandler_js_1 = require("./handlers/inactivityHandler.js");
const node_http_1 = __importDefault(require("node:http"));
// ── التحقق من التوكن ──────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  ❌  DISCORD_BOT_TOKEN غير موجود في الإعدادات!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
}
// ── حل مشكلة الـ Port في Render (الخطة المجانية) ──────────────────────────
// تحويل القيمة إلى Number لضمان توافق TypeScript
const PORT = Number(process.env.PORT) || 10000;
node_http_1.default.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("FX9 Bot is Online! ✅");
}).listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Web Server: Listening on port ${PORT} (Render Fix)`);
});
// ── تشغيل البوت ───────────────────────────────────────────────────────────
const client = (0, bot_js_1.createClient)();
// استخدام الحدث ready (أو clientReady إذا أردت التحديث مستقبلاً)
client.once("ready", async (c) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  ✅  FX9 Bot — ${c.user.tag}`);
    console.log(`  📡  متصل بـ ${c.guilds.cache.size} سيرفر`);
    // تعيين حالة البوت
    c.user.setPresence({
        status: "online",
        activities: [
            {
                name: "🎫 FX9 Support | /helpt",
                type: discord_js_1.ActivityType.Watching,
            },
        ],
    });
    await (0, interactionCreate_js_1.loadCommands)();
    (0, inactivityHandler_js_1.startInactivityMonitor)(client);
    console.log("  🎫  نظام التكتات يعمل بكفاءة");
    console.log("  👁️  الحالة الآن: Online");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
// ── المستمعين للأحداث ──────────────────────────────────────────────────────
client.on("interactionCreate", (i) => (0, interactionCreate_js_1.handleInteraction)(client, i));
client.on("messageCreate", (m) => (0, messageCreate_js_1.handleMessage)(client, m));
// ── معالجة الأخطاء لضمان عدم توقف البوت ────────────────────────────────────
client.on("error", (err) => console.error("[Bot Error]", err.message));
process.on("unhandledRejection", (err) => console.error("[Rejection]", err));
process.on("SIGTERM", () => { client.destroy(); process.exit(0); });
process.on("SIGINT", () => { client.destroy(); process.exit(0); });
client.login(TOKEN);
