import colors from "colors";
import { log } from "../../utils/logging.js";
import { Channel, GuildChannel } from "discord.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";



export default {
    name: "channelDelete",
    once: false,
    function: async function (channel: GuildChannel) {
        if(!channel.guildId) return; // Ensure the channel is part of a guild
        const ticket = await DatabaseMiddleware.getTicket(channel.id);
        if (!ticket) return;
        if (ticket.deleted) return; // If the ticket is already marked as deleted, do nothing.
        ticket.deleted = true;
        await ticket.save().catch(err => console.error("Error saving ticket:", err));
        ticket.clearCache();
    
    
     
        
    },
} as any;
