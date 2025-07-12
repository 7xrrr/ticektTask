
import config from "./config.js";
import { Client, Collection, Options, parseEmoji, Partials } from "discord.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { RedisClientType } from "redis";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export let root = __dirname;

export class CustomClient extends Client {
    cooldowns: Collection<String, any> = new Collection();
    commands: Collection<String, any> = new Collection();
    slashCommands: Collection<String, any> = new Collection();
    selectMenus: Collection<String, any> = new Collection();
    modals: Collection<String, any> = new Collection();
    contextMenus: Collection<String, any> = new Collection();
    buttons: Collection<String, any> = new Collection();
    guildConfigs: Collection<String, GuildConfigWrapper> = new Collection();
    tickets: Collection<String, TicketWrapper> = new Collection();
    redis: RedisClientType;
    constructor(options: any) {
        super(options);
        this.once("ready", async () => {
            try {
                this.application.emojis.fetch().then((e) => console.log(`Emojis loaded: ${e.size}`));
            } catch (error) {
                console.error("Error fetching emojis:", error);

            }
 
        

        })
      



    }
    getEmoji = (emojiName, returnBlank: boolean) => {
        const emoji = this.application.emojis.cache.find(
            (e) => e.name?.toLowerCase().trim() === emojiName?.toLowerCase().trim()
        );
        return emoji ? emoji.toString() : returnBlank ? "" : null
    };
    createEmoji = async (emojiName: string, emojiUrl: string, force: boolean = false) => {

        const emoji = this.getEmoji(emojiName, false);
        if (emoji) {
            return emoji
        } else {

            const createdEmoji = await this.application.emojis.create({
                attachment: emojiUrl,
                name: emojiName,
            });
            console.log(`Emoji ${createdEmoji.name} created`);
            return createdEmoji.toString();
        }
    }
    deleteEmoji = async (emojiName: string) => {
        const emoji = this.getEmoji(emojiName, false);
        const id = parseEmoji(emoji)?.id;
        if (emoji && id) {
            await this.application.emojis.delete(id);
            console.log(`Emoji ${emojiName} deleted`);
            return true;
        }
    }
    textValue = (key: string, value: string, noBractes: boolean = false): string => {


        return `- **${key}**: ${noBractes ? `${value}` : `\`${value}\``}\n`;
    }
    genrateUniqueId = (length: number = 16): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;
    }
    setCooldown = (key: string, value: any, time: number) => {
        if( this.cooldowns.has(key)) {
            return true; // Cooldown already exists
        }
        this.cooldowns.set(key, value);
        setTimeout(() => {
            this.cooldowns.delete(key);
        }, time);
        return false; // Cooldown set successfully
    }



}


export const client = new CustomClient({
    intents: 33539,
    partials: [Partials.Message, Partials.GuildMember, Partials.Channel, Partials.Reaction, Partials.User, Partials.ThreadMember],
    failIfNotExists: false,
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 100,
        ApplicationCommandManager: 100,
        ApplicationEmojiManager: 500,
        AutoModerationRuleManager: 100,
        BaseGuildEmojiManager: 100,
        DMMessageManager: 25,
        EntitlementManager: 100,
        GuildBanManager: 100,
        GuildEmojiManager: 100,
        GuildInviteManager: 100,
        GuildMemberManager: 100,
        GuildScheduledEventManager: 100,
        GuildStickerManager: 100,
        MessageManager: 1000,
        PresenceManager: 500000,
        ReactionUserManager: 100,
        GuildForumThreadManager: 100,
        GuildMessageManager: 10,
        GuildTextThreadManager: 100,
        StageInstanceManager: 100,
        ThreadManager: 100,
        ThreadMemberManager: 100,
        UserManager: 100,
        VoiceStateManager: 100,
    }),
});


import eventHandler from "./handlers/eventHandler.js";
import idkHowToCallThisHandler from "./handlers/idkHowToCallThisHandler.js";




import { DatabaseMiddleware } from "./core/databaseMiddleware.js";
import { GuildConfigWrapper } from "./core/guildConfig.js";
import { TicketWrapper } from "./core/ticketConfig.js";




(async () => {
    await idkHowToCallThisHandler.init();
    eventHandler.function();
    DatabaseMiddleware.connect().then(() => {
      
    })
   /* mongoose.connect(config.mongoDB, {
        useBigInt64: true,


    }).then(() => { console.log("Connected to MongoDB") }).catch((err) => { console.log(err) });
*/

    client.login(config.token);

})();

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
