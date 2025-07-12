
import { ChatInputCommandInteraction, InteractionContextType, TextChannel } from "discord.js";
import ms from "ms";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "ticket",
    subCommand: "close",
    isSubCommand: true,
    description: "Close a ticket channel.",
    cooldown: ms("10s"), // in ms
    contexts: [InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        if (!interaction.inCachedGuild()) return;
    

        const guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId, true);
        if (!guildConfig) return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This server is not configured for tickets.")], ephemeral: true });
        const staffRoles = guildConfig.staffRoles;
        const ticketChannel = interaction.options.getChannel("channel", false) as TextChannel || interaction.channel as TextChannel;
        if (!ticketChannel.isTextBased()) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("The specified channel is not a text channel.")], ephemeral: true });
        }
        const ticket = await DatabaseMiddleware.getTicket(interaction.channel.id);
        if (!ticket) return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This is not a ticket channel.")], ephemeral: true });
        if (!staffRoles.some(role => interaction.member.roles.cache.has(role)) && !interaction.member.permissions.has("Administrator")) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You do not have permission to remove users from tickets.")], ephemeral: true });
        }
        if(!ticket.isOpen()) return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This ticket is already closed.")], ephemeral: true }); 
        await interaction.deferReply();
        const response = await ticket.closeTicket(ticketChannel, guildConfig.staffRoles);
        if (!response) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to close the ticket. Please try again later.")] });
        }
        interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Ticket closed by ${interaction.user.toString()}`)] });
        await ticket.save().catch(err => console.error("Error saving ticket:", err));

    }
}

