const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');

const app = express();
app.set('view engine', 'pug');
app.set('views', '../../views');
app.use(express.json());
app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });

app.get('/', csrfProtection, (req, res) => {
    res.render('form', { csrfToken: req.csrfToken() });
})

app.use('/');

export const handler = serverless(app);