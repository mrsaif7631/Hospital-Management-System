const sgMail = require('@sendgrid/mail')

//const sendGridApiKey = ''

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const  mail = 'HRITIKROMMIE@GMAIL.COM'


const confMail = (email, name, id)=>{
    sgMail.send({
        to: email,
        from:mail,
        subject: 'Welcome',
        text: `Welcome ${name},
        Thankyou for Resgistering. Please click on below link for verification.`,
        html:` <span>
        <p>Hello ${name},</p>
        <p>Thanyou for registering, 
        ${id}
        please click on below link for verification of your account</p>
        <a style="background-color: green; color: white; padding: 10px;"  href="/activate/${id}">Activate Account</a>
    </span>
    `
    })
}

const cancelMail = (email, name)=>{
    sgMail.send({
        to: email,
        from:'hrtkdwd@gmail.com',
        subject: 'GoodBye',
        text: `Good Bye ${name}, Any feedback for us?`
    })
}

module.exports = {confMail,cancelMail}

