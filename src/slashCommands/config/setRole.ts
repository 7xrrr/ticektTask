
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import ms from "ms";
import { perm } from "../../utils/tools.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "ticket",
    subCommand: "role",
    isSubCommand: true,
    description: "Set the role that can manage tickets.",
    permissions: ["Administrator"] as perm[],
    roleRequired: [], // id here
    cooldown: ms("10s"), // in ms
    contexts: [InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        const role = interaction.options.getRole("role", true);
        const type = interaction.options.getString("type", true);
        if (!role) { return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You must specify a role to set for managing tickets.")], flags: ["Ephemeral"] }); }
        await interaction.deferReply({ flags: ["Ephemeral"] });
        const guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId, true);
        let roles = guildConfig.staffRoles || [];
       
        if (type === "remove") {
            if (!roles.includes(role.id)) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Role ${role.toString()} is not set for managing tickets.`)] });
            }
            roles = roles.filter(r => r !== role.id);
            guildConfig.staffRoles = roles;
            await guildConfig.save();
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Role ${role.toString()} has been removed from the ticket management roles.`)] });
        } else {
            if (roles.includes(role.id)) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Role ${role.toString()} is already set for managing tickets.`)] });
            }
            roles.push(role.id);
            guildConfig.staffRoles = roles;
            await guildConfig.save();
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Role ${role.toString()} has been added to the ticket management roles.`)] });
        }
    }
}

