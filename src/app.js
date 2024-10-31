import express from "express";
import { engine } from "express-handlebars";
import fs from "fs";
import { middleware } from "./middleware";
import { BLLRouter } from "./router";

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
app.use(express.urlencoded({ extended: true }));

const Router = new BLLRouter(faqSchema, imageList);

app.use(middleware.removePoweredBy);
app.use(Router.router);

export default app;
