await sendTelegram(`
🏥 HMS ALERT

New Hospital Registration

👤 Name: ${hospital.name}

📧 Email: ${hospital.email}

📱 Phone: ${hospital.phone}

🕒 ${new Date().toLocaleString()}

Please login to approve.
`);