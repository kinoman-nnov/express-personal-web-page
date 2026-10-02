// создает Email и пароль для админки с записью в user.json
const fsp = require('fs').promises;
const readline = require('readline');
const { hashPassword, generateSalt  } = require('./services/password.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(text) {
  return new Promise(resolve => rl.question(text, resolve));
}

async function createAdmin() {
  try {
    const email = await question('Email: ');
    const password = await question('Password: ');

    const userSalt = generateSalt();
    const hash = await hashPassword(password, userSalt);

    const admin = {
      id: 1,
      email,
      salt: userSalt,
      hash
    };

    await fsp.writeFile('./user.json', JSON.stringify(admin, null, 2));

    console.log('\nАдминистратор успешно создан.');

  } catch (err) {
    console.error(err);
  } finally {
    rl.close();
  }
}

createAdmin();