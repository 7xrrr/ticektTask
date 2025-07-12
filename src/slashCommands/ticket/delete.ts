
import { ChatInputCommandInteraction, InteractionContextType, TextChannel } from "discord.js";
import ms from "ms";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "ticket",
    subCommand: "delete",
    isSubCommand: true,
    description: "Delete a ticket.",
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
        const ticketChannel = interaction.channel as TextChannel;
        if (!ticketChannel.isTextBased()) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This command can only be used in a text channel.")], ephemeral: true });
        }
        const ticket = await DatabaseMiddleware.getTicket(ticketChannel.id);
        if (!ticket) return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This is not a ticket channel.")], ephemeral: true });
        if(ticket.onDelete) return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This ticket is already being deleted.")], ephemeral: true });
        if (!staffRoles.some(role => interaction.member.roles.cache.has(role)) && !interaction.member.permissions.has("Administrator")) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You do not have permission to delete tickets.")], ephemeral: true });
        }
        const transcriptChannel = interaction.guild.channels.cache.get(guildConfig.logChannelId) as TextChannel;
        if (!transcriptChannel) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("Transcript channel is not set up. Please contact an admin.")], ephemeral: true });
        }
        await interaction.deferReply();
        await interaction.editReply({ embeds: [ new EmbedBuilder().setDescription(`Saving transcript for ticket...`).setColor("Yellow") ] })
        const send_transcript = await ticket.saveTranscript(ticketChannel)
        if(!send_transcript) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to save transcript. Please try again later.")] });
        }
        await interaction.editReply({ embeds: [ new EmbedBuilder().setDescription(`Transcript saved successfully!`).setColor("Green") ] })
        await interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(`This Ticket Will Be Deleted In 5 Seconds.`).setColor("Red")], })
        setTimeout(async () => {
            const response = await ticketChannel.delete().catch(err => console.error("Error deleting ticket channel:", err));
            if (!response) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to delete ticket channel. Please try again later.")] });
            }
        }, 5000);




    }
}

