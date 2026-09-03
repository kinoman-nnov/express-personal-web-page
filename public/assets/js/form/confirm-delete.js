export default function confirmDelete() {
  const productList = document.querySelector('.product__list');

  if (productList) {
    productList.addEventListener('submit', (e) => {
      e.preventDefault();

      const formDel = e.target.closest('.form-delete-product');
  
      if (!formDel) return;
  
      if (!confirm('Вы уверены, что хотите удалить товар?')) return;
  
      else formDel.submit();
    });
  }
}