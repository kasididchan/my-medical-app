import React, { useState, useEffect } from "react";
import { X, Loader2, ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Appointment } from "../types";
import API_URL from "../../../config";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventToEdit?: Appointment | null;
}

// --- ข้อมูลสำหรับ Dropdown ---
const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const CURRENT_YEAR = new Date().getFullYear() + 543;
const YEARS = Array.from({ length: 13 }, (_, i) =>
  (CURRENT_YEAR - 2 + i).toString(),
);

const getDaysArray = (month: string, year: string) => {
  const monthIndex = THAI_MONTHS.indexOf(month);
  const yearAD = parseInt(year) - 543;
  if (monthIndex === -1 || isNaN(yearAD)) {
    return Array.from({ length: 31 }, (_, i) =>
      (i + 1).toString().padStart(2, "0"),
    );
  }
  const daysInMonth = new Date(yearAD, monthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
};

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);

const PRESET_MINUTES = [0, 10, 30, 60, 120, 1440, 2880];

export const AddEventModal = ({
  isOpen,
  onClose,
  onSuccess,
  eventToEdit,
}: AddEventModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // --- State เก็บข้อมูล ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDay: "01",
    startMonth: "มกราคม",
    startYear: YEARS[2],
    endDay: "01",
    endMonth: "มกราคม",
    endYear: YEARS[2],
    startHour: "09",
    startMinute: "00",
    endHour: "10",
    endMinute: "00",
    type: "health",
    location: "",
    notificationTime: 30,
  });
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen && eventToEdit) {
      const startDate = new Date(eventToEdit.date);
      const endDate = new Date(eventToEdit.endDate || eventToEdit.date);
      const [startTimeStr, endTimeStr] = eventToEdit.time.split(" - ");
      const [sHour, sMin] = startTimeStr
        ? startTimeStr.split(":")
        : ["09", "00"];
      const [eHour, eMin] = endTimeStr ? endTimeStr.split(":") : ["10", "00"];

      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description || "",
        location: eventToEdit.location || "",
        type: eventToEdit.type,
        startDay: startDate.getDate().toString().padStart(2, "0"),
        startMonth: THAI_MONTHS[startDate.getMonth()],
        startYear: (startDate.getFullYear() + 543).toString(),
        endDay: endDate.getDate().toString().padStart(2, "0"),
        endMonth: THAI_MONTHS[endDate.getMonth()],
        endYear: (endDate.getFullYear() + 543).toString(),
        startHour: sHour,
        startMinute: sMin,
        endHour: eHour,
        endMinute: eMin,
        notificationTime: (eventToEdit as any).notificationTime ?? 30,
      });
    } else if (isOpen && !eventToEdit) {
      resetForm();
    }
  }, [isOpen, eventToEdit]);

  const resetForm = () => {
    const now = new Date();
    const currentDay = now.getDate().toString().padStart(2, "0");
    const currentMonth = THAI_MONTHS[now.getMonth()];
    const currentYear = (now.getFullYear() + 543).toString();
    setFormData({
      title: "",
      description: "",
      location: "",
      type: "health",
      startDay: currentDay,
      startMonth: currentMonth,
      startYear: currentYear,
      endDay: currentDay,
      endMonth: currentMonth,
      endYear: currentYear,
      startHour: "09",
      startMinute: "00",
      endHour: "10",
      endMinute: "00",
      notificationTime: 30,
    });
  };

  // ✅ Handle Change สำหรับ Desktop Dropdowns และ Text Inputs ทั่วไป
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: false }));
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Helper: หา index เดือน (0-11)
      const getMonthIndex = (m: string) => THAI_MONTHS.indexOf(m);

      // 🟢 Logic 1: ถ้าเปลี่ยน "ส่วนประกอบของวันเริ่ม" -> อัพเดตวันสิ้นสุดตาม
      if (
        name === "startDay" ||
        name === "startMonth" ||
        name === "startYear"
      ) {
        if (name === "startDay") newData.endDay = value;
        if (name === "startMonth") newData.endMonth = value;
        if (name === "startYear") newData.endYear = value;
      }

      // 🔴 Logic 2: ถ้าเปลี่ยน "ส่วนประกอบของวันสิ้นสุด" -> เช็คห้ามย้อนหลัง
      if (name === "endDay" || name === "endMonth" || name === "endYear") {
        // สร้าง Date Object ของวันเริ่ม
        const sDate = new Date(
          parseInt(newData.startYear) - 543,
          getMonthIndex(newData.startMonth),
          parseInt(newData.startDay)
        );

        // สร้าง Date Object ของวันสิ้นสุด (ที่เพิ่งถูกเลือก)
        const eDate = new Date(
          parseInt(newData.endYear) - 543,
          getMonthIndex(newData.endMonth),
          parseInt(newData.endDay)
        );

        if (eDate < sDate) {
          // ❌ ถ้าน้อยกว่า -> ดีดกลับไปเท่าวันเริ่ม
          newData.endDay = newData.startDay;
          newData.endMonth = newData.startMonth;
          newData.endYear = newData.startYear;
        }
      }

      return newData;
    });
  };

  // ✅ Helper: แปลง State เป็น YYYY-MM-DD สำหรับ input type="date"
  const getMobileDateValue = (d: string, m: string, y: string) => {
    const monthIndex = THAI_MONTHS.indexOf(m);
    const yearAD = parseInt(y) - 543;
    const date = new Date(yearAD, monthIndex, parseInt(d));
    // จัด format YYYY-MM-DD โดยปรับ Timezone offset ให้ถูกต้อง
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  };

  // ✅ Helper: รับค่าจาก input type="date" แล้วอัพเดท State
  const handleMobileDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "start" | "end"
  ) => {
    const dateVal = e.target.value; // ค่าที่ได้มาคือ YYYY-MM-DD (ค.ศ.)
    if (!dateVal) return;

    const [year, month, day] = dateVal.split("-");
    const thaiYear = (parseInt(year) + 543).toString(); // แปลงเป็น พ.ศ.
    const thaiMonth = THAI_MONTHS[parseInt(month) - 1]; // แปลงเป็นชื่อเดือนไทย

    setFormData((prev) => {
      const newData = { ...prev };

      if (field === "start") {
        // 🟢 กรณีเปลี่ยน "วันเริ่ม"
        // 1. อัพเดตวันเริ่ม
        newData.startDay = day;
        newData.startMonth = thaiMonth;
        newData.startYear = thaiYear;

        // 2. บังคับ "วันสิ้นสุด" ให้เปลี่ยนตามทันที (Reset)
        newData.endDay = day;
        newData.endMonth = thaiMonth;
        newData.endYear = thaiYear;
      } else {
        // 🔴 กรณีเปลี่ยน "วันสิ้นสุด"
        // ต้องเช็คว่า วันที่เลือกมา (dateVal) น้อยกว่า วันเริ่ม (ใน State) หรือไม่?
        
        // สร้าง Date Object ของวันเริ่ม (เพื่อเอามาเทียบ)
        const sMonthIndex = THAI_MONTHS.indexOf(prev.startMonth);
        const sYearAD = parseInt(prev.startYear) - 543;
        const startDateObj = new Date(sYearAD, sMonthIndex, parseInt(prev.startDay));

        // สร้าง Date Object ของวันที่เลือกมาใหม่
        // (dateVal เป็น YYYY-MM-DD อยู่แล้ว สร้าง Date ได้เลย)
        const selectedDateObj = new Date(dateVal);
        // ปรับเวลาให้เป็น 00:00:00 เพื่อเทียบแค่วันที่
        startDateObj.setHours(0,0,0,0); 
        selectedDateObj.setHours(0,0,0,0);

        if (selectedDateObj < startDateObj) {
          // ❌ ถ้าน้อยกว่า -> ห้ามเปลี่ยน! (ดีดกลับไปเท่ากับวันเริ่ม)
          newData.endDay = prev.startDay;
          newData.endMonth = prev.startMonth;
          newData.endYear = prev.startYear;
        } else {
          // ✅ ถ้าถูกต้อง -> อัพเดตตามปกติ
          newData.endDay = day;
          newData.endMonth = thaiMonth;
          newData.endYear = thaiYear;
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: boolean } = {};
    let hasError = false;

    // เช็ค: ชื่อหัวข้อ (Title)
    if (!formData.title.trim()) {
      newErrors.title = true;
      hasError = true;
    }

    // (ถ้าอยากเช็คช่องอื่นเพิ่ม เช่น location ก็ใส่ตรงนี้ได้)
    // if (!formData.location.trim()) newErrors.location = true;

    if (hasError) {
      setFieldErrors(newErrors);
      
      // 🚨 Alert แจ้งเตือนใหม่
      alert("ไม่สามารถสร้างนัดหมายได้: กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน");

      // 🔍 Auto Focus: เลื่อนไปหาช่องที่ผิดช่องแรก
      const firstErrorField = document.querySelector(`[name="${Object.keys(newErrors)[0]}"]`) as HTMLElement;
      if (firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return; // หยุดทำงานทันที ไม่ยิง API
    }
    
    setIsLoading(true);

    try {
      // ✅ 1. ดึง Token ออกมาก่อน (เพิ่มใหม่)
      const token = localStorage.getItem("user_token");
      if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
        return; // ถ้าไม่มี Token ให้หยุดทำงาน
      }

      // === 👇 ส่วน LOGIC เดิมของคุณ (คำนวณวันที่ไทย/สร้าง Payload) 👇 ===
      const monthIndexStart = THAI_MONTHS.indexOf(formData.startMonth);
      const yearADStart = parseInt(formData.startYear) - 543;
      const startDateObj = new Date(
        yearADStart,
        monthIndexStart,
        parseInt(formData.startDay)
      );
      startDateObj.setHours(
        parseInt(formData.startHour),   // ชั่วโมงที่เลือก (เช่น 09)
        parseInt(formData.startMinute), // นาทีที่เลือก (เช่น 10)
        0, 
        0
      );

      const monthIndexEnd = THAI_MONTHS.indexOf(formData.endMonth);
      const yearADEnd = parseInt(formData.endYear) - 543;
      const endDateObj = new Date(
        yearADEnd,
        monthIndexEnd,
        parseInt(formData.endDay)
      );

      endDateObj.setHours(
        parseInt(formData.endHour), 
        parseInt(formData.endMinute), 
        0, 
        0
      );
      const payload = {
        title: formData.title,
        description: formData.description,
        date: startDateObj,
        endDate: endDateObj,
        time: `${formData.startHour}:${formData.startMinute} - ${formData.endHour}:${formData.endMinute}`,
        type: formData.type.toLowerCase(),
        location: formData.location,
        status: eventToEdit ? eventToEdit.status : "Pending",
        notificationTime: Number(formData.notificationTime),
      };
      // === 👆 จบส่วน LOGIC เดิม 👆 ===

      // ✅ 2. สร้าง URL (แก้ให้ใช้ Template Literal `...` และตัวแปร API_URL)
      let url = `${API_URL}/appointments`;
      let method = "POST";
      
      if (eventToEdit && eventToEdit.id) {
        url = `${API_URL}/appointments/${eventToEdit.id}`;
        method = "PUT";
      }

      // ✅ 3. ส่ง Request พร้อม Token Header (เพิ่ม Authorization)
      const response = await fetch(url, {
        method: method,
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // 🔑 กุญแจสำคัญ: แนบ Token ไปด้วย
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      onClose();
      resetForm();
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:items-center lg:justify-center bg-white lg:bg-black/60 lg:backdrop-blur-sm lg:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-4xl lg:rounded-[2rem] lg:shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 lg:px-8 lg:py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <button
            onClick={onClose}
            className="lg:hidden p-2 -ml-2 text-slate-800 hover:bg-gray-50 rounded-full transition"
          >
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 flex-1 lg:flex-none text-left lg:text-center pl-2 lg:pl-0">
            {eventToEdit ? (
              "Edit Event"
            ) : (
              <>
                <span className="lg:hidden">Add Events</span>
                <span className="hidden lg:inline">Add New Event</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="hidden lg:block p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
          <div className="w-10 lg:hidden"></div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6"
        >
          {/* ชื่อหัวข้อ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ชื่อหัวข้อ <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="เช่น ตรวจสุขภาพประจำปี"
              className={cn(
                "w-full border rounded-xl px-4 py-3 transition text-base focus:outline-none focus:ring-2",
                // ✅ Logic สลับสี: ถ้ามี Error เป็นสีแดง, ถ้าปกติเป็นสีเทา
                fieldErrors.title
                  ? "border-red-500 bg-red-50 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              )}
            />
            {fieldErrors.title && (
              <p className="text-red-500 text-xs mt-1.5 font-medium animate-in slide-in-from-top-1">
                ⚠️ กรุณาระบุชื่อหัวข้อ
              </p>
            )}
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              รายละเอียด
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none text-base"
            />
          </div>

          {/* ================= DATE SECTION ================= */}
          {/* 📱 MOBILE: Native Date Picker (Grid 2 Cols) */}
          <div className="lg:hidden grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                วันที่เริ่ม
              </label>
              <input
                type="date"
                value={getMobileDateValue(
                  formData.startDay,
                  formData.startMonth,
                  formData.startYear,
                )}
                onChange={(e) => handleMobileDateChange(e, "start")}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-medium bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={getMobileDateValue(
                  formData.endDay,
                  formData.endMonth,
                  formData.endYear,
                )}
                onChange={(e) => handleMobileDateChange(e, "end")}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-medium bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 💻 DESKTOP: Dropdowns (3 ช่องต่อวัน) - โค้ดเดิม */}
          <div className="hidden lg:grid grid-cols-2 gap-10">
            {/* วันที่เริ่ม */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                วันที่เริ่ม
              </label>
              <div className="flex gap-4">
                <div className="relative w-[80px] shrink-0">
                  <select
                    name="startDay"
                    value={formData.startDay}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-2 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center text-sm font-medium"
                  >
                    {getDaysArray(formData.startMonth, formData.startYear).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="relative flex-[2]">
                  <select
                    name="startMonth"
                    value={formData.startMonth}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-2 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center text-sm font-medium"
                  >
                    {THAI_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1">
                  <select
                    name="startYear"
                    value={formData.startYear}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-2 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center text-sm font-medium"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* วันที่สิ้นสุด */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <select
                    name="endDay"
                    value={formData.endDay}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-2 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center text-sm font-medium"
                  >
                    {getDaysArray(formData.endMonth, formData.endYear).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="relative flex-[2]">
                  <select
                    name="endMonth"
                    value={formData.endMonth}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-2 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center text-sm font-medium"
                  >
                    {THAI_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1">
                  <select
                    name="endYear"
                    value={formData.endYear}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-2 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center text-sm font-medium"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ================= TIME SECTION ================= */}
          {/* 📱 MOBILE: Split Left/Right, Separate HH/MM boxes */}
          <div className="lg:hidden grid grid-cols-2 gap-4">
            {/* ซ้าย: เวลา */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                เวลา
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 border border-gray-300 rounded-xl bg-white">
                  <select
                    name="startHour"
                    value={formData.startHour}
                    onChange={handleChange}
                    className="w-full h-full py-3 appearance-none bg-transparent text-center focus:outline-none text-sm font-medium"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1 border border-gray-300 rounded-xl bg-white">
                  <select
                    name="startMinute"
                    value={formData.startMinute}
                    onChange={handleChange}
                    className="w-full h-full py-3 appearance-none bg-transparent text-center focus:outline-none text-sm font-medium"
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* ขวา: ถึง */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ถึง
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 border border-gray-300 rounded-xl bg-white">
                  <select
                    name="endHour"
                    value={formData.endHour}
                    onChange={handleChange}
                    className="w-full h-full py-3 appearance-none bg-transparent text-center focus:outline-none text-sm font-medium"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1 border border-gray-300 rounded-xl bg-white">
                  <select
                    name="endMinute"
                    value={formData.endMinute}
                    onChange={handleChange}
                    className="w-full h-full py-3 appearance-none bg-transparent text-center focus:outline-none text-sm font-medium"
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 💻 DESKTOP: ดีไซน์ใหม่ (กล่องกะทัดรัด + ตัวหนังสือเข้ม) */}
          <div className="hidden lg:block">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              เวลา
            </label>
            <div className="flex items-center gap-4">
              {/* Start Time: กล่องชั่วโมง/นาที (ปรับ w-20 ให้พอดีคำ) */}
              <div className="flex items-center gap-2">
                <div className="relative w-20 border border-gray-300 rounded-xl bg-white hover:border-blue-400 transition-colors">
                  <select
                    name="startHour"
                    value={formData.startHour}
                    onChange={handleChange}
                    className="w-full py-3 appearance-none bg-transparent text-center outline-none cursor-pointer text-base rounded-xl font-medium text-slate-700"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative w-20 border border-gray-300 rounded-xl bg-white hover:border-blue-400 transition-colors">
                  <select
                    name="startMinute"
                    value={formData.startMinute}
                    onChange={handleChange}
                    className="w-full py-3 appearance-none bg-transparent text-center outline-none cursor-pointer text-base rounded-xl font-medium text-slate-700"
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ข้อความ "ถึง" (ปรับสีให้เข้มขึ้น) */}
              <span className="text-sm font-bold text-gray-700 mx-2">ถึง</span>

              {/* End Time: กล่องชั่วโมง/นาที (ปรับ w-20 ให้พอดีคำ) */}
              <div className="flex items-center gap-2">
                <div className="relative w-20 border border-gray-300 rounded-xl bg-white hover:border-blue-400 transition-colors">
                  <select
                    name="endHour"
                    value={formData.endHour}
                    onChange={handleChange}
                    className="w-full py-3 appearance-none bg-transparent text-center outline-none cursor-pointer text-base rounded-xl font-medium text-slate-700"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative w-20 border border-gray-300 rounded-xl bg-white hover:border-blue-400 transition-colors">
                  <select
                    name="endMinute"
                    value={formData.endMinute}
                    onChange={handleChange}
                    className="w-full py-3 appearance-none bg-transparent text-center outline-none cursor-pointer text-base rounded-xl font-medium text-slate-700"
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ประเภท */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ประเภท
            </label>
            <div className="relative">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-base capitalize"
              >
                <option value="health">Health</option>
                <option value="zoom">Zoom</option>
                <option value="tele-medicine">Tele-medicine</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          {/* สถานที่ */}
          <div className="pb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              สถานที่ / Link
            </label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-blue-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-base"
            />
          </div>
          {/* ✅ เพิ่มส่วน Dropdown แจ้งเตือนตรงนี้ครับ */}
          <div>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1 mb-2">
              <span className="text-xl">🔔</span> ตั้งเวลาแจ้งเตือนล่วงหน้า
            </label>
            
            <div className="flex flex-col gap-3">
              {/* 1. Dropdown หลัก */}
              <div className="relative">
                <select
                  name="notificationTime"
                  // ถ้าอยู่ในโหมด Custom ให้ค่าเป็น "custom" เพื่อโชว์ตัวเลือกสุดท้าย
                  value={isCustomTime ? "custom" : formData.notificationTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      // เปิดโหมด Custom
                      setIsCustomTime(true);
                      // (Optional) อาจจะ set default เป็น 5 นาทีรอไว้เลยก็ได้
                      setFormData({ ...formData, notificationTime: 5 }); 
                    } else {
                      // ปิดโหมด Custom และใช้ค่าจาก Preset
                      setIsCustomTime(false);
                      setFormData({ ...formData, notificationTime: Number(val) });
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-300 text-slate-700 text-base rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer font-medium"
                >
                  {/* ตัวเลือกมาตรฐาน */}
                  <option value={0}>🔕 ไม่ต้องแจ้งเตือน</option>
                  <option value={10}>⏱️ 10 นาที</option>
                  <option value={30}>⏱️ 30 นาที (ค่าแนะนำ)</option>
                  <option value={60}>🕐 1 ชั่วโมง</option>
                  <option value={120}>🕑 2 ชั่วโมง</option>
                  <option value={1440}>📅 1 วัน</option>
                  <option value={2880}>📅 2 วัน</option>
                  
                  {/* ตัวเลือกพิเศษสำหรับเปิดช่องกรอกเอง */}
                  <option value="custom" className="font-bold text-blue-600 bg-blue-50">
                    ✏️ กำหนดเอง (ระบุนาที)...
                  </option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={20} />
                </div>
              </div>

              {/* 2. ช่องกรอกตัวเลข (จะโผล่มาเมื่อเลือก 'กำหนดเอง') */}
              {isCustomTime && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      name="notificationTime"
                      value={formData.notificationTime}
                      // ใส่ Handler ตรงนี้ให้พิมพ์แก้เลขได้
                      onChange={(e) => setFormData({ ...formData, notificationTime: Number(e.target.value) })}
                      className="flex-1 border border-blue-300 bg-blue-50/30 rounded-xl px-4 py-3 text-slate-700 text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="ระบุจำนวนนาที"
                      autoFocus
                    />
                    <span className="text-slate-500 font-medium whitespace-nowrap">นาที ก่อนเริ่ม</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">
                    * ระบบจะแจ้งเตือนตามจำนวนนาทีที่คุณระบุ
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="px-6 py-4 lg:px-8 lg:py-6 border-t border-gray-100 flex justify-center gap-4 bg-white shrink-0 pb-8 lg:pb-6">
          <button
            onClick={onClose}
            className="flex-1 lg:flex-none lg:w-[140px] py-3.5 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex-1 lg:flex-none lg:w-[140px] py-3.5 rounded-full text-white font-bold transition active:scale-95 flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 shadow-lg shadow-blue-200 lg:bg-[#009245] lg:hover:bg-[#007a3a] lg:shadow-green-200`}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
};
