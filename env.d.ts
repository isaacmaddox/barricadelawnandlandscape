declare namespace NodeJS {
   export interface ProcessEnv {
      RESEND_KEY: string;
      REQ_FROM_EMAIL: string;
      REQ_TO_EMAIL: string;
      CONF_FROM_EMAIL: string;
      NODE_ENV: "development" | "production";
      DISCORD_TOKEN: string;
      DISCORD_ID: string;
   }
}
