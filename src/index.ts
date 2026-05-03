import "dotenv/config";
import { ActivityType } from "discord.js";
import { createClient } from "./bot.js";
import { loadCommands, handleInteraction } from "./events/interactionCreate.js";
import { handleMessage } from "./events/messageCreate.js";
import { startInactivityMonitor } from "./handlers/inactivityHandler.js";
import http from "node:http";

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

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("FX9 Bot is Online! ✅");
}).listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Web Server: Listening on port ${PORT} (Render Fix)`);
});

// ── تشغيل البوت ───────────────────────────────────────────────────────────
const client = createClient();

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
        type: ActivityType.Watching,
      },
    ],
  });

  await loadCommands();
  startInactivityMonitor(client);

  console.log("  🎫  نظام التكتات يعمل بكفاءة");
  console.log("  👁️  الحالة الآن: Online");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

// ── المستمعين للأحداث ──────────────────────────────────────────────────────
client.on("interactionCreate", (i) => handleInteraction(client, i));
client.on("messageCreate", (m) => handleMessage(client, m));

// ── معالجة الأخطاء لضمان عدم توقف البوت ────────────────────────────────────
client.on("error", (err) => console.error("[Bot Error]", err.message));
process.on("unhandledRejection", (err) => console.error("[Rejection]", err));
process.on("SIGTERM", () => { client.destroy(); process.exit(0); });
process.on("SIGINT", () => { client.destroy(); process.exit(0); });

client.login(TOKEN);