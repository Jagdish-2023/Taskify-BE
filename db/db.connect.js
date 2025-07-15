const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

const initializeDB = async () => {
  try {
    const connect = await mongoose.connect(MONGODB_URI);
    if (connect) {
      console.log("DB connected successfully!");
    }
  } catch (error) {
    console.error("Failed to connect to DB: ", error);
  }
};

module.exports = initializeDB;
