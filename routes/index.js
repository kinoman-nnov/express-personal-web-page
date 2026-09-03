const express = require('express');
const router = express.Router();

function isAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }

  res.redirect('/login');
}

router.use('/', require('./main'));

router.use('/login', require('./login'));

router.use('/admin', isAuth, require('./admin'));

module.exports = router;