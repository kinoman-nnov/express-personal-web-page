const fsp = require('fs').promises;
const path = require('path');
const createError = require('http-errors');

const BD = './data.json';

const DATA_PATH = path.join(process.cwd(), BD);

async function readData() {
  try {
    const rf = await fsp.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(rf);
  } catch (err) {
    console.error('Ошибка чтения data.json:', err);
    throw err;
  }
}

async function writeData(data) {
  try {
    await fsp.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Ошибка записи data.json:', err);
    throw err;
  }
}

async function deleteFile(filePath) {
  try {
    await fsp.unlink(filePath)  // удалить старое изображение
  } catch (err) {
    if (err.code === 'ENOENT') {
      // пропустить ошибку, если файл не найден
    } else {
      throw err;
    }
  }
}

module.exports = { readData, writeData, deleteFile };