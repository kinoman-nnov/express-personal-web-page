const express = require('express');
const router = express.Router();
const fsp = require('fs').promises;
const path = require('path');
const createError = require('http-errors');
const { hashPassword } = require('../services/password.js');

function isAuth(req, res, next){
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }

  return next();
}

const USER_PATH = path.join(__dirname, '../user.json');

router.get('/', isAuth, (req, res, next) => {

  res.render('pages/login', { title: 'SigIn page' });
});

router.post('/', isAuth, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) throw createError(400, "Заполните все поля");

    let user;

    try {
      user = JSON.parse(await fsp.readFile(USER_PATH, 'utf-8'));
    } catch (err) {
      if (err.code === 'ENOENT') throw createError(500, 'Ошибка: файл user.json не найден');
      return next(err);
    }

    if (email !== user.email) {
      return res.status(401).render(
        'pages/login',
        { msglogin: 'Неверный email или пароль', email }
      );
    }

    const hash = await hashPassword(password, user.salt);

    if (hash !== user.hash) {
      return res.status(401).render(
        'pages/login',
        { msglogin: 'Неверный email или пароль', email }
      );
    }

    // пользователь авторизован
    req.session.user = {
      id: user.id,
      email: user.email
    }

    res.redirect('/admin');

  } catch (err) {
    next(err);
  }
});

module.exports = router;