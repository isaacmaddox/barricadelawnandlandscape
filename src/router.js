import express from "express";

export class BLLRouter {
   #schema;
   #faqList;
   #images;
   router;

   /**
    * @param {string} schema
    * @param {string[]} images
    */
   constructor(schema, images) {
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
   }
}
