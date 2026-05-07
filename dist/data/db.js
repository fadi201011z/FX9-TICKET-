"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadData = loadData;
exports.saveData = saveData;
exports.getGuildConfig = getGuildConfig;
exports.saveGuildConfig = saveGuildConfig;
exports.hasSupport = hasSupport;
exports.getTicket = getTicket;
exports.getTicketByAdminChannel = getTicketByAdminChannel;
exports.getTicketByUser = getTicketByUser;
exports.saveTicket = saveTicket;
exports.getAllOpenTickets = getAllOpenTickets;
exports.getAllTickets = getAllTickets;
exports.getClosedTicketsCount = getClosedTicketsCount;
exports.getAdminStats = getAdminStats;
exports.saveAdminStats = saveAdminStats;
exports.getAllAdminStats = getAllAdminStats;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = path_1.default.join(process.cwd(), "data", "fx9_data.json");
const DEFAULT = { guilds: {}, tickets: {}, adminStats: {} };
function loadData() {
    try {
        if (!fs_extra_1.default.existsSync(DATA_FILE)) {
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(DATA_FILE));
            fs_extra_1.default.writeJsonSync(DATA_FILE, DEFAULT, { spaces: 2 });
            return structuredClone(DEFAULT);
        }
        const raw = fs_extra_1.default.readJsonSync(DATA_FILE);
        // Migrate old single supportRoleId to array
        for (const cfg of Object.values(raw.guilds)) {
            if (!cfg.supportRoleIds) {
                cfg.supportRoleIds = cfg.supportRoleId ? [cfg.supportRoleId] : [];
                delete cfg.supportRoleId;
            }
        }
        return raw;
    }
    catch {
        return structuredClone(DEFAULT);
    }
}
function saveData(data) {
    fs_extra_1.default.ensureDirSync(path_1.default.dirname(DATA_FILE));
    fs_extra_1.default.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}
function getGuildConfig(guildId) {
    const data = loadData();
    if (!data.guilds[guildId]) {
        data.guilds[guildId] = { guildId, supportRoleIds: [], ticketCounter: 0 };
        saveData(data);
    }
    if (!data.guilds[guildId].supportRoleIds)
        data.guilds[guildId].supportRoleIds = [];
    return data.guilds[guildId];
}
function saveGuildConfig(config) {
    const data = loadData();
    data.guilds[config.guildId] = config;
    saveData(data);
}
function hasSupport(member, config) {
    const MANAGE_CHANNELS = 16n;
    if (member.permissions.has(MANAGE_CHANNELS))
        return true;
    return config.supportRoleIds.some((id) => member.roles.cache.has(id));
}
function getTicket(channelId) {
    const data = loadData();
    return (Object.values(data.tickets).find((t) => t.channelId === channelId) ??
        null);
}
function getTicketByAdminChannel(channelId) {
    const data = loadData();
    return Object.values(data.tickets).find((t) => t.adminChannelId === channelId) ?? null;
}
function getTicketByUser(guildId, userId) {
    const data = loadData();
    return (Object.values(data.tickets).find((t) => t.guildId === guildId && t.userId === userId && t.status !== "closed") ?? null);
}
function saveTicket(ticket) {
    const data = loadData();
    data.tickets[ticket.ticketId] = ticket;
    saveData(data);
}
function getAllOpenTickets(guildId) {
    return Object.values(loadData().tickets).filter((t) => t.guildId === guildId && t.status !== "closed");
}
function getAllTickets(guildId) {
    return Object.values(loadData().tickets).filter((t) => t.guildId === guildId);
}
function getClosedTicketsCount(guildId) {
    return Object.values(loadData().tickets).filter((t) => t.guildId === guildId && t.status === "closed").length;
}
function getAdminStats(adminId) {
    const data = loadData();
    if (!data.adminStats[adminId]) {
        data.adminStats[adminId] = { adminId, username: "", claimed: 0, closed: 0, totalRating: 0, ratingCount: 0 };
        saveData(data);
    }
    return data.adminStats[adminId];
}
function saveAdminStats(stats) {
    const data = loadData();
    data.adminStats[stats.adminId] = stats;
    saveData(data);
}
function getAllAdminStats() {
    return Object.values(loadData().adminStats);
}
