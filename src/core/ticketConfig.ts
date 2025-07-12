import ms from "ms";
import { client } from "../index.js";
import { TicketMongo, TicketSQL, ITicket } from "../models/ticket.js";
import { cleanJsonArrayString, formatTicketNumber, genrateChannelTranscriptInterface, getGuildIcon } from "../utils/tools.js";
import { ActionRowBuilder, BaseGuildTextChannel, Collection, GuildChannel, GuildTextBasedChannel, Message, OverwriteType, SnowflakeUtil } from "discord.js";
import { ExportReturnType, generateFromMessages } from "discord-html-transcripts";
import { EmbedBuilder } from "../utils/embedBuilder.js";
import { DatabaseMiddleware } from "./databaseMiddleware.js";
import buttons from "../utils/buttons.js";

export class TicketWrapper {
    public ticketId: string;
    public guildId: string;
    public ticket: TicketSQL | ITicket;
    public type: "MongoDB" | "MySQL" | "SQLite";
    public clearTimeout: NodeJS.Timeout | null = null;

    public onDelete = false; // Flag to indicate if the ticket is deleted
    constructor(rawTicket: TicketSQL | ITicket, type: "MongoDB" | "MySQL" | "SQLite") {
        this.ticketId = rawTicket.channelId;
        this.guildId = rawTicket.guildId;
        this.type = type;
        this.ticket = rawTicket;

        if (!client.tickets.get(this.ticketId)) {
            client.tickets.set(this.ticketId, this);
        }
        this.clearTimeout = setTimeout(() => {
            this.clearCache();
        }, ms("30m"));

    }
    get ownerId(): string {
        return this.ticket.ownerId;
    }

    addMember(userId: string) {
        const members = this.addedMembers;
        if (!members.includes(userId)) {
            members.push(userId);
            this.addedMembers = members;
            this.markAsModified("addedMembers");
        }
    }
    removeMember(userId: string) {
        const members = this.addedMembers;
        const index = members.indexOf(userId);
        if (index !== -1) {
            members.splice(index, 1);
            this.addedMembers = members;
            this.markAsModified("addedMembers");
        }
    }
    addRole(roleId: string) {
        const roles = this.addedRoles;
        if (!roles.includes(roleId)) {
            roles.push(roleId);
            this.addedRoles = roles;
            this.markAsModified("addedRoles");
        }
    }
    removeRole(roleId: string) {
        const roles = this.addedRoles;
        const index = roles.indexOf(roleId);
        if (index !== -1) {
            roles.splice(index, 1);
            this.addedRoles = roles;
            this.markAsModified("addedRoles");
        }
    }
    get addedMembers(): string[] {
        if (this.type === "MongoDB") {
            return this.ticket.addedMembers as string[];
        } else {
            const cleanMembers = cleanJsonArrayString(this.ticket.addedMembers as string);
            if (typeof cleanMembers === "string") {
                return JSON.parse(cleanMembers) as string[];
            }
            return cleanMembers;
        }
    }

    set addedMembers(members: string[]) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).addedMembers = members;
            this.markAsModified("addedMembers");
        } else {
            (this.ticket as TicketSQL).addedMembers = cleanJsonArrayString(JSON.stringify(members));
        }
    }
    get ticketMessage(): string | null {
        if (this.type === "MongoDB") {

            return (this.ticket as ITicket).firstTicketMessage || null;

        } else {
            return (this.ticket as TicketSQL).firstTicketMessage || null;
        }
    }
    set ticketMessage(message: string | null) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).firstTicketMessage = message;
            this.markAsModified("firstTicketMessage");
        } else {
            (this.ticket as TicketSQL).firstTicketMessage = message;
        }
    }
    isOpen(): boolean {
        return !this.ticket.close;
    }
    get addedRoles(): string[] {
        if (this.type === "MongoDB") {
            return this.ticket.addedRoles as string[];
        } else {
            const cleanRoles = cleanJsonArrayString(this.ticket.addedRoles as string);
            if (typeof cleanRoles === "string") {
                return JSON.parse(cleanRoles) as string[];
            }
            return cleanRoles

        }
    }
    async closeTicket(channel: any, staffRoles: string[]) {

        this.close = true;
        const response = await this.updateChannelPermissions(channel, staffRoles)
        if (response === false) {
            this.close = false; // If updating permissions fails, keep the ticket open
            return null;
        }
        await this.setName(channel, `closed-${formatTicketNumber(this.ticket.ticketNumber)}`); // Rename the channel to indicate it's closed
        this.save();
        return true;

    }
    async updateChannelPermissions(channel: any, staffRoles: string[]): Promise<true | false> {
        const isOpen = this.isOpen();
        const staffRolesCache = channel.guild.roles.cache.filter(role => staffRoles.includes(role.id));
        const addedRoles = this.addedRoles
            .map(roleId => channel.guild.roles.cache.get(roleId))
            .filter(role => role !== undefined);
        const addedMembers = this.addedMembers;

        const overwriteOptions = [
            {
                id: channel.guild.id,
                allow: isOpen ? ["ViewChannel"] : [],
                deny: isOpen ? [] : ["ViewChannel"],
            },
            {
                id: this.ownerId,
                type: OverwriteType.Member,
                allow: isOpen ? ["ViewChannel", "SendMessages", "ReadMessageHistory", "AttachFiles", "MentionEveryone"] : [],
                deny: isOpen ? [] : ["ViewChannel"],
            },
            ...addedMembers.map(memberId => ({
                id: memberId,
                type: OverwriteType.Member,
                allow: isOpen ? ["ViewChannel", "SendMessages", "ReadMessageHistory", "AttachFiles", "MentionEveryone"] : [],
                deny: isOpen ? [] : ["ViewChannel"],
            })),
            ...addedRoles.map(role => ({
                id: role.id,
                type: OverwriteType.Role,
                allow: isOpen ? ["ViewChannel", "SendMessages", "ReadMessageHistory", "AttachFiles", "MentionEveryone"] : [],
                deny: isOpen ? [] : ["ViewChannel"],
            })),
            ...staffRolesCache.map(role => ({
                id: role.id,
                type: OverwriteType.Role,
                allow:["ViewChannel", "SendMessages", "ReadMessageHistory", "AttachFiles", "MentionEveryone"],
            })),
        ];

        try {
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timed out while updating channel permissions")), 5_000)
            );

            await Promise.race([
                channel.permissionOverwrites.set(overwriteOptions),
                timeout
            ]);

            return true;
        } catch (error) {
            // console.error("Failed to update channel permissions:", error);
            return false;
        }
    }
    async setName(channel: GuildTextBasedChannel, name: string) {
        const timeout = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("Timed out while renaming channel")), 5_000)
        );

        return await Promise.race([
            channel.setName(name),
            timeout
        ]).then(() => {
            this.ticketName = name;
            return true;
        }).catch(err => {
            console.error(`Failed to rename channel: ${err.message}`);
            return false;
        });
    }

    async openTicket(channel: GuildTextBasedChannel, staffRoles: string[]) {
        this.close = false;
        const response = await this.updateChannelPermissions(channel, staffRoles);
        if (response === false) {
            this.close = true; // If updating permissions fails, close the ticket
            return null;
        }

        await this.setName(channel, `ticket-${formatTicketNumber(this.ticket.ticketNumber)}`);
        this.save();
        return true;
    }
    saveTranscript = async (channel: BaseGuildTextChannel,): Promise<true | false> => {
        const transcript = await this.genrateChannelTranscript(channel, `transcript-${this.ticket.ticketName}.html`);
        const attachment = transcript.file;
        const members = transcript.members;
        const totatlMessages = members.reduce((acc, member) => acc + member.value, 0);
        const urlButton = buttons.getTicketUrl;
        const embed = new EmbedBuilder()
            .setThumbnail(getGuildIcon(channel.guild))
            .setFooter({ text: `Ticket ID: ${this.ticketId}`, iconURL: client.user.displayAvatarURL() })
            .setColor("Blue")
            .setTimestamp(new Date())
            .setTitle("Ticket Transcript").addFields([
                {

                    name: "Ticket Name",
                    value: this.ticketName || "No name set",
                    inline: true
                },
                
                { name: "Ticket Owner", value: `<@${this.ownerId}>`, inline: true }, { name: "Ticket Number", value: `#${this.ticket.ticketNumber}`, inline: true }, { name: "Total Messages", value: `${totatlMessages} messages`, inline: true }, { name: "Members", value: `${members.sort((a, b) => b.value - a.value).map(m => `- <@${m.id}>: (${m.value})`).join("\n") || "No members participated"}`, inline: true }, { name: "Ticket Opened At", value: `<t:${Math.floor(SnowflakeUtil.timestampFrom(this.ticketId) / 1000)}:F>`, inline: true },
            { name: "Ticket Closed At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },])
        const guildConfig = await DatabaseMiddleware.getGuildConfig(channel.guild.id);
        const transcriptChannel:GuildChannel = guildConfig?.logChannelId && await channel.guild.channels.fetch(guildConfig.logChannelId).catch(() => null) || null;
        if (!transcriptChannel || !transcriptChannel.isTextBased()) {
            console.error("Transcript channel is not valid or not a text channel.");
            return false;
        }
        try {
            await transcriptChannel.send({ embeds: [embed], files: [attachment],components:[
                new ActionRowBuilder<any>().addComponents(urlButton)
            ] });
          // console.log(`Transcript saved successfully for ticket ${this.ticketId}`);
            return true;
        } catch (error) {
            console.error(`Failed to send transcript for ticket ${this.ticketId}:`, error);
            return false;
        }
    }


    genrateChannelTranscript = async (channel: BaseGuildTextChannel, fileName: String): Promise<genrateChannelTranscriptInterface> => {


        const sum_messages: Collection<string, Message> = new Collection()
        var last_id: string | undefined;
        while (true) {
            var fetchOptions = { limit: 100, before: last_id };
            if (!last_id) delete fetchOptions['before'];
            const messages = await channel.messages.fetch(fetchOptions);
            messages.forEach(d => sum_messages.set(d.id, d));
            last_id = messages.last()?.id;
            if (messages.size !== 100) break;
        }

        // @ts-ignore
        const file = await generateFromMessages(sum_messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp), channel, {
            returnType: ExportReturnType.Attachment, filename: fileName, poweredBy: false, saveImages: true, footerText: "Exported {number} message{s}", hydrate: true, favicon: channel.guild.icon && channel.guild.iconURL() || client.user.displayAvatarURL()
        });
        const membersIntransCript = {};
        sum_messages.map(o => {
            if (!membersIntransCript[o.author.id]) membersIntransCript[o.author.id] = 0;
            membersIntransCript[o.author.id] = membersIntransCript[o.author.id] + 1;
        });


        sum_messages.clear();
        return {
            file: file,
            members: Object.keys(membersIntransCript).map(d => ({ id: d, value: membersIntransCript[d] })).sort((a, b) => b.value - a.value)
        }

    }
    async deleteTicket(channel: BaseGuildTextChannel) {
        this.onDelete = true;
        this.deleted = true;
        this.close = true; // Ensure the ticket is closed before deletion
        await this.save();
        try {
       
            await channel.delete(`Ticket deleted owner: ${this.ownerId}`);
            this.clearCache();
            return true;
        } catch (error) {
            this.onDelete = false; // Reset the flag if deletion fails
            console.error(`Failed to delete ticket channel ${channel.id}:`, error);
            return false;
        }
    }




    set addedRoles(roles: string[]) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).addedRoles = roles;
            this.markAsModified("addedRoles");
        } else {
            (this.ticket as TicketSQL).addedRoles = cleanJsonArrayString(JSON.stringify(roles));
        }
    }

    get ticketName(): string {
        return this.ticket.ticketName;
    }

    set ticketName(name: string) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).ticketName = name;
            this.markAsModified("ticketName");
        } else {
            (this.ticket as TicketSQL).ticketName = name;
        }
    }

    get ticketNumber(): number {
        return this.ticket.ticketNumber;
    }

    set ticketNumber(number: number) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).ticketNumber = number;
            this.markAsModified("ticketNumber");
        } else {
            (this.ticket as TicketSQL).ticketNumber = number;
        }
    }

    get ticketStaff(): string | null {
        return this.ticket.ticketStaff;
    }

    set ticketStaff(staff: string | null) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).ticketStaff = staff;
            this.markAsModified("ticketStaff");
        } else {
            (this.ticket as TicketSQL).ticketStaff = staff;
        }
    }

    get claim(): boolean {
        return this.ticket.claim;
    }

    set claim(value: boolean) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).claim = value;
            this.markAsModified("claim");
        } else {
            (this.ticket as TicketSQL).claim = value;
        }
    }
    get secondTicketMessage(): string | null {
        if (this.type === "MongoDB") {
            return (this.ticket as ITicket).secondTicketMessage || null;
        } else {
            return (this.ticket as TicketSQL).secondTicketMessage || null;
        }
    }
    set secondTicketMessage(message: string | null) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).secondTicketMessage = message;
            this.markAsModified("secondTicketMessage");
        } else {
            (this.ticket as TicketSQL).secondTicketMessage = message;
        }
    }

    get close(): boolean {
        return this.ticket.close;
    }

    set close(value: boolean) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).close = value;
            this.markAsModified("close");
        } else {
            (this.ticket as TicketSQL).close = value;
        }
    }

    get deleted(): boolean {
        return this.ticket.deleted;
    }

    set deleted(value: boolean) {
        if (this.type === "MongoDB") {
            (this.ticket as ITicket).deleted = value;
            this.markAsModified("deleted");
        } else {
            (this.ticket as TicketSQL).deleted = value;
        }
    }

    markAsModified(field: keyof ITicket) {
        if (this.ticket instanceof TicketMongo) {
            this.ticket.markModified(field);
        }
    }
    clearCache() {
        if (this.clearTimeout) {
            clearTimeout(this.clearTimeout);
            this.clearTimeout = null;
        }
        client.tickets.delete(this.ticketId);

    }
    formatTicket() {
        
        // @ts-ignore
        delete this.ticket.id;
       
        this.ticket.addedMembers = cleanJsonArrayString(JSON.stringify(this.ticket.addedMembers));
        this.ticket.addedRoles = cleanJsonArrayString(JSON.stringify(this.ticket.addedRoles));
    }

    async save() {
        if (this.type === "MongoDB") {
            return await this.ticket.save();
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            this.formatTicket();
            await TicketSQL.update(this.ticket, {
                where: { channelId: this.ticket.channelId },
                returning: true,
            });
            console.log(`Ticket ${this.ticketId} saved successfully.`);
            return this.ticket;
        } else {
            throw new Error("Unknown database type when saving ticket");
        }
    }
}
