const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // ✅ เพิ่ม
const jwt = require('jsonwebtoken'); // ✅ เพิ่ม
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

// --- Config ---
const JWT_SECRET = process.env.JWT_SECRET || "MySuperSecretKey123";

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Connect Database ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/medical-app";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ Connection Error:', err));

  // 📧 ตั้งค่าคนส่งอีเมล (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pattaya.health.demo@gmail.com', 
    pass: 'gxip hoxh abvd oval'   
  }
});

// --- Import Models & Middleware ---
const AppointmentModel = require('./models/Appointment');
const UserModel = require('./models/User'); // ✅ เพิ่ม
const verifyToken = require('./middleware/auth'); // ✅ เพิ่ม

// ==========================================
// 🔐 AUTH ROUTES (สมัครสมาชิก / เข้าสู่ระบบ)
// ==========================================

// 1. Register (สมัครสมาชิก)
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // เช็คว่ามี user นี้หรือยัง
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    // เข้ารหัสรหัสผ่าน 🔒
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้าง User ใหม่
    const newUser = new UserModel({ username, password: hashedPassword, email });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login (เข้าสู่ระบบ)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // หา User
    const user = await UserModel.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    // ตรวจรหัสผ่าน 🔑
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // สร้าง Token 🎫 (หมดอายุใน 1 วัน)
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });

    // ส่ง Token และข้อมูลเบื้องต้นกลับไป
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 📅 APPOINTMENT ROUTES (ต้องมี Token เท่านั้น!)
// ==========================================

// 1. GET: ขอดูนัดหมาย (เฉพาะของตัวเอง)
app.get('/appointments', verifyToken, async (req, res) => {
  try {
    await AppointmentModel.updateMany(
      {
        user: req.user.id,            // ของ user คนนี้
        endDate: { $lt: new Date() }, // ที่เวลาจบ น้อยกว่า ตอนนี้ (เป็นอดีต)
        status: "Pending"             // และสถานะยังเป็น Pending อยู่
      },
      { $set: { status: "Success" } } // สั่งเปลี่ยนเป็น Success
    );
    // ✅ ค้นหาโดยใช้ user: req.user.id (ที่ได้มาจาก verifyToken)
    const appointments = await AppointmentModel.find({ user: req.user.id });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST: สร้างนัดหมายใหม่
app.post('/appointments', verifyToken, async (req, res) => {
  try {
    // ✅ เพิ่ม user: req.user.id ลงไปในข้อมูลที่จะบันทึก
    const newAppointment = new AppointmentModel({
      ...req.body,
      user: req.user.id 
    });
    
    const savedAppointment = await newAppointment.save();
    res.json(savedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. PUT: แก้ไขนัดหมาย (ต้องเป็นเจ้าของเท่านั้นถึงแก้ได้)
app.put('/appointments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // ค้นหาและอัพเดท โดยเช็คทั้ง ID นัดหมาย และ ID เจ้าของ
    const updatedAppointment = await AppointmentModel.findOneAndUpdate(
      { _id: id, user: req.user.id }, // เงื่อนไข: ต้องเป็น ID นี้ และ User นี้
      req.body,
      { new: true }
    );

    if (!updatedAppointment) return res.status(404).json({ error: "Appointment not found or unauthorized" });

    res.json(updatedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE: ลบนัดหมาย
app.delete('/appointments/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedAppointment = await AppointmentModel.findOneAndDelete({ _id: id, user: req.user.id });

    if (!deletedAppointment) return res.status(404).json({ error: "Appointment not found or unauthorized" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ⏰ ระบบเช็คและส่งอีเมลแจ้งเตือน (ทำงานทุกๆ 1 นาที)
cron.schedule('* * * * *', async () => {
  console.log('⏳ Checking notifications...');
  
  try {
    const now = new Date();
    
    // ค้นหานัดที่ยังไม่ส่ง + ยังไม่สำเร็จ + มีเจ้าของ
    const appointments = await AppointmentModel.find({ 
      isEmailSent: false, 
      status: 'Pending' 
    }).populate('user'); 

    for (const appointment of appointments) {
      // คำนวณเวลาที่เหลือ (นาที)
      const timeDiff = appointment.date.getTime() - now.getTime();
      const minutesLeft = Math.ceil(timeDiff / 1000 / 60);
      const notifyTime = appointment.notificationTime || 30;

      // 🎯 เงื่อนไข: เวลาเหลือน้อยกว่าที่ตั้งไว้ และยังไม่เลยเวลานัด
      if (minutesLeft <= notifyTime && minutesLeft > 0) {
        
        // ✅ รวบรวมรายชื่อผู้รับเฉพาะนัดนี้
        // (เอาเจ้าของนัด + รายชื่อใน participants ของนัดนี้)
        const recipientList = [
           appointment.user.email, 
           ...appointment.participants 
        ];

        // กรองอีเมลซ้ำ (เผื่อใส่ชื่อตัวเองซ้ำ)
        const uniqueRecipients = [...new Set(recipientList)];

        console.log(`📧 Sending to: ${uniqueRecipients.join(", ")}`);

        // ส่งอีเมลทีเดียวหาทุกคนในลิสต์
        await transporter.sendMail({
          from: '"Pattaya Health Center" <pattaya.health.demo@gmail.com>',
          to: uniqueRecipients, // ส่งหาทุกคนในนัดนี้
          subject: `🔔 แจ้งเตือนนัดหมาย: ${appointment.title}`,
          html: `
            <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
              <h2 style="color: #0033A0;">Pattaya Health Center</h2>
              <p>แจ้งเตือนนัดหมาย: <strong>${appointment.title}</strong></p>
              <p>จะเริ่มในอีก <strong>${minutesLeft} นาที</strong> (${appointment.time})</p>
              <p>📍 สถานที่: ${appointment.location || 'Online'}</p>
            </div>
          `
        });

        // ✅ อัปเดตว่าส่งแล้ว (ป้องกันส่งซ้ำ)
        appointment.isEmailSent = true;
        await appointment.save();
      }
    }
  } catch (error) {
    console.error('❌ Notification Error:', error);
  }
});

// --- Start Server ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});