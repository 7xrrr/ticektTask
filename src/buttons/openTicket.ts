import { ActionRowBuilder, ButtonInteraction, ChannelType, OverwriteType } from "discord.js"; // Import CommandInteraction type
import ms from "ms";
import { DatabaseMiddleware } from "../core/databaseMiddleware.js";
import { EmbedBuilder } from "../utils/embedBuilder.js";
import { formatTicketNumber } from "../utils/tools.js";
import buttons from "../utils/buttons.js";

export default {
    id: "ticket_open",
    cooldown: ms("5s"), // Set a cooldown of 5 seconds
    function: async function (interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;
        const owner = interaction.user;
        const oldTicket = await DatabaseMiddleware.getTicketByOwnerId(owner.id, interaction.guildId);
        const oldTicketChannel = interaction.guild.channels.cache.get(oldTicket?.ticketId);
        if (oldTicket && oldTicketChannel) {
            oldTicket.deleted = true;
            oldTicket.save().catch(err => console.error("Error saving old ticket:", err));
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`You already have an open ticket: <#${oldTicket.ticketId}>`)], ephemeral: true });
        }
        const guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId);
        if (!guildConfig || !guildConfig?.ticketCategory) return interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setDescription("This ticket has not been set up yet.")] });
        await interaction.deferReply({ ephemeral: true });
        let category = interaction.guild.channels.cache.get(guildConfig.ticketCategory);
        if (!category) {
            category = await interaction.guild.channels.fetch(guildConfig.ticketCategory).catch(() => null);
        }
        if (!category || category.type !== ChannelType.GuildCategory) { return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("This ticket has not been set up yet.")] }); }
        const ticketNumber = guildConfig.ticketNumber + 1;

        const staffRoles = (guildConfig?.staffRoles || []).filter(role => interaction.guild.roles.cache.has(role));
        const channel = await interaction.guild.channels.create({
            name: `ticket-${formatTicketNumber(ticketNumber)}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ["ViewChannel"],
                },
                {
                    id: owner.id,
                    type: OverwriteType.Member,
                    allow: ["ViewChannel", "SendMessages", "ReadMessageHistory", "AttachFiles", "MentionEveryone"],
                },
                //@ts-ignores
                ...staffRoles.map(role => ({
                    id: role,
                    type: OverwriteType.Role,
                    allow: ["ViewChannel", "SendMessages", "ReadMessageHistory", "AttachFiles", "MentionEveryone"],
                })),

            ],
        }).catch(err => { console.error("Error creating ticket channel:", err); return null; })
        if (!channel) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to create ticket channel. Please try again later.")] });
        }
        guildConfig.ticketNumber = guildConfig.ticketNumber + 1;
        await guildConfig.save();
        



        const ticket = await DatabaseMiddleware.createTicket(channel, owner.id, ticketNumber);

        channel.send({
            content: `<@${owner.id}>\n${staffRoles.map(role => `<@&${role}>`).join(", ")}`,
            embeds: [new EmbedBuilder().setDescription(`Welcome to your ticket! Please describe your issue below, and a staff member will assist you shortly.`)],
            components: [new ActionRowBuilder().addComponents(buttons.lockButton)],
        }).then(() => {
            ticket.ticketMessage = channel.lastMessageId || null;
            ticket.save().catch(err => console.error("Error saving ticket:", err));
        }).catch(err => {
            console.error("Error sending welcome message in ticket channel:", err);
        });

        await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Ticket created successfully! You can access it here: <#${channel.id}>`)] });

    }
};
