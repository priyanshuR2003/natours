const express = require("express");
const multer = require("multer");

//configuring multer:
const upload = multer({
  dest: "public/img/users",
});

//importing controller:
const usersControllers = require("../controllers/usersControllers");
const authController = require("./../controllers/authController");

//1)creating router:
//i)changing router name : skipped
const usersRouter = express.Router();

usersRouter.post("/signup", authController.signup);
usersRouter.post("/login", authController.login);
usersRouter.post("/forgotPassword", authController.forgotPassword);
usersRouter.patch("/resetPassword/:token", authController.resetPassword);
usersRouter.get("/logout", authController.logout);

usersRouter.use(authController.protect); //this middleware will protect all routes below it.

usersRouter.patch("/updateMyPassword", authController.updatePassword);
usersRouter.patch(
  "/updateMe",
  usersControllers.uploadUserPhoto,
  usersControllers.resizeUserPhoto,
  usersControllers.updateMe
);
usersRouter.delete("/deleteMe", usersControllers.deleteMe);
usersRouter.get("/me", usersControllers.getMe, usersControllers.getUser);

usersRouter.use(authController.restrictTo("admin")); //

//routes:
//i)adjusting routes to imported controller(route handlers).
usersRouter
  .route("/")
  .get(usersControllers.getAllUsers)
  .post(usersControllers.createUser);
usersRouter
  .route("/:id")
  .get(usersControllers.getUser)
  .patch(usersControllers.updateUser)
  .delete(usersControllers.deleteUser);

//exporting router:
module.exports = usersRouter;
