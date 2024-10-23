import { Router } from 'express';
import { Resend } from 'resend';

const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const morgan = require("morgan");

const app = express();
const upload = multer();

const resend = new Resend(process.env.RESEND_KEY);
app.set('view engine', 'ejs');
app.set('views', 'page_views');

const router = Router();

const csrfProtection = csrf({ cookie: true });

const emailTemplate = fs.readFileSync('email_templates/quote_request.html').toString();
const reportTemplate = fs.readFileSync('email_templates/request_confirmation.html').toString();

const imageList = fs.readdirSync("public/images/carousel");

const faqSchema = fs.readFileSync("page_views/faqs.json").toString("utf-8");

const howOptions = {
    "social-media": "Social Media",
    "referral": "Referral",
    "website": "Website",
    "other": "Other"
}

const sanitizeBody = (body) => {
    let keys = Object.keys(body);
    let newBody = body;

    keys.forEach(key => {
        newBody[key] = body[key].replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\n/g, '<br/>');
    })

    return newBody;
}

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
        .replace(/{{COMMENTS}}/g, body.comments)
        .replace(/{{HOW}}/g, howOptions[body.how] ?? "Unknown")
        .replace(/{{TYPE}}/g, body.type[0].toUpperCase() + body.type.slice(1))
        .replace(/{{MAPS_URL}}/g, `https://www.google.com/maps/search/?api=1&query=${address.replace(/ /g, '+').replace(/,/g, "%2C").replace(/<br\/>/g, '+')}`);
}

const generateReport = (body) => {
    let address;

    if (body.address2 !== "") {
        address = body.address + "<br/>" + body.address2 + "<br/>" + body.city + ", " + body.state + " " + body.zip
    } else {
        address = body.address + "<br/>" + body.city + ", " + body.state + " " + body.zip
    }

    return reportTemplate
        .replace(/{{NAME}}/g, body.from)
        .replace(/{{ADDRESS}}/g, address)
        .replace(/{{EMAIL}}/g, body.email)
        .replace(/{{PHONE}}/g, body.phone)
        .replace(/{{CANTEXT}}/g, body.cantext ? "can" : "can not")
        .replace(/{{COMMENTS}}/g, body.comments)
        .replace(/{{HOW}}/g, howOptions[body.how] ?? "Unknown")
        .replace(/{{TYPE}}/g, body.type[0].toUpperCase() + body.type.slice(1))
        .replace(/{{MAPS_URL}}/g, `https://www.google.com/maps/search/?api=1&query=${address.replace(/ /g, '+').replace(/,/g, "%2C").replace(/<br\/>/g, '+')}`);
}

router.get('/', csrfProtection, (req, res) => {
    res.render('home', {
        csrfToken: req.csrfToken(),
        images: imageList,
        env: process.env.ENVIRONMENT,
        faqSchema: faqSchema,
        faqList: JSON.parse(faqSchema).mainEntity,
    });
})

router.post('/submit', upload.none(), csrfProtection, async (req, res) => {

    /**
     * TEMPORARILY DISABLED
     * 
     * DDoS attacks forced us to disable this feature
     */

    res.status(503).json({
        message: "This service is temporarily unavailable"
    })

    // Clean out any HTML entered by users
    const body = sanitizeBody(req.body);
    if (req.cookies["quote-request"]) {
        return res.status(403).json({
            message: "You can't send another request right now",
        })
    }

    let { data, error } = await resend.emails.send({
        from: `${body.from} <${process.env.REQ_FROM_EMAIL}>`,
        to: [process.env.REQ_TO_EMAIL],
        reply_to: body.email,
        subject: "Quote Request",
        html: generateEmail(body),
        headers: {
            'X-Entity-Ref-ID': crypto.randomUUID()
        }
    });

    if (error) {
        return res.status(500).send({ error: error })
    }

    let { reportData, _ } = await resend.emails.send({
        from: `Barricade Lawn and Landscape <${process.env.CONF_FROM_EMAIL}>`,
        to: [body.email],
        reply_to: process.env.REQ_TO_EMAIL,
        subject: "Confirmation of Request",
        html: generateReport(body),
    });

    res.cookie("quote-request", new Date().toString(), {
        maxAge: 86400 * 1000,
        httpOnly: true,
    }).send({ message: "Quote request sent.", request: data, report: reportData });
})

// Handle CSRF errors, respond with valid JSON
router.use((err, _, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)

    res.status(403).send({ error: "Bad CSRF token provided." });
})

app.use(morgan("[:method] :path (:status) - :remote-addr"));
app.use(express.json());
app.use(cookieParser());
app.use('/', router);

export const handler = serverless(app);