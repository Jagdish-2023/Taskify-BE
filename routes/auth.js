const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const User = require("../models/user.model");

const setCookiesToken = (res, token, user, operation) => {
  res.cookie("accessToken", token, {
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });

  return res.status(operation === "signup" ? 201 : 200).json({
    message: `User ${
      operation === "signin" ? "signed in" : "registered"
    } successfully!`,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
  });
};

router.post("/guest/signin", async (req, res) => {
  try {
    const findUser = await User.findOne({
      email: process.env.GUEST_EMAIL,
      password: process.env.GUEST_PASSWORD,
    });

    const token = jwt.sign({ userId: findUser._id, role: "user" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return setCookiesToken(res, token, findUser, "signin");
  } catch (error) {
    console.error("Login failed: ", error);
    res.status(500).json({ error: "Failed to logged in guest user" });
  }
});

router.post("/v1/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, Email and Password are required" });
    }

    const findExistingUser = await User.findOne({ email });
    if (findExistingUser) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ fullName, email, password: hashedPassword });
    const savedUser = await newUser.save();

    const token = jwt.sign(
      { userId: savedUser._id, role: "user" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return setCookiesToken(res, token, savedUser, "signup");
  } catch (error) {
    console.error("Failed to register new user: ", error);
    res.status(500).json({ error: "Failed to register new user" });
  }
});

router.post("/v1/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const verifyPassword = await bcrypt.compare(password, findUser.password);
    if (!verifyPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: findUser._id, role: "user" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return setCookiesToken(res, token, findUser, "signin");
  } catch (error) {
    console.error("Login failed: ", error);
    res.status(500).json({ error: "Failed to logged in user" });
  }
});

router.get("/check", (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(200).json({ isLoggedIn: false });
    }

    res.status(200).json({ isLoggedIn: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check Login status" });
  }
});

router.post("/logout", (req, res) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    return res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error("Failed to Logout: ", error);
    res.status(500).json({ error: "Failed to Logout" });
  }
});

module.exports = router;
