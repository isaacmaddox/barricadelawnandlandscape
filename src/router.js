import express from "express";
import { middleware } from "./middleware";

export class BLLRouter {
   #schema;
   #faqList;
   #images;
   router;

   /**
    * @param {string} schema
    * @param {string[]} images
    * @param {import("./middleware").Middleware}
    */
   constructor(schema, images, middleware) {
      this.#images = images;
      this.#schema = schema;
      this.#faqList = JSON.parse(schema).mainEntity;
      this.router = express.Router();
      this.init();
   }

   init() {
      this.router.get("/", (req, res) => {
         res.render("home", {
            images: this.#images,
            faqSchema: this.#schema,
            faqList: this.#faqList,
            isProduction: process.env.ENVIRONMENT === "production",
         });
      });

      this.router.post("/submit", middleware.rateLimit(1, 10), (req, res) => {
         // res.redirect("/");
      });
   }
}
