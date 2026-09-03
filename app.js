// перед запуском приложения провалидировать конфиг на наличие секретных токенов
let config;
try {
  config = require('./services/config.js');
  config.validate();
} catch (err) {
  console.error('FATAL: Старт сервера невозможен, ошибка конфигурации:', err.message);
  process.exit(1);
}

const express = require('express');
const session = require('express-session');
const path = require('path');
const createError = require('http-errors');
const logger = require('morgan');
const cookie = require('cookie-parser');

const mainRouter = require('./routes/');

const app = express();

const secret = config.getConfig().sessionSecret;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

process.env.NODE_ENV === 'development'
  ? app.use(logger('dev'))
  : app.use(logger('short'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookie());

app.use(session({
  secret,
  resave: false,  // Не сохранять сессию, если она не изменилась
  saveUninitialized: false,  // Не создавать сессию для каждого запроса
  cookie: {
    httpOnly: true, // Защита от XSS (JS не видит куку)
    secure: process.env.NODE_ENV === 'production', // true только на HTTPS (прод), false для localhost
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'strict' // Защита от CSRF на уровне куки
  }
}));
 
app.use('/', mainRouter);

// catch 404 and forward to error handler
app.use((req, __, next) => {
  next(
    createError(404, `Ой, извините, но по пути ${req.url} ничего не найдено!`)
  )
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});