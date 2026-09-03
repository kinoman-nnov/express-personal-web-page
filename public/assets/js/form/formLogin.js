import { validateForm } from "./validateForm.js";

export default function formLogin() {
  const formLogin = document.querySelector('.form-login');
  
  if (!formLogin) return;
  
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
  
    if (validateForm(formLogin)) formLogin.submit();
  });
}