/**
 * File adapted from https://github.com/joschan21/pingpanda/blob/main/src/lib/discord-client.ts
 * 
 * Also see https://www.youtube.com/watch?v=txlPgQ3NbYg&ab_channel=Joshtriedcoding
 */

import { REST } from '@discordjs/rest';
import { Routes, RESTPostAPICurrentUserCreateDMChannelResult } from 'discord-api-types/v10';

export default class DiscordClient {
   private rest: REST;
   private DISCORD_ID = process.env.DISCORD_ID as string;

   constructor() {
      this.rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN as string);
   }

   private async createDM() {
      return this.rest.post(Routes.userChannels(), {
         body: {
            recipient_id: this.DISCORD_ID
         }
      }) as Promise<RESTPostAPICurrentUserCreateDMChannelResult>;
   }

   async sendMessage(message: string) {
      const channel = await this.createDM();

      this.rest.post(Routes.channelMessages(channel.id), {
         body: {
            content: message
         }
      });
   }
}