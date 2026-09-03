const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const nodemailer = require("nodemailer");

const config = require("../services/config.js").getConfig();
const { readData } = require('../services/storage.js');

router.get('/', async (req, res, next) => {
  const data = await readData();
  const { skills, products } = data;
  
  res.render('pages/index', {
    title: 'Main page',
    products,
    skills
  });
});

router.post('/api/contact', async (req, res, next) => {

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({
      msg: `Заполните все поля!: ${err.message}`,
      status: 'Error'
    });
  }

  const { user, clientId, clientSecret, refreshToken } = config.google;
  const { to: emailTo } = config.email;

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: emailTo,
    subject: "Сообщение с сайта",
    text: message.trim().slice(0, 500) + `\n Отправлено с: <${email}>`
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Shortcut for Gmail's SMTP settings
      auth: {
        type: "OAuth2",
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });

    await transporter.verify();

    await transporter.sendMail(mailOptions);

    res.json({
      msg: 'Письмо успешно отправлено!',
      status: 'Ok'
    });

  } catch (err) {

    switch (err.code) {
      case "ECONNECTION":
      case "ETIMEDOUT":
        res.status(503).json({
          msg: `Ошибка сети - повторите попытку позже: ${err.message}`,
          status: 'Error'
        });
        break;

      case "EAUTH":
        console.error("Authentication failed:", err.message);
      case "EENVELOPE":
        console.error("Invalid envelope:", err.message, err.rejected || []);
        res.status(500).json({
          msg: `При отправке письма произошла ошибка!: ${err.message}`,
          status: 'Error'
        });
        break;
      default:
        next(err);
    }
  }
});

module.exports = router;