import { Router } from 'express';

const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

const router = Router();

const csrfProtection = csrf({ cookie: true });

router.get('/', csrfProtection, (req, res) => {
    res.render('form', { csrfToken: req.csrfToken() });
})

app.use(express.json());
app.use(cookieParser());
app.use('/', router);

export const handler = serverless(app);