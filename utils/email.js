const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class SendEmail {
  constructor(user, url) {
    this.firstname = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Company 1 admin <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  newTransporter() {
    if (process.env.NODE_ENV === 'prod') {
      //Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
      });
    }

    return nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstname: this.firstname,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Company1 family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Reset password (Valid for 10 minutes)');
  }
};
