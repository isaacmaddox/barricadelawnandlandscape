import express from "express";
import { engine } from "express-handlebars";
import fs from "fs";
import { Middleware } from "./middleware";
import { BLLRouter } from "./router";
import morgan from "morgan";
import DiscordClient from "./discord.client";
const faqSchema = fs.readFileSync("src/views/faqs.json").toString("utf-8");
const imageList = [
   "AA_truck.jpg",
   "AB_Flower_Bed.png",
   "AC_Rock_JB.jpg",
   "AD_Mulch.png",
   "AE_Flowerbed_SB.jpg",
   "AF_Powerwash.png",
   "AG_Push_Mow.png",
   "AH_Acre_Mow.jpg",
];

const app = express();
app.engine(
   ".hbs",
   engine({
      extname: ".hbs",
   })
);
app.set("view engine", ".hbs");
app.set("views", "src/views");

const discord = new DiscordClient();
const middleware = new Middleware(discord);
const Router = new BLLRouter(faqSchema, imageList, middleware, discord);

app.use(
   morgan(function (tokens, req, res) {
      return [
         `${req.headers["x-nf-client-connection-ip"]} -`,
         `[${tokens.method(req, res)}]`,
         tokens.url(req, res),
         `(${tokens.status(req, res)})`,
      ].join(" ");
   })
);
app.use(express.json());
app.use(middleware.blackList);
app.use(middleware.removePoweredBy);
app.use(Router.router);
app.use(middleware.notFound);
app.use(middleware.csrfError);
app.use(middleware.errors);

export default app;
