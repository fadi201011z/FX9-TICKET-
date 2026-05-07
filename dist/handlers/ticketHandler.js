"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCategorySelect = handleCategorySelect;
exports.handleTicketModalSubmit = handleTicketModalSubmit;
exports.handleClaimTicket = handleClaimTicket;
exports.handleUnclaimTicket = handleUnclaimTicket;
exports.handleRenameTicket = handleRenameTicket;
exports.handleRenameModalSubmit = handleRenameModalSubmit;
exports.handleQuickReply = handleQuickReply;
const discord_js_1 = require("discord.js");
const db_js_1 = require("../data/db.js");
const embeds_js_1 = require("../utils/embeds.js");
const index_js_1 = require("../types/index.js");
// ── Category Select → open Modal ─────────────────────────────────────────────
async function handleCategorySelect(interaction) {
    const category = interaction.values[0];
    const modal = new discord_js_1.ModalBuilder().setCustomId(`ticket_modal_${category}`).setTitle("📝 تفاصيل طلبك");
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId("title").setLabel("عنوان المشكلة").setStyle(discord_js_1.TextInputStyle.Short).setPlaceholder("اكتب عنواناً مختصراً").setRequired(true).setMaxLength(100)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId("description").setLabel("وصف المشكلة").setStyle(discord_js_1.TextInputStyle.Paragraph).setPlaceholder("اشرح مشكلتك بالتفصيل...").setRequired(true).setMaxLength(1000)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId("evidence").setLabel("رابط الأدلة (اختياري)").setStyle(discord_js_1.TextInputStyle.Short).setPlaceholder("https://...").setRequired(false).setMaxLength(500)));
    await interaction.showModal(modal);
}
// ── Modal Submit → create ticket channels ─────────────────────────────────────
async function handleTicketModalSubmit(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const category = interaction.customId.replace("ticket_modal_", "");
    const { guildId, user } = interaction;
    if (!guildId)
        return;
    const existing = (0, db_js_1.getTicketByUser)(guildId, user.id);
    if (existing) {
        await interaction.editReply({ content: `❌ لديك تكت مفتوح بالفعل: <#${existing.channelId}>\nأغلقه أولاً قبل فتح تكت جديد.` });
        return;
    }
    const config = (0, db_js_1.getGuildConfig)(guildId);
    if (!config.ticketCategoryId) {
        await interaction.editReply({ content: "❌ لم يُعدّ النظام بعد. تواصل مع الإدارة لإعداد `/configt ticket_category`." });
        return;
    }
    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const evidence = interaction.fields.getTextInputValue("evidence") || undefined;
    config.ticketCounter = (config.ticketCounter ?? 0) + 1;
    (0, db_js_1.saveGuildConfig)(config);
    const ticketId = `FX9-${config.ticketCounter.toString().padStart(4, "0")}`;
    const chanName = `${config.ticketCounter}-${index_js_1.CATEGORY_SLUG[category] ?? "تكت"}`;
    const guild = interaction.guild;
    // ── إصلاح مشكلة الـ push (صلاحيات قناة العضو) ───────────────────────────────
    const userOverwrites = [
        { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [discord_js_1.PermissionsBitField.Flags.ViewChannel, discord_js_1.PermissionsBitField.Flags.SendMessages, discord_js_1.PermissionsBitField.Flags.ReadMessageHistory, discord_js_1.PermissionsBitField.Flags.AttachFiles] },
        { id: client.user.id, allow: [discord_js_1.PermissionsBitField.Flags.ViewChannel, discord_js_1.PermissionsBitField.Flags.SendMessages, discord_js_1.PermissionsBitField.Flags.ManageChannels, discord_js_1.PermissionsBitField.Flags.ManageMessages] },
    ];
    if (config.supportRoleIds) {
        for (const roleId of config.supportRoleIds) {
            userOverwrites.push({
                id: roleId,
                allow: [discord_js_1.PermissionsBitField.Flags.ViewChannel, discord_js_1.PermissionsBitField.Flags.ReadMessageHistory],
                deny: [discord_js_1.PermissionsBitField.Flags.SendMessages],
            });
        }
    }
    const userChannel = await guild.channels.create({
        name: chanName,
        type: discord_js_1.ChannelType.GuildText,
        parent: config.ticketCategoryId,
        permissionOverwrites: userOverwrites,
        topic: `${ticketId} | ${title} | <@${user.id}>`,
    });
    // ── قناة الإدارة ──────────────────────────────────────────────────────────
    let adminChannel = null;
    if (config.adminCategoryId) {
        const adminOverwrites = [
            { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionsBitField.Flags.ViewChannel] },
            { id: client.user.id, allow: [discord_js_1.PermissionsBitField.Flags.ViewChannel, discord_js_1.PermissionsBitField.Flags.SendMessages, discord_js_1.PermissionsBitField.Flags.ManageChannels, discord_js_1.PermissionsBitField.Flags.ManageMessages] },
        ];
        if (config.supportRoleIds) {
            for (const roleId of config.supportRoleIds) {
                adminOverwrites.push({ id: roleId, allow: [discord_js_1.PermissionsBitField.Flags.ViewChannel, discord_js_1.PermissionsBitField.Flags.SendMessages, discord_js_1.PermissionsBitField.Flags.ReadMessageHistory, discord_js_1.PermissionsBitField.Flags.AttachFiles] });
            }
        }
        adminChannel = await guild.channels.create({
            name: `admin-${chanName}`,
            type: discord_js_1.ChannelType.GuildText,
            parent: config.adminCategoryId,
            permissionOverwrites: adminOverwrites,
            topic: `[ADMIN] ${ticketId} | ${title} | العضو: ${user.username}`,
        });
    }
    const ticket = {
        ticketId,
        channelId: userChannel.id,
        adminChannelId: adminChannel?.id,
        guildId,
        userId: user.id,
        username: user.username,
        category: category,
        title,
        description,
        evidence,
        priority: "medium",
        status: "open",
        openedAt: Date.now(),
        lastActivity: Date.now(),
        inactivityWarned: false,
    };
    (0, db_js_1.saveTicket)(ticket);
    const supportMentions = config.supportRoleIds?.map((id) => `<@&${id}>`).join(" ") || "";
    const userMsg = await userChannel.send({
        content: `<@${user.id}>${supportMentions ? " | " + supportMentions : ""}`,
        embeds: [(0, embeds_js_1.ticketEmbed)(ticket, false)],
        components: (0, embeds_js_1.ticketButtons)(false, undefined, false),
    });
    await userMsg.pin().catch(() => null);
    if (adminChannel) {
        const adminMsg = await adminChannel.send({
            content: supportMentions || undefined,
            embeds: [(0, embeds_js_1.ticketEmbed)(ticket, true)],
            components: (0, embeds_js_1.ticketButtons)(false, undefined, true),
        });
        await adminMsg.pin().catch(() => null);
        await adminChannel.send({
            content: [
                "## 📡 نظام الريلاي التلقائي",
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                "✅ **اكتب ردك هنا** وسيصل للعضو فوراً كرسالة منك.",
                "✅ **رسائل العضو** تصلك هنا تلقائياً.",
                `✅ قناة العضو: <#${userChannel.id}>`,
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            ].join("\n"),
        });
    }
    await interaction.editReply({
        content: [
            `✅ **تم فتح تكتك:** <#${userChannel.id}>`,
            adminChannel ? `🔐 **قناة الإدارة:** <#${adminChannel.id}>` : "",
        ].filter(Boolean).join("\n"),
    });
    if (config.logChannelId) {
        const logCh = guild.channels.cache.get(config.logChannelId);
        await logCh?.send({
            embeds: [(0, embeds_js_1.logEmbed)("🟢 تكت جديد مفتوح", embeds_js_1.COLOR.green, [
                    { name: "رقم التكت", value: ticketId, inline: true },
                    { name: "العضو", value: `<@${user.id}> \`${user.username}\``, inline: true },
                    { name: "القسم", value: index_js_1.CATEGORY_SLUG[category] ?? category, inline: true },
                    { name: "قناة العضو", value: `<#${userChannel.id}>`, inline: true },
                    { name: "قناة الإدارة", value: adminChannel ? `<#${adminChannel.id}>` : "معطّل", inline: true },
                    { name: "العنوان", value: title },
                ])],
        });
    }
}
// ── Claim ─────────────────────────────────────────────────────────────────────
async function handleClaimTicket(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const config = (0, db_js_1.getGuildConfig)(interaction.guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const ok = config.supportRoleIds?.some((id) => member.roles.cache.has(id)) || member.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageChannels);
    if (!ok) {
        await interaction.editReply({ content: "❌ لا تملك رتبة الدعم لاستلام هذا التكت." });
        return;
    }
    const ticket = (0, db_js_1.getTicket)(interaction.channelId) ?? (0, db_js_1.getTicketByAdminChannel)(interaction.channelId);
    if (!ticket) {
        await interaction.editReply({ content: "❌ التكت غير موجود." });
        return;
    }
    if (ticket.status === "claimed") {
        await interaction.editReply({ content: `❌ مستلم بالفعل من <@${ticket.claimedBy}>.` });
        return;
    }
    ticket.status = "claimed";
    ticket.claimedBy = interaction.user.id;
    ticket.claimedByUsername = interaction.user.username;
    ticket.lastActivity = Date.now();
    (0, db_js_1.saveTicket)(ticket);
    const stats = (0, db_js_1.getAdminStats)(interaction.user.id);
    stats.username = interaction.user.username;
    stats.claimed = (stats.claimed ?? 0) + 1;
    (0, db_js_1.saveAdminStats)(stats);
    const isAdminChannel = interaction.channelId === ticket.adminChannelId;
    await interaction.message.edit({
        components: (0, embeds_js_1.ticketButtons)(true, interaction.user.username, isAdminChannel),
    });
    const otherChId = isAdminChannel ? ticket.channelId : ticket.adminChannelId;
    if (otherChId) {
        const otherCh = client.channels.cache.get(otherChId);
        if (otherCh) {
            const msgs = await otherCh.messages.fetch({ limit: 10 });
            const pinned = msgs.find((m) => m.pinned && m.author.id === client.user.id);
            if (pinned) {
                await pinned.edit({ components: (0, embeds_js_1.ticketButtons)(true, interaction.user.username, !isAdminChannel) }).catch(() => null);
            }
        }
    }
    const logE = (0, embeds_js_1.logEmbed)("📩 تم Claim", embeds_js_1.COLOR.blue, [
        { name: "الإداري", value: `<@${interaction.user.id}>`, inline: true },
        { name: "التكت", value: ticket.ticketId, inline: true },
    ]);
    for (const chId of [ticket.channelId, ticket.adminChannelId].filter(Boolean)) {
        const ch = client.channels.cache.get(chId);
        await ch?.send({ embeds: [logE] });
    }
    await interaction.editReply({ content: "✅ تم استلام التكت." });
    if (config.logChannelId) {
        const logCh = (await client.channels.fetch(config.logChannelId).catch(() => null));
        await logCh?.send({ embeds: [(0, embeds_js_1.logEmbed)("📩 Claim", embeds_js_1.COLOR.blue, [
                    { name: "رقم التكت", value: ticket.ticketId, inline: true },
                    { name: "الإداري", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "العضو", value: `<@${ticket.userId}>`, inline: true },
                ])] });
    }
}
// ── Unclaim ───────────────────────────────────────────────────────────────────
async function handleUnclaimTicket(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ticket = (0, db_js_1.getTicket)(interaction.channelId) ?? (0, db_js_1.getTicketByAdminChannel)(interaction.channelId);
    if (!ticket) {
        await interaction.editReply({ content: "❌ التكت غير موجود." });
        return;
    }
    const config = (0, db_js_1.getGuildConfig)(interaction.guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const isSupport = config.supportRoleIds?.some((id) => member.roles.cache.has(id)) || member.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageChannels);
    if (ticket.claimedBy !== interaction.user.id && !isSupport) {
        await interaction.editReply({ content: "❌ لا يمكنك Unclaim هذا التكت." });
        return;
    }
    const prev = ticket.claimedBy;
    ticket.status = "open";
    ticket.claimedBy = undefined;
    ticket.claimedByUsername = undefined;
    ticket.lastActivity = Date.now();
    (0, db_js_1.saveTicket)(ticket);
    const isAdminChannel = interaction.channelId === ticket.adminChannelId;
    await interaction.message.edit({ components: (0, embeds_js_1.ticketButtons)(false, undefined, isAdminChannel) });
    const otherChId = isAdminChannel ? ticket.channelId : ticket.adminChannelId;
    if (otherChId) {
        const otherCh = client.channels.cache.get(otherChId);
        if (otherCh) {
            const msgs = await otherCh.messages.fetch({ limit: 10 });
            const pinned = msgs.find((m) => m.pinned && m.author.id === client.user.id);
            if (pinned) {
                await pinned.edit({ components: (0, embeds_js_1.ticketButtons)(false, undefined, !isAdminChannel) }).catch(() => null);
            }
        }
    }
    const logE = (0, embeds_js_1.logEmbed)("📤 تم Unclaim", embeds_js_1.COLOR.black, [
        { name: "الإداري السابق", value: prev ? `<@${prev}>` : "—", inline: true },
        { name: "التكت", value: ticket.ticketId, inline: true },
    ]);
    for (const chId of [ticket.channelId, ticket.adminChannelId].filter(Boolean)) {
        const ch = client.channels.cache.get(chId);
        await ch?.send({ embeds: [logE] });
    }
    await interaction.editReply({ content: "✅ تم إعادة التكت للفريق." });
}
// ── Rename ────────────────────────────────────────────────────────────────────
async function handleRenameTicket(interaction) {
    const modal = new discord_js_1.ModalBuilder().setCustomId("ticket_rename_modal").setTitle("✏️ تغيير اسم التكت");
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
        .setCustomId("new_name")
        .setLabel("الاسم الجديد (الرقم يُضاف تلقائياً)")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder("مثال: مشكلة-دفع")
        .setRequired(true)
        .setMaxLength(40)));
    await interaction.showModal(modal);
}
async function handleRenameModalSubmit(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const raw = interaction.fields.getTextInputValue("new_name");
    const slug = raw.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u0600-\u06ff-]/g, "").slice(0, 40);
    const ticket = (0, db_js_1.getTicket)(interaction.channelId) ?? (0, db_js_1.getTicketByAdminChannel)(interaction.channelId);
    const counter = ticket ? ticket.ticketId.split("-")[1] ?? "" : "";
    const finalName = counter ? `${parseInt(counter, 10)}-${slug}` : slug;
    const adminName = `admin-${finalName}`;
    const userCh = (ticket ? client.channels.cache.get(ticket.channelId) : interaction.channel);
    await userCh?.setName(finalName).catch(() => null);
    if (ticket?.adminChannelId) {
        const adminCh = client.channels.cache.get(ticket.adminChannelId);
        await adminCh?.setName(adminName).catch(() => null);
    }
    if (ticket) {
        ticket.lastActivity = Date.now();
        (0, db_js_1.saveTicket)(ticket);
    }
    await interaction.editReply({ content: `✅ تم تغيير الاسم إلى: **${finalName}**` });
}
// ── Quick Reply ───────────────────────────────────────────────────────────────
async function handleQuickReply(client, interaction) {
    const config = (0, db_js_1.getGuildConfig)(interaction.guildId);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const ok = config.supportRoleIds?.some((id) => member.roles.cache.has(id)) || member.permissions.has(discord_js_1.PermissionsBitField.Flags.ManageChannels);
    if (!ok) {
        await interaction.reply({ content: "❌ الردود السريعة متاحة لفريق الدعم فقط.", ephemeral: true });
        return;
    }
    const MAP = {
        reviewing: "🔍 **نحن نراجع طلبك حالياً.** سنتواصل معك قريباً، يرجى الانتظار.",
        need_evidence: "📸 **يرجى تزويدنا بصور أو أدلة إضافية** لمساعدتنا في حل مشكلتك.",
        resolved: "✅ **تم حل مشكلتك بنجاح.**\nإذا احتجت أي شيء آخر لا تتردد في التواصل.",
        clarify: "❓ **يرجى توضيح مشكلتك أكثر** حتى نتمكن من مساعدتك بشكل أفضل.",
        thanks: "🙏 **شكراً لتواصلك مع فريق FX9!**\nنحن هنا دائماً لخدمتك.",
        transfer: "🔄 **سيتم تحويل طلبك** إلى الجهة المختصة. يرجى الانتظار.",
        known_issue: "⚠️ **هذه مشكلة معروفة لدينا** ويعمل فريقنا على حلها حالياً. سنخطرك فور الانتهاء.",
    };
    const reply = MAP[interaction.values[0]];
    if (!reply) {
        await interaction.reply({ content: "❌ رد غير معروف.", ephemeral: true });
        return;
    }
    const ticket = (0, db_js_1.getTicket)(interaction.channelId) ?? (0, db_js_1.getTicketByAdminChannel)(interaction.channelId);
    if (ticket) {
        const userCh = (await client.channels.fetch(ticket.channelId).catch(() => null));
        await userCh?.send({ content: reply });
        ticket.lastActivity = Date.now();
        (0, db_js_1.saveTicket)(ticket);
    }
    await interaction.reply({ content: `✅ تم إرسال الرد للعضو.`, ephemeral: true });
}
