"use strict";
//
import axios from "axios";
import { showAlert } from "./alert";

// login function:
export const login = async (email, password) => {
  //
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email: email,
        password: password,
      },
    });

    //alert user about successfull login:
    if (res.data.status === "success") {
      // alert("Logged in successfully");
      showAlert("success", "Logged in successfully");
      // redirect to homepage:
      window.setTimeout(() => {
        location.assign("/");
      }, 150);
    }
  } catch (err) {
    //alert user about unsuccessfull login:
    // alert(err.response.data.message);
    showAlert("error", err.response.data.message);
  }
};

//logout req to server:
export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });
    // reload page automaticall:(to show logged out menu)
    if (res.data.status === "success") {
      location.reload(true); //true: means reload from server, not from browser
    }
  } catch (err) {
    showAlert("error", "Error logging out, try again");
  }
};
