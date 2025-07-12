import { ButtonBuilder, ButtonStyle } from "discord.js";

export default {
          lockButton: new ButtonBuilder() .setCustomId("ticket_close") .setStyle(ButtonStyle.Danger) .setLabel("Close Ticket") .setEmoji("🔒"),
          unLockButton: new ButtonBuilder().setCustomId("ticket_unlock").setStyle(ButtonStyle.Success).setLabel("Unlock Ticket").setEmoji("🔓"),
          openButton:  new ButtonBuilder().setCustomId("ticket_open").setStyle(ButtonStyle.Secondary).setLabel("Open Ticket").setEmoji("🎫"),
          deleteTicket: new ButtonBuilder().setCustomId("ticket_delete").setStyle(ButtonStyle.Danger).setLabel("Delete Ticket").setEmoji("🗑️"),
          getTicketUrl: new ButtonBuilder().setCustomId("showurl").setStyle(ButtonStyle.Secondary).setEmoji("🔗"),
          
}

