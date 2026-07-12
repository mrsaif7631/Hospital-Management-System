const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);

const resSMS = (name,data,number) => {
    client.messages
        .create({
            body: 'Patient Name: '+name+'\nReport: '+data.Type+'\nResult: '+data.Result+'\nMedicine: '+data.Medicine+'\nDoctor Remarks: '+data.Remark,
            from: '+19412602671',
            to: '+91'+number
        })

}

module.exports = resSMS