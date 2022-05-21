// this basically is a JavaScript file that we are going to integrate into our PUG tempalte and which will then run on the client side
import axios from 'axios';
import { showAlerts } from './alerts.js';

console.log('hello from the client side login.js');

export const login = async (email, password) => {
  try {
    // using axious library to make HTTP request to our predefined login API's endpoint
    // res will store the data that is coming back from the login API
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        // sending form data via HTTP request to the login API
        email,
        password,
      },
    });

    // console.log(res.data);

    if (res.data.status === 'success') {
      showAlerts('success', 'Logged in successfully');

      // to send the cookie with valid token to the server to login the user
      window.setTimeout(() => {
        // to reload & redirect to the home page
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err.response.data);
    showAlerts('error', err.response.data.message);
  }
};
