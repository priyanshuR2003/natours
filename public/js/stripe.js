import axios from "axios";
import { showAlert } from "./alert";

const stripe = Stripe(
  "pk_test_51O8g3wSBB0wKdSWTETRNhdF9fkIhjLmjXl9EBcZ2MXXP3TnkBdfqKMSfevFg88iFFhp4YJ4P4NM5Dlo09hKTSB83001inPBfo4"
);

export const bookTour = async (tourID) => {
  try {
    //1) getting checkout session from server:
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    // console.log(session);

    //2)create checkout form + charge credit card:
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert(err);
  }
};
