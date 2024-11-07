import { REST } from "@discordjs/rest";
import { Routes, RESTPostAPICurrentUserCreateDMChannelResult } from "discord-api-types/v10";
export default class DiscordClient {
   private rest: REST;

   constructor() {
      this.rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
   }

   private createDM() {
      return this.rest.post(Routes.userChannels(), {
         body: { recipient_id: process.env.DISCORD_ID! }
      }) as Promise<RESTPostAPICurrentUserCreateDMChannelResult>;
   }

   public async sendMessage(message: string) {
      const channel = await this.createDM();
      return this.rest.post(Routes.channelMessages(channel.id), {
         body: { content: message },
      });
   }
}