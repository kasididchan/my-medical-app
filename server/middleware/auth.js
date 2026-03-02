const jwt = require('jsonwebtoken');

// Secret Key สำหรับเซ็นลายเซ็นลงบน Token (ควรเก็บใน .env แต่ใส่ตรงนี้ก่อนเพื่อทดสอบ)
const JWT_SECRET = process.env.JWT_SECRET || "MySuperSecretKey123";

const verifyToken = (req, res, next) => {
  // 1. หา Token จาก Header (ส่งมาแบบ "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. ถ้าไม่มี Token -> ไล่กลับไป
  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  // 3. ถ้ามี -> ตรวจสอบว่าบัตรปลอมไหม?
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // ✅ แปะข้อมูล user (id) ไว้ใน req เพื่อส่งต่อให้ด่านถัดไป
    next(); // ผ่านได้!
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

module.exports = verifyToken;