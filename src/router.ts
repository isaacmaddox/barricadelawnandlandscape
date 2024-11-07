import express, { Request, Response, NextFunction, Router, json } from "express";
import { EmailService, QuoteFormBody } from "./email.service";
import cookieParser from "cookie-parser";
import { Middleware } from "./middleware";
import DiscordClient from "./discord.client";

export class BLLRouter {
   private faqList: any[];
   private emails = new EmailService();
   public router: Router;
   public static requiredFields = ["_csrf", "from", "email", "address", "address2", "city", "state", "zip", "type", "phone", "cantext", "comments", "how"];

   constructor(private schema: string, private images: string[], private middleware: Middleware, private discord: DiscordClient) {
      this.images = images;
      this.schema = schema;
      this.faqList = JSON.parse(schema).mainEntity;
      this.middleware = middleware;
      this.router = express.Router();
      this.init();
   }

   init() {
      this.router.use(cookieParser());

      this.router.get("/", this.middleware.csrf, (req, res) => {
         res.render("home", {
            images: this.images,
            faqSchema: this.schema,
            faqList: this.faqList,
            isProduction: process.env.ENVIRONMENT === "production",
            csrfToken: req.csrfToken(),
         });
      });

      this.router.post(
         "/submit",
         this.middleware.csrf,
         this.middleware.rateLimit(1, 10),
         async (req: Request, res: Response, next: NextFunction) => {
            try {
               const body = req.body as QuoteFormBody;

               for (const key of BLLRouter.requiredFields) {
                  if (!body[key]) {
                     res.status(400).json({
                        status: "error",
                        message: "Please fill in all required fields.",
                     });
                  }
               }

               if (!body.address.match(/^[0-9]/)) {
                  await this.discord.sendMessage(`
                     # Bad Request\n` +
                     `**Address**: ${body.address}\n` +
                     `**IP**: ${req.headers["x-nf-client-connection-ip"]}
                     \`\`\`json\n${JSON.stringify(body, null, 2)}\`\`\`
                  `);

                  this.middleware.addToBlacklist(req.headers["x-nf-client-connection-ip"] as string);

                  res.status(400).json({
                     status: "error",
                     message: "We couldn't process your form. Please try again.",
                  });
                  return;
               }

               const success = await this.emails.sendEmail(req.body);

               if (success) {
                  res.status(200).json({
                     status: "success",
                     message: "Quote request sent",
                  });
               } else {
                  res.status(500).json({
                     status: "error",
                     message: "Something went wrong",
                  });
               }
            } catch (err) {
               next(err);
            }
         }
      );
   }
}
