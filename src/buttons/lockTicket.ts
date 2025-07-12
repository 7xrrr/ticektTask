import { ActionRowBuilder, ButtonInteraction } from "discord.js"; // Import CommandInteraction type
import ms from "ms";
import { client } from "../index.js";
import { DatabaseMiddleware } from "../core/databaseMiddleware.js";
import { EmbedBuilder } from "../utils/embedBuilder.js";
import buttons from "../utils/buttons.js";


export default {
    // @ts-ignore
    id: buttons.lockButton.data.custom_id,
    cooldown: ms("5s"), // Set a cooldown of 5 seconds
    function: async function (interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;
        if (client.setCooldown(`ticket_close_${interaction.channel.id}`, true, 2000)) return interaction.deferUpdate();
        const ticketChannel = interaction.channel;
        const guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId, true);
        const ticketConfig = await DatabaseMiddleware.getTicket(ticketChannel.id);
        if (!ticketConfig) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`This is not a ticket channel`)], ephemeral: true });
        if(ticketConfig.onDelete) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`This ticket is already being deleted`)], ephemeral: true });
        const staffRoles = guildConfig.staffRoles;
      
        if (!interaction.member.permissions.has("Administrator") && !interaction.member.roles.cache.some(role => staffRoles.includes(role.id)) && ticketConfig.ownerId !== interaction.user.id) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`You do not have permission to close this ticket`)], ephemeral: true });
        if (!ticketConfig.isOpen()) return interaction.reply({ embeds: [new EmbedBuilder().setDescription(`This ticket is already closed`)], ephemeral: true });
        await interaction.deferReply();
        const response = await ticketConfig.closeTicket(ticketChannel, staffRoles);
        if(!response) return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Failed to close the ticket. Please try again later.`)] });
        interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Ticket closed by ${interaction.user.toString()}`)] });
        const firstMessage = ticketConfig?.ticketMessage && await ticketChannel.messages.fetch(ticketConfig.ticketMessage).catch(() => null);
        if (firstMessage ) {
            await firstMessage?.edit({
                components: [new ActionRowBuilder<any>().addComponents(buttons.unLockButton)],
            });
        }
        const secondMessage = await interaction.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`Ticket Control Panel`)
            ],
            components: [new ActionRowBuilder<any>().addComponents(buttons.unLockButton, buttons.deleteTicket)],
        }).catch((err) => null);
        if(secondMessage) {
            ticketConfig.secondTicketMessage = secondMessage.id;
            await ticketConfig.save().catch(err => console.error("Error saving ticket:", err));
        }
        






    }
};
