const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true }, // ห้ามซ้ำ
    password: { type: String, required: true }, // เก็บแบบ Hash
    email: { type: String }, // เผื่อไว้
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);