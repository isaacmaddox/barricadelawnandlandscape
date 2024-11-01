/**
 * @typedef {{
 *    name: string;
 *    email: string;
 *    address: string;
 *    address2: string;
 *    city: string;
 *    state: string;
 *    zip: string;
 *    propertyType: string;
 *    phone: string;
 *    cantext: string;
 *    comments: string;
 *    how: string;
 * }} QuoteFormBody
 */

import { Resend } from "resend";
import fs from "fs";
import { randomUUID } from "crypto";

const howOptions = {
   "social-media": "Social Media",
   referral: "Referral",
   website: "Website",
   other: "Other",
};

export class EmailService {
   #resend = new Resend(process.env.RESEND_KEY);
   #requestTemplate = fs.readFileSync("email_templates/quote_request.html").toString("utf-8");
   #confirmTemplate = fs.readFileSync("email_templates/request_confirmation.html").toString("utf-8");

   /**
    * Render one of the email templates with the appropriate data
    * 
    * @param {"request" | "conf"} template 
    * @param {QuoteFormBody} body 
    */
   #render(template, body) {
      let address;

      if (body.address2 !== "") {
         address = body.address + "<br/>" + body.address2 + "<br/>" + body.city + ", " + body.state + " " + body.zip;
      } else {
         address = body.address + "<br/>" + body.city + ", " + body.state + " " + body.zip;
      }

      if (template === "request") {
         return this.#requestTemplate
            .replace(/{{NAME}}/g, body.from)
            .replace(/{{ADDRESS}}/g, address)
            .replace(/{{EMAIL}}/g, body.email)
            .replace(/{{PHONE}}/g, body.phone)
            .replace(/{{CANTEXT}}/g, body.cantext ? "can" : "can not")
            .replace(/{{COMMENTS}}/g, body.comments)
            .replace(/{{HOW}}/g, howOptions[body.how] ?? "Unknown")
            .replace(/{{TYPE}}/g, body.type[0].toUpperCase() + body.type.slice(1))
            .replace(
               /{{MAPS_URL}}/g,
               `https://www.google.com/maps/search/?api=1&query=${address
                  .replace(/ /g, "+")
                  .replace(/,/g, "%2C")
                  .replace(/<br\/>/g, "+")}`
            );
      } else {
         return this.#confirmTemplate
            .replace(/{{NAME}}/g, body.from)
            .replace(/{{ADDRESS}}/g, address)
            .replace(/{{EMAIL}}/g, body.email)
            .replace(/{{PHONE}}/g, body.phone)
            .replace(/{{CANTEXT}}/g, body.cantext ? "can" : "can not")
            .replace(/{{COMMENTS}}/g, body.comments)
            .replace(/{{HOW}}/g, howOptions[body.how] ?? "Unknown")
            .replace(/{{TYPE}}/g, body.type[0].toUpperCase() + body.type.slice(1))
            .replace(
               /{{MAPS_URL}}/g,
               `https://www.google.com/maps/search/?api=1&query=${address
                  .replace(/ /g, "+")
                  .replace(/,/g, "%2C")
                  .replace(/<br\/>/g, "+")}`
            );
      }
   }

   /**
    * Sanitize the body provided by the user to prevent injection
    * in email templates
    * 
    * @param {string} body The raw data from the POST request
    * @returns A sanitized version of the body
    */
   #sanitize(body) {
      let newBody = {};

      for (const key of Object.keys(body)) {
         newBody[key] = body[key].replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
      }

      return newBody;
   }

   /**
    * Send sanitized emails based on the form POST
    * 
    * @param {QuoteFormBody} body The raw data from the POST request
    * @returns {Promise<boolean>} If successful
    */
   async sendEmail(body) {
      const newBody = this.#sanitize(body);

      let { data, error } = await this.#resend.emails.send({
         from: `${newBody.from} <${process.env.REQ_FROM_EMAIL}>`,
         to: [process.env.REQ_TO_EMAIL],
         reply_to: newBody.email,
         subject: "Quote Request",
         html: this.#render("request", newBody),
         headers: {
            "X-Entity-Ref-ID": randomUUID()
         }
      });

      if (error) {
         return false;
      }

      await this.#resend.emails.send({
         from: `Barricade Lawn and Landscpae <${process.env.CONF_FROM_EMAIL}>`,
         to: [newBody.email],
         reply_to: process.env.REQ_TO_EMAIL,
         subject: "Confirmation of Request",
         html: this.#render("conf", newBody)
      });

      return true;
   }
}