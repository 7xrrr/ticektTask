
import { ChannelType, ChatInputCommandInteraction, InteractionContextType, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import ms from "ms";
import { perm } from "../utils/tools.js";



export default {
    name: "ticket",
    subCommand: "config",
    isSubCommand: true,
    isConfig: true,
    description: "Set the ticket category for the server.",
    permissions: ["Administrator"] as perm[],
    roleRequired: [], // id here
    cooldown: ms("1m"), // in ms
    contexts: [InteractionContextType.Guild] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: false,
    options: [
        new SlashCommandSubcommandGroupBuilder()
            .setName("config")
            .setDescription("Set the ticket category for the server.")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("category")

                    .setDescription("Set the ticket category for the server.")
                    .addChannelOption(option => option.setName("category").setDescription("The category to set for tickets").setRequired(true).addChannelTypes(ChannelType.GuildCategory)), // 4 is the type for categories

            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("role")
                    .setDescription("Set the role that can manage tickets.")
                    .addRoleOption(option => option.setName("role").setDescription("The role to set for managing tickets").setRequired(true))
                    .addStringOption(option => option.setName("type").setDescription("remove/add this role").setRequired(true).addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }))
            ).addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("send")
                    .setDescription("Set the channel to send ticket open message")
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to send ticket open message").setRequired(true).addChannelTypes(ChannelType.GuildText))
                    .addStringOption(e => e.setName("title").setDescription("The title of the ticket open message").setRequired(false).setMaxLength(100))
                    .addStringOption(e => e.setName("description").setDescription("The description of the ticket open message").setRequired(false).setMaxLength(2000))
                    .addStringOption(e => e.setName("image").setDescription("The image URL to use in the ticket open message").setRequired(false).setMaxLength(150))
            ).addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("transcripts")
                    .setDescription("Set the channel to send ticket transcripts")
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to send ticket transcripts").setRequired(true).addChannelTypes(ChannelType.GuildText))

            ).toJSON(),
        new SlashCommandSubcommandGroupBuilder()
            .setName("moderation")
            .setDescription("Moderation commands for tickets.")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("open")
                    .setDescription("Open a ticket for the user.")
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to open the ticket in").setRequired(false).addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("close")
                    .setDescription("Close the user's ticket.")
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to close the ticket in").setRequired(false).addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("delete")
                    .setDescription("delete ticket channel")
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to delete the ticket in").setRequired(false).addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("add")
                    .setDescription("Add a user or role to the ticket.")
                    .addUserOption(option => option.setName("user").setDescription("The user to add to the ticket").setRequired(false))
                    .addRoleOption(option => option.setName("role").setDescription("The role to add to the ticket").setRequired(false))
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to add the user or role to").setRequired(false).addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a user or role from the ticket.")
                    .addUserOption(option => option.setName("user").setDescription("The user to remove from the ticket").setRequired(false))
                    .addRoleOption(option => option.setName("role").setDescription("The role to remove from the ticket").setRequired(false))
                    .addChannelOption(option => option.setName("channel").setDescription("The channel to remove the user or role from").setRequired(false).addChannelTypes(ChannelType.GuildText)))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("rename")
                    .setDescription("Rename the ticket channel.")
                    .addStringOption(option => option.setName("name").setDescription("The new name for the ticket channel").setRequired(true).setMaxLength(100))).toJSON()









    ],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {














    }
}

