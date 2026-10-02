const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const createError = require('http-errors');

const { readData, writeData, deleteFile } = require('../services/storage.js');
const { uploadMiddleware, UPLOAD_DIR } = require('./middlewares/upload.js');

async function getAdminData(editProductId = null) {
  const data = await readData();

  const { skills, products } = data;

  let editProduct = null;

  if (!!editProductId) {
    editProduct = products.find(p => p.id === editProductId);

    if (!editProduct) throw createError(404, 'Редактируемый продукт не найден');
  }

  const age = skills.find(s => s.key === 'age') || { number: 0 };
  const concerts = skills.find(s => s.key === 'concerts') || { number: 0 };
  const cities = skills.find(s => s.key === 'cities') || { number: 0 };
  const years = skills.find(s => s.key === 'years') || { number: 0 };

  const currentSkills = { age, concerts, cities, years };

  return { data, currentSkills, products, editProduct };
}

function validateProduct(req, res, isEdit) {
  const { name, price } = req.body;
  const newPhoto = req.file;

  if (isEdit === false && !newPhoto) {
    return {
      isValid: false,
      errMsg: 'Ошибка: Необходимо загрузить фото товара!'
    }
  }

  if (!name || name.trim() === '') {
    return {
      isValid: false,
      errMsg: 'Ошибка: Введите название товара!'
    }
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return {
      isValid: false,
      errMsg: 'Ошибка: Цена должна быть положительным числом!'
    }
  }

  return { isValid: true }
}

// function throwFakeError(errCode) {
//   const fakeError = new Error('fake ERROR!!!');
//   fakeError.code = errCode;
//   throw fakeError;
// }

router.get('/', async (req, res, next) => {
  try {
    const { currentSkills, products } = await getAdminData();

    const { age, concerts, cities, years } = currentSkills;

    res.render('pages/admin', {
      title: 'Admin page',
      products,
      age,
      concerts,
      cities,
      years
    });
  } catch (err) {
    next(err);
  }
});

router.post('/skills', async (req, res, next) => {
  /*
    в переменной age - Возраст начала занятий на скрипке
    в переменной concerts - Концертов отыграл
    в переменной cities - Максимальное число городов в туре
    в переменной years - Лет на сцене в качестве скрипача
  */
  let renderData = { title: 'Admin page' };

  try {
    const incomingData = req.body;

    const { products } = await getAdminData();

    renderData = {
      ...renderData,
      products,
      skillFormData: incomingData
    };

    // валидация 
    const requiredFields = ['age', 'concerts', 'cities', 'years'];
    for (const field of requiredFields) {
      if (!incomingData[field] || isNaN(incomingData[field]) || Number(incomingData[field]) < 0) {

        const msgInputErr = `Ошибка: введите целое неотрицательное число!`;

        return res.render('pages/admin', {
          ...renderData,
          msgskillError: msgInputErr
        });
      }
    }

    const data = await readData();

    const skills = data.skills;

    for (const skill of skills) {
      const key = skill.key;
      if (requiredFields.includes(key)) {
        skill.number = Number(incomingData[key]);
      }
    }

    await writeData(data);

    // обновить данные для рендеринга после успешной записи в БД
    const { currentSkills } = await getAdminData();
    const { age, concerts, cities, years } = currentSkills;

    renderData = {
      ...renderData,
      age,
      concerts,
      cities,
      years
    };

    res.render('pages/admin', {
      ...renderData,
      msgskill: 'Скиллы успешно обновлены!'
    });

  } catch (err) {
    console.error('[skills POST] Ошибка', err);

    let userErrorMsg = 'Произошла непредвиденная ошибка!';

    if (err.code === 'ENOENT') userErrorMsg = 'Ошибка: файл data.json не найден!';

    res.render('pages/admin', {
      ...renderData,
      msgskillError: userErrorMsg
    });
  }
});

router.post('/products/add', async (req, res, next) => {
  /*
    в переменной photo - Картинка товара
    в переменной name - Название товара
    в переменной price - Цена товара
  */
  let renderData = { title: 'Admin page' };

  const { currentSkills, products } = await getAdminData();
  const { age, concerts, cities, years } = currentSkills;

  renderData = {
    ...renderData,
    products,
    age,
    concerts,
    cities,
    years
  }

  try {
    // Оборачиваем коллбэк Multer в Промис, чтобы поймать его в catch
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        // Multer выбросил ошибку, неверный формат или превышен размер
        if (err) return reject(err);
        resolve();
      });
    });

    const incomingData = req.body;
    const newPic = req.file;

    renderData = {
      ...renderData,
      productFormData: incomingData
    }

    const validation = validateProduct(req, res);
    if (!validation.isValid) {
      // Если при валидации НОВОГО файла произошла ошибка, 
      // multer уже загрузил файл в папку. Его нужно удалить, чтобы не копить мусор.
      if (newPic) {
        const fileName = path.basename(newPic.filename);
        const filePath = path.join(UPLOAD_DIR, fileName);

        await deleteFile(filePath);
      }

      // если поля не прошли валидацию, рендерим кастомную ошибку
      return res.render('pages/admin', {
        ...renderData,
        msguploadError: validation.errMsg
      });
    }

    const data = await readData();

    const product = {
      id: crypto.randomUUID(),
      src: `/assets/img/products/${newPic.filename}`,
      name: incomingData.name,
      price: Number(incomingData.price)
    }

    data.products.push(product);

    await writeData(data);

    // обновить данные для рендеринга после успешной записи в БД
    const { products: refreshedProducts } = await getAdminData();

    renderData = {
      ...renderData,
      products: refreshedProducts
    };

    res.render('pages/admin', {
      ...renderData,
      productFormData: null,
      msgupload: 'Товары успешно обновлены!'
    });

  } catch (err) {
    console.error('[uploads POST] Ошибка', err);

    let userErrorMsg = 'Произошла непредвиденная ошибка';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        userErrorMsg = 'Ошибка: Файл слишком большой! Максимальный размер — 5 МБ.';
        break;
      case 'INVALID_FILE_TYPE':
        userErrorMsg = 'Ошибка: Недопустимый формат файла! Разрешены только JPEG, PNG, WEBP и GIF.';
        break;
      case 'ENOENT':
        userErrorMsg = 'Ошибка: файл данных data.json не найден на сервере.';
        break;
    }

    if (req.body) {
      renderData.productFormData = {
        name: req.body.name || '',
        price: req.body.price || ''
      };
    }

    res.render('pages/admin', {
      ...renderData,
      msguploadError: userErrorMsg
    });
  }
});

// форма для редакирования товара из списка по id
router.get('/products/:id/edit', async (req, res, next) => {
  let renderData = { title: 'Admin page' };

  try {
    // id не валидирую, так как если он будет пустой, роут не выполнится
    const productId = req.params.id;

    const { currentSkills, products } = await getAdminData(productId);
    const { age, concerts, cities, years } = currentSkills;

    renderData = {
      ...renderData,
      products,
      age,
      concerts,
      cities,
      years
    }

    const editProduct = products.find(p => p.id === productId);

    if (!editProduct) {
      console.error(`[Edit GET] Товар не найден: ${productId}`);

      // в случае ошибки рендерим шаблон добавления продукта и передаем в него ошибку
      return res.status(404).render('pages/admin', {
        ...renderData,
        msguploadError: 'Редактируемый продукт не найден'
      });
    }

    res.render('pages/admin', {
      ...renderData,
      editProduct
    });

  } catch (err) {
    next(err);
  }
});

// редактировать товар по id
router.post('/products/:id', async (req, res, next) => {
  let renderData = { title: 'Admin page' };
  let editProduct = null;

  try {
    const productId = req.params.id;

    const { data, currentSkills, products, editProduct: foundProduct } = await getAdminData(productId);
    editProduct = foundProduct;

    const { age, concerts, cities, years } = currentSkills;

    renderData = {
      ...renderData,
      products,
      age,
      concerts,
      cities,
      years,
      editProduct
    }

    // Оборачиваем коллбэк Multer в Промис, чтобы поймать его в catch
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const incomingData = req.body;
    const newPic = req.file;

    const validation = validateProduct(req, res, true);
    if (!validation.isValid) {
      // Если при валидации РЕДАКТИРУЕМОГО файла произошла ошибка, 
      // multer уже загрузил файл в папку. Его нужно удалить, чтобы не копить мусор.
      if (newPic) {
        const newPicName = path.basename(newPic.filename);
        const newPicPath = path.join(UPLOAD_DIR, newPicName);
        await deleteFile(newPicPath);
      }
      // Формируем временный объект для отображения в случае ошибки в форме
      const temporaryEditState = {
        ...editProduct,
        name: incomingData.name,
        price: incomingData.price
      }

      return res.render('pages/admin', {
        ...renderData,
        editProduct: temporaryEditState, // передаем админу то, что он ввел
        msgeditError: validation.errMsg
      });
    }

    // Данные валидны, изменяем объект в памяти 
    const numericPrice = Number(incomingData.price);
    editProduct.name = incomingData.name;
    editProduct.price = numericPrice;

    if (newPic) {
      if (editProduct.src) {
        const fileName = path.basename(editProduct.src);
        const filePath = path.join(UPLOAD_DIR, fileName);

        await deleteFile(filePath);
      }

      editProduct.src = `/assets/img/products/${newPic.filename}`;
    }

    await writeData(data);

    // обновить данные для рендеринга после успешной записи в БД
    const { products: refreshedProducts } = await getAdminData();

    // в случае успеха, рендерим шаблон добавления продукта
    res.render('pages/admin', {
      ...renderData,
      products: refreshedProducts,
      editProduct: null, // сбрасываем режим редактирования в случае успеха
      msgupload: 'Товар успешно отредактирован!'
    });

  } catch (err) {
    console.error('[edit POST] Ошибка', err);

    if (req.file) {
      try {
        const newPicName = path.basename(req.file.filename);
        await deleteFile(path.join(UPLOAD_DIR, newPicName));

      } catch (cleanupErr) {
        console.error('Не удалось удалить временный файл при ошибке:', cleanupErr);
      }
    }

    let userErrorMsg = 'Произошла непредвиденная ошибка';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        userErrorMsg = 'Ошибка: Файл слишком большой! Максимальный размер — 5 МБ.';
        break;
      case 'INVALID_FILE_TYPE':
        userErrorMsg = 'Ошибка: Недопустимый формат файла! Разрешены только JPEG, PNG, WEBP и GIF.';
        break;
      case 'ENOENT':
        userErrorMsg = 'Ошибка: файл данных data.json не найден на сервере.';
        break;
    }

    if (err.status === 404) userErrorMsg = err.message; // из getAdminData

    const isEditError = !!editProduct;

    if (!!editProduct) {
      if (req.body) {
        renderData.editProduct = {
          ...editProduct,
          name: req.body.name || '',
          price: req.body.price || ''
        };
      }
    }

    res.render('pages/admin', {
      ...renderData,
      editProduct,
      msgeditError: isEditError ? userErrorMsg : null,
      msguploadError: !isEditError ? userErrorMsg : null
    });
  }
});

router.post('/products/:id/delete', async (req, res, next) => {
  let renderData = { title: 'Admin page' };

  try {
    const productId = req.params.id;

    const { data, currentSkills, products, editProduct } = await getAdminData(productId);
    const { age, concerts, cities, years } = currentSkills;

    renderData = {
      ...renderData,
      products,
      age,
      concerts,
      cities,
      years
    }

    const index = products.findIndex(product => product.id === editProduct.id);

    if (index === -1) {
      throw createError(404, 'Товар не найден в списке продуктов');
    }

    // Проверяем, что картинка задана и это не дефолтная заглушка
    if (editProduct.src) {
      const fileName = path.basename(editProduct.src);
      const filePath = path.join(UPLOAD_DIR, fileName);

      await deleteFile(filePath);
    }

    products.splice(index, 1); // удалить 1 элемент начиная с index

    await writeData(data);

    // обновить данные для рендеринга после успешной записи в БД
    const { products: refreshedProducts } = await getAdminData();

    // в случае успеха, рендерим шаблон добавления продукта
    res.render('pages/admin', {
      ...renderData,
      products: refreshedProducts,
      msgdelete: 'Товар успешно удален!'
    });

  } catch (err) {
    console.error('[delete POST] Ошибка', err);

    let userErrorMsg = 'Произошла непредвиденная ошибка';

    if (err.code === 'ENOENT') userErrorMsg = 'Ошибка: файл data.json не найден';
    else if (err.status === 404) userErrorMsg = err.message; // из getAdminData

    res.render('pages/admin', {
      ...renderData,
      msgdeleteError: userErrorMsg
    });
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);

    res.clearCookie('connect.sid', { path: '/' });

    res.redirect('/login');
  });
});

module.exports = router;