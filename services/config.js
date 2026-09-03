require('dotenv').config();

const requiredVars = [
  'SESSION_SECRET',
  'EMAIL_USER',
  'EMAIL_CLIENT_ID',
  'EMAIL_CLIENT_SECRET',
  'EMAIL_REFRESH_TOKEN',
  'EMAIL_TO'
];

function validateEnv() {
  const missing = requiredVars.filter(varName => !process.env[varName]); // массив ключей requiredVars без значений
  
  if (missing.length > 0) {
    const msg = `Ошибка конфигурации: отсутствуют переменные: ${missing.join(', ')}`;

    throw new Error(msg);
  }
}

// Экспортируем объект с уже проверенными данными
module.exports = {
  validate: validateEnv,
  getConfig: () => ({
    google: {
      user: process.env.EMAIL_USER,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
    email: {
      to: process.env.EMAIL_TO,
    },
    sessionSecret: process.env.SESSION_SECRET
  })
};