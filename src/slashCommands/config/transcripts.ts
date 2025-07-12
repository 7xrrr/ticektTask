
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import ms from "ms";
import { perm } from "../../utils/tools.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "ticket",
    subCommand: "transcripts",
    isSubCommand: true,
    description: "Set the channel to send tickets transcripts.",
    permissions: ["Administrator"] as perm[],
    roleRequired: [], // id here
    cooldown: ms("10s"), // in ms
    contexts: [InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        const channel = interaction.options.getChannel("channel", true);
        if (!channel || channel.type !== 0) { // 0 is the type for text channels
            return interaction.reply({ embeds: [new EmbedBuilder().setDescription("You must specify a valid text channel to send transcripts.")], flags: ["Ephemeral"] });
        }
        await interaction.deferReply({ flags: ["Ephemeral"] });
        const guildConfig = await DatabaseMiddleware.getGuildConfig(interaction.guildId, true);
        guildConfig.logChannelId = channel.id;
        await guildConfig.save();
        return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Ticket transcripts will now be sent to ${channel.toString()}.`)] });

    }
}

