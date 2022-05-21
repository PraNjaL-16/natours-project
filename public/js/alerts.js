// this basically is a JavaScript file that we are going to integrate into our PUG tempalte and which will then run on the client side
// console.log('hello from the client side alerts.js');

const hideAlert = () => {
  const el = document.querySelector('.alert');

  if (el) {
    el.parentElement.removeChild(el);
  }
};

// type is 'success' or 'error'
export const showAlerts = (type, msg) => {
  hideAlert();

  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  window.setTimeout(hideAlert, 5000);
};
