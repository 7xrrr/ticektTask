import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js"; // Import CommandInteraction type
import ms from "ms";
import buttons from "../utils/buttons.js";
import { client } from "../index.js";


export default {
    // @ts-ignore
    id: buttons.getTicketUrl.data.custom_id,
    cooldown: ms("5s"), // Set a cooldown of 5 seconds
    function: async function (interaction: ButtonInteraction) {
        if (!interaction.inCachedGuild()) return;
        if (client.setCooldown(`ticketurl_${interaction.message.id}`, true, 2000)) return interaction.deferUpdate();
        await interaction.deferUpdate();
        let attachment = interaction.message.attachments.find(d => d.name.toLowerCase().endsWith(`.html`));
        if (!attachment)
            return interaction.reply({ ephemeral: true, content: `No attachment found` });
        const base64URL = Buffer.from(attachment.url).toString('base64');
        let url = `https://7xrrr.github.io/renderHtml/index.html?view?id=${base64URL}`;
        let row: any = new ActionRowBuilder()
            // @ts-ignore
            .addComponents(interaction.message.components[0].components[0], new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(`View`)
                .setEmoji(`🔗`)
                .setURL(url));
        await interaction.message.edit({ components: [row] }).catch((err) => null);
        await interaction.deferUpdate().catch((err) => null);
        setTimeout(async () => {
            // @ts-ignore
            row = new ActionRowBuilder().addComponents(interaction.message.components[0].components[0]);
            await interaction.message.edit({
                components: [row],
            }).catch((err) => null);
        }, ms(`60s`));









    }
};
