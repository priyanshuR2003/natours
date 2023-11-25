//make alert:
export const showAlert = (type, msg) => {
  hideAlert(); //initially hide other alerts:

  //creating HTML ele:
  const markup = `<div class="alert alert--${type}">${msg}</div>`;

  //inserting HTML ele:
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);

  window.setTimeout(hideAlert, 1500); //hide shown alert after 1.5 sec
};

//hide alert:
export const hideAlert = () => {
  const el = document.querySelector(".alert");

  if (el) {
    el.parentElement.removeChild(el);
  }
};
