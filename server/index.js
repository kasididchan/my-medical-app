const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // โหลดค่าจาก .env

const app = express();

// --- Middlewares (ด่านตรวจ) ---
app.use(cors()); // อนุญาตให้ React เข้ามาได้
app.use(express.json()); // อ่านข้อมูลแบบ JSON ได้

// --- Connect Database (ต่อสายหา MongoDB) ---
// เดี๋ยวเราต้องไปเอา Link จาก MongoDB Atlas มาใส่ตรงนี้
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/medical-app";

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected! (ต่อตู้เอกสารสำเร็จ)'))
  .catch(err => console.error('❌ Connection Error:', err));


// --- Routes (เส้นทางรับแขก) ---
const AppointmentModel = require('./models/Appointment');

// 1. GET: ขอดูนัดหมายทั้งหมด
app.get('/appointments', async (req, res) => {
  try {
    const appointments = await AppointmentModel.find(); // ไปค้นในตู้มาให้หมด
    res.json(appointments); // ส่งกลับไปให้ React
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST: สร้างนัดหมายใหม่ (จากฟอร์ม Add New Event)
app.post('/appointments', async (req, res) => {
  try {
    const newAppointment = new AppointmentModel(req.body);
    const savedAppointment = await newAppointment.save();
    res.json(savedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params; // รับ ID ที่จะแก้
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await AppointmentModel.findByIdAndDelete(id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Start Server ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});