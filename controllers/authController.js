const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "SECRETKEY";

const buildAuthResponse = (user) => ({
  user_id: user.user_id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone || null,
  image_url: user.image_url || null,
  role: "customer",
});

const issueToken = (user_id) =>
  jwt.sign(
    { user_id },
    JWT_SECRET,
    { expiresIn: "1d" },
  );
exports.registerUser = async (req, res) => {

  const { full_name, email, password, phone } = req.body
  const name = full_name

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required."
    })
  }

  try {
    const existingUser = await new Promise((resolve, reject) => {
      db.query(
        "SELECT user_id, full_name, email, phone, image_url, password_hash FROM User WHERE email=? LIMIT 1",
        [email],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result[0] || null);
        },
      );
    });

    const hash = await bcrypt.hash(password, 10);

    if (existingUser) {
      if (existingUser.password_hash) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE user SET full_name=?, password_hash=? WHERE user_id=?",
          [name, hash, existingUser.user_id],
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(true);
          },
        );
      });

      const updatedUser = {
        ...existingUser,
        full_name: name,
        password_hash: hash,
      };

      return res.status(201).json({
        success: true,
        message: "User registered successfully.",
        token: issueToken(updatedUser.user_id),
        data: buildAuthResponse(updatedUser),
      });
    }

    const insertResult = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO user(full_name,email,password_hash,phone) VALUES(?,?,?,?)",
        [name, email, hash, phone || null],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        },
      );
    });

    const user = {
      user_id: insertResult.insertId,
      full_name: name,
      email,
      phone: null,
      image_url: null,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: issueToken(user.user_id),
      data: buildAuthResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to register user.",
      error,
    });
  }
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  db.query(
    "SELECT * FROM User WHERE email=? LIMIT 1",
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Unable to login user.",
          error: err,
        });
      }

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const user = result[0];

      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message: "This account needs a password. Sign up with the same email to continue.",
        });
      }

      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        return res.status(401).json({
          success: false,
          message: "Invalid password.",
        });
      }

      return res.json({
        success: true,
        message: "Login successful.",
        token: issueToken(user.user_id),
        data: buildAuthResponse(user),
      });
    },
  );
};

exports.changeUserPassword = async (req, res) => {
  const { user_id } = req.params;
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: "Both passwords are required." });
  }
  db.query("SELECT password_hash FROM User WHERE user_id=?", [user_id], async (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ success: false, message: "User not found" });
    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return res.status(401).json({ success: false, message: "Current password is incorrect" });
    const hash = await bcrypt.hash(new_password, 10);
    db.query("UPDATE user SET password_hash=? WHERE user_id=?", [hash, user_id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Failed to update password" });
      res.json({ success: true, message: "Password changed successfully" });
    });
  });
};