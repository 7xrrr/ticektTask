
import { ChannelType, ChatInputCommandInteraction, InteractionContextType, SlashCommandChannelOption } from "discord.js";
import ms from "ms";
import { perm } from "../../utils/tools.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "ticket",
    subCommand: "category",
    isSubCommand: true,
    isConfig: false,
    description: "Set the ticket category for the server.",
    permissions: ["Administrator"] as  perm[],
    roleRequired: [], // id here
    cooldown: ms("10s"), // in ms
    contexts: [ InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [
       new SlashCommandChannelOption().setName("category").setDescription("The category to set for tickets").setRequired(true).addChannelTypes(ChannelType.GuildCategory) // 4 is the type for categories
    ],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        const category = interaction.options.getChannel("category", true);
        if (category.type !== ChannelType.GuildCategory) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setDescription("The selected channel is not a valid category.")],
                flags:["Ephemeral"]
            });
        };
        let guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId,true);
        guildConfig.ticketCategory = category.id;
        await guildConfig.save().then(() => {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(`Ticket category has been set to ${category.toString()}.`)
                ],
                flags:["Ephemeral"]
            });
        })

 
     


















    }
}

