import { ActionRowBuilder, ButtonInteraction, TextChannel } from "discord.js"; // Import CommandInteraction type
import ms from "ms";
import { client } from "../index.js";
import { DatabaseMiddleware } from "../core/databaseMiddleware.js";
import { EmbedBuilder } from "../utils/embedBuilder.js";
import buttons from "../utils/buttons.js";


export default {
    // @ts-ignore
    id: buttons.deleteTicket.data.custom_id,
    cooldown: ms("5s"), // Set a cooldown of 5 seconds
    function: async function (interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;
        if (client.setCooldown(`ticket_close_${interaction.channel.id}`, true, 2000)) return interaction.deferUpdate();
        const ticketChannel = interaction.channel as TextChannel;
        const guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId, true);
        const ticketConfig = await DatabaseMiddleware.getTicket(ticketChannel.id);
        if (!ticketConfig) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`This is not a ticket channel`)], ephemeral: true });
        if (ticketConfig.onDelete) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`This ticket is already being deleted`)], ephemeral: true });
        const staffRoles = guildConfig.staffRoles;
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => staffRoles.includes(role.id))) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`You do not have permission to close this ticket`)], ephemeral: true });
        const transcriptChannel = interaction.guild.channels.cache.get(guildConfig.logChannelId) as TextChannel;
        if (!transcriptChannel) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("Transcript channel is not set up. Please contact an admin.")], ephemeral: true });
        }
        await interaction.reply({ embeds: [new EmbedBuilder().setDescription(`Saving transcript for ticket...`).setColor("Yellow")] })
        const send_transcript = await ticketConfig.saveTranscript(ticketChannel);
        if (!send_transcript) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to save transcript. Please try again later.")] });
        }
        await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Transcript saved successfully!`).setColor("Green")] })
        await interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(`This Ticket Will Be Deleted In 5 Seconds.`).setColor("Red")], })
        setTimeout(async () => {
            const response = await ticketChannel.delete().catch(err => console.error("Error deleting ticket channel:", err));
            if (!response) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to delete ticket channel. Please try again later.")] });
            }
        }, 5000);







    }
};
