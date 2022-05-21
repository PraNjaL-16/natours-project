/* 
- This index.js file is our entry file, and so in this one we can get data from the user interface and then we delegate actions to some functions coming from these other modules. So we have now the login module, we have our alerts module etc.
- So, again this file is more to really get data from the user interface and then delegate the action to some functions coming from other modules 
- index.js is more for getting data from the user interface, so from the website, and then delegating some actions into these other (alerts.js, login.js, mapbox.js) modules 
*/

// polyfill will make some of the newer JavaScript features work in older browsers as well
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login } from './login';
import { logout } from './logout';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

console.log('hello from parcel');

/********************** DOM ELEMENTS **********************/
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

/************************ DELEGATION **********************/
// to dipaly map on tour page
if (mapBox) {
  // reading value of HTML's speacial data attribute
  const locations = JSON.parse(mapBox.dataset.locations);
  // console.log(locations);
  displayMap(locations);
}

// to loggin a user
if (loginForm) {
  // event listner for form submit button
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

// to logout a user
if (logoutBtn) {
  // event listner for logout button
  logoutBtn.addEventListener('click', logout);
}

// to update name, email & photo of currently logged in user
if (userDataForm) {
  // event listner for form button
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];

    // re-creating multipart form data to upload image file
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);

    // to console form data
    // for (let key of form.entries()) {
    //   console.log(key[0], key[1]);
    // }

    // updateSettings({ name, email }, 'data');
    updateSettings(form, 'data');
  });
}

// to update passoword of currently logged in user
if (userPasswordForm) {
  // event listner for form button
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

// to perform payment using stripe
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    // 'e.taget' have access to HTML's clicked element
    e.target.textContent = 'Processing...';

    // to get data from HTML data attribute
    const { tourId } = e.target.dataset;

    bookTour(tourId);
  });
}
