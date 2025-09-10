import { REST } from "@discordjs/rest";
import { RESTPostAPICurrentUserCreateDMChannelResult, Routes } from "discord-api-types/v10";
export default class DiscordClient {
    private rest: REST;

    constructor() {
        this.rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
    }

    private createDM() {
        return this.rest.post(Routes.userChannels(), {
            body: { recipient_id: process.env.DISCORD_ID! },
        }) as Promise<RESTPostAPICurrentUserCreateDMChannelResult>;
    }

    public async sendMessage(message: string) {
        try {
            const channel = await this.createDM();
            return this.rest.post(Routes.channelMessages(channel.id), {
                body: { content: message },
            });
        } catch (e) {
            console.error("Error trying to send Discord message:");
            console.error(e);
        }
    }
}
