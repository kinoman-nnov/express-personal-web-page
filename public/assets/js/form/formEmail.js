import { validateForm } from "./validateForm.js";

export default function formEmail() {
  const formEmail = document.querySelector('.form-email');

  if (!formEmail) return;

  async function prepareSendMail() {

    const data = {
      name: formEmail.name.value,
      email: formEmail.email.value,
      message: formEmail.message.value
    }

    let resultContainer = formEmail.querySelector('.status');
    resultContainer.classList.remove('status-success');
    resultContainer.classList.remove('status-danger');

    resultContainer.classList.add('email-sending');
    resultContainer.innerHTML = 'Отправка...';

    const res = await sendMsg('/api/contact', data);

    resultContainer.classList.remove('email-sending');

    if (res.status === 'Ok') {
      resultContainer.classList.remove('status-danger');
      resultContainer.classList.add('status-success');
      formEmail.reset();
    }

    if (res.status === 'Error') {
      resultContainer.classList.add('status-danger');
      resultContainer.classList.remove('status-success');
    }

    resultContainer.innerHTML = res.msg;
  }

  async function sendMsg(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Сервер вернул ошибку:', result.msg);
        return { status: 'Error', msg: result.msg || 'Произошла ошибка при обработке запроса.' };
      }

      return result;

    } catch (err) {
      return { msg: 'Нет соединения с сервером.', status: 'Error' };
    }
  }

  formEmail.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (validateForm(formEmail)) {

      await prepareSendMail();
    }
  });
}