import axios from 'axios';
import { showAlerts } from './alerts';

const stripe = Stripe(
  'pk_test_51L13CwSDeZD4SCcjoePXDoJrGcNBtXu22XsO0cd83GirZbNbL8LW8uJ0A18XcjNodizY0ZgX0AOaDvUe14Xg8QsP00l7FMeqew'
);

export const bookTour = async (tourId) => {
  try {
    // 1. get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`); // relative URL
    // console.log(session);

    // 2. create checkout form + charge the credit card
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    // console.log(err);
    showAlerts('error', err.message);
  }
};
