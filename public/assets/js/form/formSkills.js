import { validateForm } from "./validateForm.js";

export default function formSkills() {
  const formSkill = document.querySelector('.form-skill');

  if (!formSkill) return;

  const getInputValue = () => {
    const inputs = formSkill.querySelectorAll('input');

    const arrSkills = [];

    for (const input of inputs) {
      arrSkills.push(input.value);
    }

    return arrSkills;
  }

  const initialSkills = JSON.stringify(getInputValue());

  formSkill.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentSkills = JSON.stringify(getInputValue());

    if (initialSkills === currentSkills) {

      alert('Измените поля формы!');
      return; // отменить повторную отправку формы
    }

    if (validateForm(formSkill)) formSkill.submit();
  });
}