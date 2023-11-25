const nodemailer = require("nodemailer");
const pug = require("pug");
// const htmlToText = require("html-to-text");

//new email handler:
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Priyanshu <${process.env.EMAIL_FROM}>`;
  }

  //creating transporter:(method)
  newTransport() {
    //a) production:
    if (process.env.NODE_ENV === "production") {
      //send grid
      //alt : sendinblue:
      return nodemailer.createTransport({
        service: "SendinBlue",

        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_APIKEY,
        },
      });
    }

    //b) development:
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //sending email(method):
  async send(template, subject) {
    //a) generating HTML from pug template:
    const html = pug.renderFile(
      `${__dirname}/../views/email/${template}.pug`,
      //passing data: for email personalization:
      {
        filename: this.firstName,
        url: this.url,
        subject,
      }
    );

    //b) define email options:
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      // text: htmlToText(html),
    };

    //c) create transport and send email:
    await this.newTransport().sendMail(mailOptions);
  }

  //(method) : for sending welcome email to user (on new signup)
  async sendWelcome() {
    await this.send("welcome", "welcome to the Natours family");
  }

  // for sending password reset email:
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "your password reset token (valid for only 10 minutes)"
    );
  }
};

//old email handler:
const sendEmail = async (options) => {
  //1) create a transporter(service that will send the email)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,

    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2) defining email options:
  const mailOptions = {
    from: "Priyanshu <test@gmail.com>",
    to: options.email, //coming as an argument to function
    subject: options.subject,
    text: options.message, //message can also be send as HTML
  };

  //3)actually send Email:
  await transporter.sendMail(mailOptions);
};

// module.exports = sendEmail;
