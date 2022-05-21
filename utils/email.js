const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const { htmlToText } = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    // creating new fields
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Pranjal <${process.env.EMAIL_FROM}>`;
  }

  // 1. create a transporter
  newTransport() {
    if (process.env.NODE_ENV.trim() === 'production') {
      // will send mail using SENDGRID for production
      return nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey: process.env.SENDGRID_PASSWORD,
        })
      );
    }

    // sending mail using mailTrap for development
    return nodemailer.createTransport({
      // server: 'Gmail',
      host: process.env.EMAIL_HOST,
      // host: 'smtp.mailtrap.io',
      port: process.env.EMAIL_PORT,
      // port: 25,
      auth: {
        user: process.env.EMAIL_USERNAME,
        // user: '86e9f1572e5487',
        pass: process.env.EMAIL_PASSWORD,
        // pass: '0ac6db62dbf498',
      },
    });
  }

  // 3. actually send the mail
  async send(template, subject) {
    // A. render HTML based on a PUG template
    // can also pass some data using renderFile() method that will be available in the PUG template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // B. define email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    // C. create a transport & send email
    await this.newTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
  }
};
