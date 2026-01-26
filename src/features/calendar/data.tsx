import React from "react";
import { Video, MapPin, Play } from "lucide-react";
// ✅ แก้เป็นจุดเดียว (.) เพื่อเรียกไฟล์ types ที่อยู่โฟลเดอร์เดียวกัน
import type { Appointment } from "./types";

// --- Mock Data ---
export const initialEvents: Appointment[] = [
  {
    id: 1,
    title: "ประชุมการออกตรวจสุขภาพ",
    description: "ออกประชุมการออกตรวจสุขภาพ เมืองพัทยา เพื่อวางแผนประจำปี",
    date: new Date(2025, 8, 11, 10, 0), // เริ่ม 11 ก.ย.
    endDate: new Date(2025, 8, 12, 11, 0), // จบ 12 ก.ย.
    type: "zoom", // ✅ เปลี่ยนเป็น zoom เพื่อให้ได้สีฟ้า
    time: "10:00 - 11:00",
    location: "https://zoom.us/j/123456789",
    status: "Pending",
  },
  {
    id: 2,
    title: "ออกตรวจสุขภาพชุมชน พัทยาตอนบน",
    description: "ลงพื้นที่ตรวจสุขภาพผู้สูงอายุ",
    date: new Date(2025, 8, 16, 9, 0), // เริ่ม 16 ก.ย.
    endDate: new Date(2025, 8, 18, 16, 0), // ✅ จบ 18 ก.ย. (3 วัน)
    type: "health", // ✅ สีเหลือง/ส้ม
    time: "09:00 - 16:00",
    location: "https://maps.app.goo.gl/hccjzoBx9TkfRBVi8",
    status: "Pending",
  },
  {
    id: 3,
    title: "ติดตามผลเลือด",
    description: "ติดตามผลเลือดประจำปี",
    date: new Date(2025, 8, 26, 10, 0), // เริ่ม 26 ก.ย.
    endDate: new Date(2025, 8, 26, 11, 0), // ✅ จบภายในวันเดียว
    type: "tele",
    time: "10:00-11:00",
    status: "Success",
  },
];

// --- Styles & Icons ---
export const eventStyles = {
  zoom: "bg-blue-100 text-blue-700 border-l-4 border-blue-500",
  health: "bg-orange-100 text-orange-800 border-l-4 border-orange-500",
  tele: "bg-pink-100 text-pink-600 border-l-4 border-pink-500",
};

export const eventIcons = {
  zoom: <Video className="w-3 h-3" />,
  health: <MapPin className="w-3 h-3" />,
  tele: <Play className="w-3 h-3 fill-current" />,
};

export const eventIconBg = {
  zoom: "bg-blue-500",
  health: "bg-orange-400",
  tele: "bg-pink-500",
};
