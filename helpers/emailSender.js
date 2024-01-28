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
            console.log(err)
            return "an error occured" 
        }
        
        return "email sent"
    })
}


module.exports = {
    sendEmail
}