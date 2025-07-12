import { client } from "../index.js";
import { GuildConfigMongo, GuildConfigSQL, IGuildConfig } from "../models/guildConfig.js";
import { cleanJsonArrayString } from "../utils/tools.js";


export class GuildConfigWrapper {
    public guildId: string;
    public guild: GuildConfigSQL | IGuildConfig;

    public type: "MongoDB" | "MySQL" | "SQLite";

    constructor(rawGuild: GuildConfigSQL | IGuildConfig, type: "MongoDB" | "MySQL" | "SQLite") {

        this.guildId = rawGuild.guildId;
        this.type = type;
        this.guild = rawGuild;
        if (!client.guildConfigs.get(this.guildId)) {
            client.guildConfigs.set(this.guildId, this);
        };


    }
    get staffRoles(): string[] {
        if (this.type === "MongoDB") {
            return this.guild.staffRoles as string[];

        }
        else {
            const roles = cleanJsonArrayString(this?.guild?.staffRoles);

            if (typeof roles === "string") {
                if (!roles) return [];
                // @ts-ignore
                return JSON.parse(roles) as string[];
            }
            return roles as string[];

        }


    }
    get ticketNumber(): number {
        if (this.type === "MongoDB") {
            return this.guild.ticketNumber as number;
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            return this.guild.ticketNumber as number;
        } else {
            throw new Error("Unknown database type when getting ticketNumber");
        }
    }
    set ticketNumber(number: number) {
        if (this.type === "MongoDB") {
            (this.guild as IGuildConfig).ticketNumber = number;
            this.markAsModified("ticketNumber");
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            (this.guild as GuildConfigSQL).ticketNumber = number;
        } else {
            throw new Error("Unknown database type when setting ticketNumber");
        }
    }
    set staffRoles(roles: string[]) {
        if (this.type === "MongoDB") {
            (this.guild as IGuildConfig).staffRoles = roles;
            this.markAsModified("staffRoles");
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            (this.guild as GuildConfigSQL).staffRoles = cleanJsonArrayString(JSON.stringify(roles));
        } else {
            throw new Error("Unknown database type when setting staffRoles");
        }
    }
    get ticketCategory(): string | null {
        if (this.type === "MongoDB") {
            return this.guild.ticketCategory as string | null;
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            return this.guild.ticketCategory as string | null;
        } else {
            throw new Error("Unknown database type when getting ticketCategory");
        }
    }
    set ticketCategory(category: string | null) {
        if (this.type === "MongoDB") {
            (this.guild as IGuildConfig).ticketCategory = category;
            this.markAsModified("ticketCategory");
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            (this.guild as GuildConfigSQL).ticketCategory = category;
        } else {
            throw new Error("Unknown database type when setting ticketCategory");
        }
    }

    get logChannelId(): string | null {
        if (this.type === "MongoDB") {
            return this.guild.logChannelId as string | null;

        } else if (this.type === "MySQL" || this.type === "SQLite") {
            return this.guild.logChannelId as string | null;
        } else {
            throw new Error("Unknown database type when getting logChannelId");
        }
    }

    set logChannelId(channelId: string | null) {
        if (this.type === "MongoDB") {
            (this.guild as IGuildConfig).logChannelId = channelId;
            this.markAsModified("logChannelId");
        } else if (this.type === "MySQL" || this.type === "SQLite") {
            (this.guild as GuildConfigSQL).logChannelId = channelId;
        } else {
            throw new Error("Unknown database type when setting logChannelId");
        }
    }
    markAsModified(field: keyof IGuildConfig) {
        if (this.guild instanceof GuildConfigMongo) {
            this.guild.markModified(field);
        }
    }
    formateGuild() {
        this.guild.staffRoles = cleanJsonArrayString(JSON.stringify(this.guild.staffRoles));
        // @ts-ignore
        delete this.guild.id;
    
    }
    async save() {
        if (this.type === "MongoDB") {
            return await this.guild.save();
        } else if (this.type === "MySQL" || this.type === "SQLite") {

            this.formateGuild();
            await GuildConfigSQL.update(this.guild, {
                where: { guildId: this.guildId },
                returning: true,
            })
            //   console.log(`Guild config for ${this.guildId} saved successfully.`);
            return this.guild; // Return the updated guild object
        } else {
            throw new Error("Unknown database type when saving guild config");
        }
    }

}
