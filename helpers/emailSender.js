const nodemailer = require("nodemailer")


const transporter = nodemailer.createTransport({
    host: process.env.TRANSPORTER_HOST,
    port: process.env.TRANSPORTER_PORT,
    secure: true,
    auth: {
        user: "emailsender.for.auth.project@gmail.com",
        pass: process.env.GMAIL_PASSWORD
    }
})


const sendEmail = (email , subject , htmlMessage) => {
    const info = {
        from: "noreply@domail.com",
        to: email,
        subject: subject,
        html: htmlMessage
    }

    transporter.sendMail(info , (err) => {
        if (err) {
            return false
        }
    })
    return true
}


module.exports = {
    sendEmail
}