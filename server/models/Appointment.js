const mongoose = require("mongoose");
const AppointmentSchema = new mongoose.Schema(
  {
    //ผูกนัดหมายเข้ากับ User ID
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },

    // ✅ แก้ชื่อให้ตรงกับหน้าบ้าน (types.ts)
    date: { type: Date, required: true }, // วันที่เริ่ม
    endDate: { type: Date, required: true }, // วันที่จบ
    time: { type: String, required: true }, // ช่วงเวลา (เช่น "10:00 - 11:00") เก็บเป็นข้อความเลย ง่ายต่อการโชว์

    type: {
      type: String,
      enum: ["health", "zoom", "tele-medicine"],
      default: "health",
    },
    location: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Success", "Cancelled"],
      default: "Pending",
    },
    notificationTime: { type: Number, default: 30 },
    isEmailSent: { type: Boolean, default: false },
    participants: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
