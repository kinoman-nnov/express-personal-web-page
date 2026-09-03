export function validateForm(form) {
  const inputs = form.querySelectorAll('input');
  const textAreas = form.querySelectorAll('textarea');  

  const validation = (itemInput) => {
    if (!itemInput.value.trim()) return false;
    else return true;
  }

  form.addEventListener('input', (e) => {
    e.target.setCustomValidity('');
  });

  const validationFor = (list) => {
    for (const elem of list) {
      elem.setCustomValidity('');
  
      if (elem.hasAttribute('data-no-validate')) continue;
  
      if (!validation(elem)) {
        elem.setCustomValidity('Поле не должно быть пустым');
        elem.reportValidity(); // отобразить предупреждение
  
        return false;
      }
    }
  }

  if (validationFor(inputs) === false || validationFor(textAreas) === false) return false;

  return true;
}