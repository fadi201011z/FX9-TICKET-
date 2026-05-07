"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = loadCommands;
exports.handleInteraction = handleInteraction;
const ticketHandler_js_1 = require("../handlers/ticketHandler.js");
const closeHandler_js_1 = require("../handlers/closeHandler.js");
const inactivityHandler_js_1 = require("../handlers/inactivityHandler.js");
const commands = new Map();
async function loadCommands() {
    const mods = await Promise.all([
        Promise.resolve().then(() => __importStar(require("../commands/configt.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/stats.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/panel.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/ratings.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/ticket.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/announce.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/helpt.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/botinfo.js"))),
        Promise.resolve().then(() => __importStar(require("../commands/remind.js"))),
    ]);
    for (const m of mods)
        commands.set(m.data.name, { execute: m.execute });
    console.log(`  📡  ${mods.length} أوامر محمّلة`);
}
async function handleInteraction(client, interaction) {
    try {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const cmd = commands.get(interaction.commandName);
            if (cmd)
                await cmd.execute(interaction);
            return;
        }
        // Select menus
        if (interaction.isStringSelectMenu()) {
            const m = interaction;
            if (m.customId === "ticket_category") {
                await (0, ticketHandler_js_1.handleCategorySelect)(m);
                return;
            }
            if (m.customId === "ticket_quickreply") {
                await (0, ticketHandler_js_1.handleQuickReply)(client, m);
                return;
            }
        }
        // Modals
        if (interaction.isModalSubmit()) {
            const m = interaction;
            if (m.customId.startsWith("ticket_modal_")) {
                await (0, ticketHandler_js_1.handleTicketModalSubmit)(client, m);
                return;
            }
            if (m.customId === "ticket_rename_modal") {
                await (0, ticketHandler_js_1.handleRenameModalSubmit)(client, m);
                return;
            }
        }
        // Buttons
        if (interaction.isButton()) {
            const b = interaction;
            if (b.customId.startsWith("rate_")) {
                await (0, closeHandler_js_1.handleRatingButton)(client, b);
                return;
            }
            (0, inactivityHandler_js_1.updateTicketActivity)(b.channelId);
            switch (b.customId) {
                case "ticket_claim":
                    await (0, ticketHandler_js_1.handleClaimTicket)(client, b);
                    break;
                case "ticket_unclaim":
                    await (0, ticketHandler_js_1.handleUnclaimTicket)(client, b);
                    break;
                case "ticket_rename":
                    await (0, ticketHandler_js_1.handleRenameTicket)(b);
                    break;
                case "ticket_close":
                    await (0, closeHandler_js_1.handleCloseTicket)(client, b);
                    break;
            }
        }
    }
    catch (err) {
        console.error("[Interaction Error]", err);
        try {
            const i = interaction;
            if (i.replied === false && i.deferred === false) {
                await i.reply({ content: "❌ حدث خطأ غير متوقع. يرجى المحاولة مجدداً.", ephemeral: true });
            }
        }
        catch { }
    }
}
