import axios from 'axios';
import { showAlerts } from './alerts';

console.log('hello from the client side updateSettings.js');

// type is either 'passowrd' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlerts('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlerts('error', err.response.data.message);
  }
};
