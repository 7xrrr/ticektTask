import colors from "colors";
import { log } from "../../utils/logging.js";
import { client } from "../../index.js";
import config from "../../config.js";
import { ChannelType, EmbedBuilder, Message, PermissionFlagsBits, PermissionsBitField } from "discord.js";


export default {
	name: "messageCreate",
	description: "Client on receive message event",
	once: false,
	function: async function (message: Message) {		
		if (message.author.bot || !message.content || !message.guild || message.channel.type !== ChannelType.GuildText || config.debugMode && !config.developers.includes(message.author.id) ) return 
		const prefix = config.prefix || "-";
		if (!message.content.startsWith(prefix)) return;
		const args = message.content.slice(prefix.length).split(/ +/);
		const cmd = args.shift()?.toLowerCase();

		if (!cmd) return;
		const command = client.commands.get(cmd) || client.commands.find((a: any) => a.aliases && a.aliases.includes(cmd));
		const cdKey = `${command?.name}-${message.author.id}-${message.guildId}`;
		if (command) {
			if (command.permissions.length) {
				const invalidPerms: any[] = [];
				const cleanPerm = command.permissions.map((p: string) => PermissionFlagsBits[p]).filter((p: any) => p);
			
				for (const perm of cleanPerm) {
					if (!message.member?.permissions.has(perm)) invalidPerms.push(perm);
				
				}
			
				if (invalidPerms.length && message.guild.ownerId !== message.author.id) return message.channel.send(`Missing Permissions: \`${invalidPerms + "".replace(/,/g, ", ")}\``);
			}
			if (command.roleRequired) {
				const role = await message.guild?.roles.fetch(command.roleRequired);
				if (role && message.member && !message.member?.roles.cache.has(role.id) && message.member.roles.highest.comparePositionTo(role) < 0 && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.channel.send(`:x: **You don't have the required role!**`);
			}
			if (client.cooldowns.get(cdKey)) {
				const embed = new EmbedBuilder()
					.setColor("#FF0000")
					.setTitle("Cooldown")
					.setDescription(`:x: **You can use this command again <t:${client.cooldowns.get(cdKey).until}:R>**`)
					.setTimestamp()
					.setFooter({ text: message.author.username, iconURL: message.author.avatarURL() || undefined });
				return message.channel.send({ embeds: [embed] });
			}
			if(command?.flags?.devOnly && ( !config.developers.includes(message.author.id))) {
				log(`[Command blocked] ${message.content} ${colors.blue("||")} Author: ${message.author.username} ${colors.blue("||")} ID: ${message.author.id} ${colors.blue("||")} Server: ${message.guild?.name || "DM"}`);
			return;
			}
			if(command?.flags?.ownerOnly && !config.developers.includes(message.author.id)) {
				return 
			}

			command.function(client,message,args);
			log(`[Command ran] ${message.content} ${colors.blue("||")} Author: ${message.author.username} ${colors.blue("||")} ID: ${message.author.id} ${colors.blue("||")} Server: ${message.guild?.name || "DM"}`);
			if (message.member && command.cooldown && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
				client.cooldowns.set(cdKey,{ user: message.author.id, command: command.name, until: Math.round((Date.now() + command.cooldown) / 1000) })
				setTimeout(() => {
					client.cooldowns.delete(cdKey);
				}, command.cooldown);
			}
		}
	},
};
