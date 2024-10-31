import express from "express";
import { EmailService } from "./email.service";
import csurf from "csurf";
import cookieParser from "cookie-parser";

export class BLLRouter {
   #schema;
   #faqList;
   #images;
   #middleware;
   #emails = new EmailService();
   #csrf = csurf({ cookie: true });
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
      this.#middleware = middleware;
      this.router = express.Router();
      this.init();
   }

   init() {
      this.router.use(cookieParser());
      this.router.use(express.json());

      this.router.get("/", this.#csrf, (req, res) => {
         res.render("home", {
            images: this.#images,
            faqSchema: this.#schema,
            faqList: this.#faqList,
            isProduction: process.env.ENVIRONMENT === "production",
            csrfToken: req.csrfToken(),
         });
      });

      this.router.post("/submit", this.#csrf, this.#middleware.rateLimit(1, 10), async (req, res, next) => {
         try {
            const success = await this.#emails.sendEmail(req.body);

            if (success) {
               res.status(200).json({
                  status: "success",
                  message: "Quote request sent"
               });
            } else {
               res.status(500).json({
                  status: "error",
                  message: "Something went wrong"
               })
            }
         } catch (err) {
            next(err);
         }
      });
   }
}
