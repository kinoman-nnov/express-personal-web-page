import { validateForm } from "./validateForm.js";

export default function formUpload() {
  const formUpload = document.querySelector('.form-upload');
  const preview = document.getElementById('preview');
  const inputFile = document.querySelector('.form-upload__input-file');

  const formPreview = () => {
    let currentUrl = null;

    inputFile.addEventListener('change', () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);

      const file = inputFile.files[0];

      if (!file) {
        // preview.style.display = 'none';
        preview.classList.remove('show');
        preview.src = '';
        return;
      }

      currentUrl = URL.createObjectURL(file);
      preview.src = currentUrl;

      // preview.style.display = 'block';
      preview.classList.add('show');
    });
  }

  if (!formUpload) return;

  formPreview();

  const getInputValue = () => {
    const inputs = formUpload.querySelectorAll('input');

    const arrSkills = [];

    for (const input of inputs) {
      arrSkills.push(input.value);
    }

    return arrSkills;
  }

  const initialValues = JSON.stringify(getInputValue());

  formUpload.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentValues = JSON.stringify(getInputValue());

    if (initialValues === currentValues) {

      alert('Измените поля формы!');
      return; // отменить повторную отправку формы
    }

    if (validateForm(formUpload)) formUpload.submit();
  });
}