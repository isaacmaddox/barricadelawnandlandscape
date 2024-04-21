import { Router } from 'express';
import { Resend } from 'resend';

const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer();

const resend = new Resend(process.env.RESEND_KEY);
app.set('view engine', 'ejs');
app.set('views', 'page_views');

const router = Router();

const csrfProtection = csrf({ cookie: true });

const emailTemplate = fs.readFileSync('email_templates/quote_request.html').toString();

const howOptions = {
    "current-client": "From a current client",
    "advertising": "Saw the truck and read the poster"
};

const generateEmail = (body) => {
    let address;

    if (body.address2 !== "") {
        address = body.address + "<br/>" + body.address2 + "<br/>" + body.city + ", " + body.state + " " + body.zip
    } else {
        address = body.address + "<br/>" + body.city + ", " + body.state + " " + body.zip
    }

    return emailTemplate
        .replace(/{{NAME}}/g, body.from)
        .replace(/{{ADDRESS}}/g, address)
        .replace(/{{EMAIL}}/g, body.email)
        .replace(/{{PHONE}}/g, body.phone)
        .replace(/{{CANTEXT}}/g, body.cantext ? "can" : "can not")
        .replace(/{{COMMENTS}}/g, body.comments.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\n/g, '<br/>'))
        .replace(/{{HOW}}/g, howOptions[body.how] ?? "Unknown")
        .replace(/{{TYPE}}/g, body.type[0].toUpperCase() + body.type.slice(1))
        .replace(/{{MAPS_URL}}/g, `https://www.google.com/maps/search/?api=1&query=${address.replace(/ /g, '+').replace(/,/g, "%2C").replace(/<br\/>/g, '+')}`);
}

router.get('/', csrfProtection, (req, res) => {
    res.render('home', { csrfToken: req.csrfToken() });
})

router.post('/submit', upload.none(), csrfProtection, async (req, res) => {
    let { data, error } = await resend.emails.send({
        from: `${req.body.from} <onboarding@resend.dev>`,
        to: ["isaacmaddox05@gmail.com"],
        subject: "Quote Request",
        html: generateEmail(req.body),
    });

    if (error) {
        return res.status(500).send({ error: error })
    }

    res.send({ message: "Quote request sent.", data: data });
})

// Handle CSRF errors, respond with valid JSON
router.use((err, _, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    res.status(403).send({ error: "Bad CSRF token provided." });
})

app.use(express.json());
app.use(cookieParser());
app.use('/', router);

export const handler = serverless(app);