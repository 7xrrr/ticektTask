
import { ChatInputCommandInteraction, InteractionContextType, TextChannel } from "discord.js";
import ms from "ms";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "ticket",
    subCommand: "remove",
    isSubCommand: true,
    description: "remove a user/role from a ticket.",
    cooldown: ms("10s"), // in ms
    contexts: [InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", false);
        const role = interaction.options.getRole("role", false);
        if (!user && !role) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You must specify at least one of user or role.")], ephemeral: true });
        }
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
        const userPerm = ticketChannel.permissionOverwrites.cache.get(user?.id);
        const rolePerm = ticketChannel.permissionOverwrites.cache.get(role?.id);

        if (user && !userPerm) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This user is not in the ticket.")], ephemeral: true });
        }
        if (role && !rolePerm) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("This role is not in the ticket.")], ephemeral: true });
        }
        await interaction.deferReply();
        if (user) {
            ticket.removeMember(user.id);
        }
        if (role) {
            ticket.removeRole(role.id);
        }
        await ticket.save().catch(err => console.error("Error saving ticket:", err));
        const response = await ticket.updateChannelPermissions(ticketChannel, guildConfig.staffRoles);
        if (!response) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Failed to update ticket permissions. Please try again later.")] });
        }
        let text = "";
        if (role) {
            text += `Role ${role.toString()} has been removed from the ticket.\n`;
        }
        if (user) {
            text += `User ${user.toString()} has been removed from the ticket.`;
        }
        return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(text)] });
     





    }
}

