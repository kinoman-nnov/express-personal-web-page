const session = require('express-session');
const fsp = require('fs').promises;
const path = require('path');

const user = './database/user.json';
const DATA_PATH = path.join(process.cwd(), user);

class SingleUserFileStore extends session.Store {
  constructor() {
    super();
  }

  // Вспомогательный безопасный метод чтения файла
  async _readUserFile() {
    try {
      const fileContent = await fsp.readFile(DATA_PATH, 'utf-8');
      if (!fileContent.trim()) return {};
      return JSON.parse(fileContent);
    } catch (err) {
      // Если файла нет или JSON поврежден, возвращаем пустой объект
      return {};
    }
  }

  // Получение сессии из файла
  async get(sid, cb) {
    try {
      const userData = await this._readUserFile();
      // Если в файле есть активная сессия и она совпадает с пришедшей кукой ID сессии
      if (userData.session && userData.session.sid === sid) {
        return cb(null, userData.session.data);
      }
      return cb(null, undefined); // Сессия не найдена или устарела
    } catch (err) {
      return cb(err);
    }
  }

  // Сохранение сессии в файл при логине/мутациях
  async set(sid, sessionData, cb) {
    try {
      // ИГНОРИРУЕМ запись гостевых кук в user.json, если в сессии нет авторизованного user
      if (!sessionData.user) {
        return cb(null);
      }

      const userData = await this._readUserFile();
      // Подмешиваем сессию к аккаунту пользователя
      userData.session = {
        sid: sid,
        data: sessionData,
        updatedAt: Date.now()
      };

      await fsp.writeFile(DATA_PATH, JSON.stringify(userData, null, 2), 'utf-8');
      return cb(null);
    } catch (err) {
      return cb(err);
    }
  }

  // Удаления сессии из файла при выходе
  async destroy(sid, cb) {
    try {
      const fileContent = await fsp.readFile(DATA_PATH, 'utf-8');
      const userData = JSON.parse(fileContent);

      if (userData.session) {
        delete userData.session; // Стираем поле сессии из объекта
        await fsp.writeFile(DATA_PATH, JSON.stringify(userData, null, 2), 'utf-8');
      }
      return cb(null);
    } catch (err) {
      return cb(err);
    }
  }
}

module.exports = SingleUserFileStore;