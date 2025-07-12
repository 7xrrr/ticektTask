
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import ms from "ms";
import { perm } from "../../utils/tools.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import buttons from "../../utils/buttons.js";



export default {
    name: "ticket",
    subCommand: "send",
    isSubCommand: true,
    description: "send ticket open message to a channel",
    permissions: ["Administrator"] as perm[],
    roleRequired: [], // id here
    cooldown: ms("10s"), // in ms
    contexts: [InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        if (!interaction.inCachedGuild()) return
        const channel = interaction.options.getChannel("channel", true);
        const title = interaction.options.getString("title", false);
        const description = interaction.options.getString("description", false);
        const image = interaction.options.getString("image", false);
        if (!title && !description && !image) {
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You must specify at least one of title, description or image.")], flags: ["Ephemeral"] });
        }
        if (!channel || !channel.isTextBased()) { // 0 is the type for text channels
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You must specify a valid text channel to send ticket open message.")], flags: ["Ephemeral"] });
        }
        const embed = new EmbedBuilder()
        if (title?.length > 0) { embed.setTitle(title); }
        if (image?.length > 0) { embed.setImage(image); }
        if (description?.length > 0) { embed.setDescription(description); }
        const openButton = buttons.openButton;
        await interaction.deferReply({ flags: ["Ephemeral"] });
        const msg =  await channel.send({ embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(openButton)] });
        await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Ticket open message sent to ${channel.toString()}.`)] });


    }
}

