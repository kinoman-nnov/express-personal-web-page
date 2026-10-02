const crypto = require('crypto');

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      100000, // число итераций iterations
      64, // длина ключа keylen
      'sha512', // алгоритм digest
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      }
    )
  });
}

module.exports = {
  generateSalt,
  hashPassword
}