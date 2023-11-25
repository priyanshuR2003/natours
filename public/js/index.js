//index.js - get data from UI + deligate actions to some functions coming from other modules:

// --imports--:
//
import { login, logout } from "./login";
//
import "@babel/polyfill";
//
import { displayMap } from "./mapbox";
//
// import { updateData } from "./updateSettings";
import { updateSettings } from "./updateSettings";
//
import { bookTour } from "./stripe";

// --UI(data)--:
//dom elements:
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");

//check existence:
if (mapBox) {
  // reading data from data-attribute in HTML:
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  //selecting form(attach event listener):
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // getting email and password values:
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener("click", logout);
}

if (userDataForm) {
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    //1)creating multipart/form-data (by ourself):
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    // console.log(form);

    // getting email and password values:
    // const name = document.getElementById("name").value;
    // const email = document.getElementById("email").value;

    // updateData(name, email);
    // updateSettings({ name, email }, "data");
    updateSettings(form, "data");
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    //alternative to spinner:
    document.querySelector(".btn--save-password").textContent = "Updating ...";

    // getting values from password form:
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;

    // update password;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    document.querySelector(".btn--save-password").textContent = "Save password";
    //clearing password input fields:
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });
}

//connecting booking btn with function in strip.js:
if (bookBtn) {
  bookBtn.addEventListener("click", (e) => {
    //changing btn content:
    bookBtn.textContent = "Processiong...";
    //getting tourID from button:
    const tourID = e.target.dataset.tourID;
    bookTour(tourID);
  });
}
