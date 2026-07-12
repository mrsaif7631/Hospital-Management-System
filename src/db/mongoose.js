const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL);

mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Error:", err);
});