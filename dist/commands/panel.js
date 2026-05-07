"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const embeds_js_1 = require("../utils/embeds.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("panel")
    .setDescription("📋 إرسال بنل التكتات في القناة الحالية")
    .setDefaultMemberPermissions(discord_js_1.PermissionsBitField.Flags.Administrator);
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.channel.send({ embeds: [(0, embeds_js_1.panelEmbed)()], components: [(0, embeds_js_1.panelMenu)()] });
    await interaction.editReply({ content: "✅ تم إرسال البنل بنجاح!" });
}
