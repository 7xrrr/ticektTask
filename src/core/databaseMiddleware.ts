import mongoose from "mongoose";
import config from "../config.js";
import { Sequelize } from 'sequelize';
import { GuildConfigMongo, GuildConfigSQL, initGuildConfigSQL } from "../models/guildConfig.js";
import { GuildConfigWrapper } from "./guildConfig.js";
import { client } from "../index.js";
import { initTicketSQL, TicketMongo, TicketSQL } from "../models/ticket.js";
import { TicketWrapper } from "./ticketConfig.js";
import { GuildChannel } from "discord.js";

export class DatabaseMiddleware {
    public static MongoDB = config?.database?.mongoDB;
    public static MySQL = config?.database?.mySQL;
    public static SQLite = config?.database?.sqlite;
    public static useMongoDB = this.MongoDB?.useMongoDB || false;
    public static useMySQL = this.MySQL?.useMySQL || false;
    public static useSQLite = this.SQLite?.useSQLite || false;
    public static sequelize: Sequelize = null;
    public static database = null;
    public static dataBaseType: "MongoDB" | "MySQL" | "SQLite" | null = null;
    static async connect() {
        if (!this.useMongoDB && !this.useMySQL && !this.useSQLite) {
            throw new Error("No database selected. Please enable one of the databases in the config.");
        }
        if (this.useMongoDB) {
            mongoose.connect(this.MongoDB.mongoDB, {
                useBigInt64: true,
            }).then(() => { console.log("Connected to MongoDB") }).catch((err) => { console.log(err) });
            this.database = mongoose.connection; // Store the mongoose connection in the database property
            this.dataBaseType = "MongoDB"; // Set the database type to MongoDB
        } else if (this.useMySQL) {
            this.sequelize = new Sequelize(
                this.MySQL.database,
                this.MySQL.user,
                this.MySQL.password,
                {
                    host: this.MySQL.host,
                    port: this.MySQL.port,
                    dialect: "mysql",
                    logging: false,
                }
            );
            await this.sequelize.authenticate()
                .then(() => console.log("Connected to MySQL"))
                .catch((err) => console.error("Unable to connect to MySQL:", err));
            this.database = this.sequelize; // Store the sequelize instance in the database property
            this.dataBaseType = "MySQL"; // Set the database type to MySQL
        } else if (this.useSQLite) {
            this.sequelize = new Sequelize({
                dialect: 'sqlite',
                storage: this.SQLite.storage,
                logging: false,
            });
            this.database = this.sequelize;
            this.dataBaseType = "SQLite";
            await this.sequelize.authenticate()
                .then(() => console.log("Connected to SQLite"))
                .catch((err) => console.error("Unable to connect to SQLite:", err));
        }
        if (this.sequelize && (this.dataBaseType === "MySQL" || this.dataBaseType === "SQLite")) {
            initGuildConfigSQL(this.sequelize);
            initTicketSQL(this.sequelize);
            GuildConfigSQL.sequelize.sync({ alter: true, })
            TicketSQL.sequelize.sync({ alter: true, })
            console.log("Sequelize models synced successfully.");

        }
    }

    static getDatabaseType() {
        if (this.useMongoDB) return "MongoDB";
        if (this.useMySQL) return "MySQL";
        if (this.useSQLite) return "SQLite";
        return "No database selected";
    }
    static async getGuildConfig(guildId: string, create: boolean = false) {
        const guildCache = client.guildConfigs.get(guildId);
        if (guildCache) { return guildCache; }
        if (this.dataBaseType === "MongoDB") {
            const guildConfig = await GuildConfigMongo.findOne({ guildId: guildId });
            if (!guildConfig && create) {
                const newGuildConfig = new GuildConfigMongo({ guildId: guildId });
                await newGuildConfig.save();
                return new GuildConfigWrapper(newGuildConfig, "MongoDB");
            }
            return guildConfig ? new GuildConfigWrapper(guildConfig, "MongoDB") : null;
        } else {
            if (!this.sequelize) {
                throw new Error("Sequelize is not initialized. Please connect to the database first.");
            }

            await this.sequelize.sync();
            const guildConfig = await GuildConfigSQL.findOne({ where: { guildId: guildId }, raw: true });
            if (!guildConfig && create) {
                const newGuildConfig = await GuildConfigSQL.create({ guildId: guildId }, { raw: true, returning: true });
                return new GuildConfigWrapper(newGuildConfig.dataValues, this.dataBaseType);
            }
            return guildConfig ? new GuildConfigWrapper(guildConfig, this.dataBaseType) : null;
        }
    }
    static async getAllGuildConfigs() {
        if (this.dataBaseType === "MongoDB") {
            return (await GuildConfigMongo.find({})).map(guild => {
                const cache = client.guildConfigs.get(guild.guildId);
                if (cache) {
                    return cache;
                }
                return new GuildConfigWrapper(guild, this.dataBaseType);
            });
        } else {
            if (!this.sequelize) {
                throw new Error("Sequelize is not initialized. Please connect to the database first.");
            }
            return (await GuildConfigSQL.findAll({ raw: true })).map(guild => {
                const cache = client.guildConfigs.get(guild.guildId);
                if (cache) {
                    return cache;
                }
                return new GuildConfigWrapper(guild, this.dataBaseType);
            });
        }
    }
    static async createTicket(channel: GuildChannel, ownerId: string, ticketNumber: number) {
        if (this.dataBaseType === "MongoDB") {
            const newTicket = new TicketMongo({
                channelId: channel.id,
                guildId: channel.guild.id,
                ownerId: ownerId,
                addedMembers: [],
                addedRoles: [],
                ticketName: channel.name,
                ticketNumber: ticketNumber,
                ticketStaff: null,
                claim: false,
                close: false,
                deleted: false
            });
            await newTicket.save();
            return new TicketWrapper(newTicket, this.dataBaseType);
        } else {
            if (!this.sequelize) {
                throw new Error("Sequelize is not initialized. Please connect to the database first.");
            }
            await this.sequelize.sync();
            const newTicket = await TicketSQL.create({
                channelId: channel.id,
                guildId: channel.guild.id,
                ownerId: ownerId,
                addedMembers: [],
                addedRoles: [],
                ticketName: channel.name,
                ticketNumber: ticketNumber,
                ticketStaff: null,
                claim: false,
                close: false,
                deleted: false
            }, { raw: true });
 
            return new TicketWrapper(newTicket.dataValues, this.dataBaseType);
        }



    }
    static async getTicket(channelId: string):Promise<TicketWrapper> {
        console.log("Getting ticket for channel:", channelId);
        const ticketCache = client.tickets.get(channelId);
        if (ticketCache) { return ticketCache; }
        if (this.dataBaseType === "MongoDB") {
            const ticket = await TicketMongo.findOne({ channelId: channelId });
            if (!ticket) return null;
            return new TicketWrapper(ticket, this.dataBaseType);
        } else {
            if (!this.sequelize) {
                throw new Error("Sequelize is not initialized. Please connect to the database first.");
            }
            await this.sequelize.sync();
            const ticket = await TicketSQL.findOne({ where: { channelId: channelId }, raw: true });
            if (!ticket) return null;
         

            return new TicketWrapper(ticket, this.dataBaseType);
        }
    }
    static async getTicketByOwnerId(ownerId: string, guildId: string) {
        const ticketCache = client.tickets.find(e => e.ownerId === ownerId && !e.close && !e.deleted && e.guildId === guildId);
        if (ticketCache) { return ticketCache; }
        if (this.dataBaseType === "MongoDB") {
            const ticket = await TicketMongo.findOne({ ownerId: ownerId, deleted: false, close: false, guildId: guildId });
            if (!ticket) return null;
            return new TicketWrapper(ticket, this.dataBaseType);
        } else {
            if (!this.sequelize) {
                throw new Error("Sequelize is not initialized. Please connect to the database first.");
            }
            await this.sequelize.sync();
            const ticket = await TicketSQL.findOne({ where: { ownerId: ownerId, close: false, deleted: false, guildId: guildId }, raw: true });
       
            if (!ticket) return null;
            return new TicketWrapper(ticket, this.dataBaseType);
        }

    }

}
