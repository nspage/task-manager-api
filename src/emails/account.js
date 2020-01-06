const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nicolas.s.page@gmail.com',
        subject: 'Thanks for joigning in!',
        text: `Welcome to the app, ${name}. Let me know how it is working for you.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'nicolas.s.page@gmail.com',
        subject: 'Sorry to see you leave',
        text: `We sure are sorry to see you leave, ${name}. Hope you have a great year ahead of you.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}