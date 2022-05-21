import axios from 'axios';
import { showAlerts } from './alerts.js';

// console.log('hello from the client side logout.js');

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout', // relative URL
    });

    // to send the invalid cookie to the server to logout the user
    if (res.data.status === 'success') {
      // to reload & we have set "reload(true)" to force a reload from the server and not from browser cache
      // this was giving "jwt malformed" error
      // location.reload(true);

      // to reload & redirect to the home page & also to avoid "jwt malformed" error
      location.assign('/');
    }
  } catch (err) {
    showAlerts('error', 'Error logging out! Try again.');
  }
};
