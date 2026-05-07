"use strict";

/**
 * تسجيل أوامر البوت (Slash Commands) مع Discord
 * شغّل هذا الملف مرة واحدة فقط بعد كل تغيير في الأوامر:
 *   npx tsx src/deploy-commands.ts
 */

Object.defineProperty(exports, "__esModule", { value: true });

require("dotenv/config");

const { REST, Routes } = require("discord.js");

const { data: configt } = require("./commands/configt.js");
const { data: stats } = require("./commands/stats.js");
const { data: panel } = require("./commands/panel.js");
const { data: ratings } = require("./commands/ratings.js");
const { data: ticket } = require("./commands/ticket.js");
const { data: announce } = require("./commands/announce.js");
const { data: helpt } = require("./commands/helpt.js");
const { data: botinfo } = require("./commands/botinfo.js");
const { data: remind } = require("./commands/remind.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  ❌  مطلوب في ملف .env:");
    console.error("      DISCORD_BOT_TOKEN");
    console.error("      DISCORD_CLIENT_ID");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
}

/* =========================================
   جميع الأوامر
========================================= */

const cmds = [
    configt,
    stats,
    panel,
    ratings,
    ticket,
    announce,
    helpt,
    botinfo,
    remind,
].map((c) => c.toJSON());

/* =========================================
   فحص الأوامر المكررة
========================================= */

const names = cmds.map(cmd => cmd.name);

console.log("");
console.log("📋 أسماء الأوامر:");
console.log(names);

const duplicates = names.filter(
    (name, index) => names.indexOf(name) !== index
);

if (duplicates.length > 0) {
    console.error("");
    console.error("❌ يوجد أوامر مكررة:");
    console.error([...new Set(duplicates)]);
    process.exit(1);
}

/* =========================================
   تسجيل الأوامر
========================================= */

const rest = new REST().setToken(TOKEN);

(async () => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  🔄  تسجيل ${cmds.length} أوامر...`);

    if (GUILD_ID) {

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: cmds }
        );

        console.log("  ✅  تم التسجيل في السيرفر (فورية)");

    } else {

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: cmds }
        );

        console.log("  ✅  تم التسجيل عالمياً (قد تأخذ حتى ساعة)");
    }

    console.log("");
    console.log("  📋  الأوامر:");

    cmds.forEach((c, i) => {
        console.log(`     ${i + 1}. /${c.name}`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

})().catch((e) => {
    console.error("❌ فشل:", e);
    process.exit(1);
});