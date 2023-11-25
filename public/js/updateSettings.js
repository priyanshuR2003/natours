import axios from "axios";
import { showAlert } from "./alert";

// export const updateData = async (name, email) => {
//   try {
//     const res = await axios({
//       method: "PATCH",
//       url: "http://127.0.0.1:3000/api/v1/users/updateMe",
//       data: {
//         name,
//         email,
//       },
//     });

//     if (res.data.status === "success") {
//       showAlert("success", "Data updated successfully");
//     }
//   } catch (err) {
//     showAlert("error", err.response.data.message);
//   }
// };

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === "password"
        ? "/api/v1/users/updateMyPassword"
        : "/api/v1/users/updateMe";

    const res = await axios({
      method: "PATCH",
      url: url,
      data: data,
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()}  updated successfully`);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
