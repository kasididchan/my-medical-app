import React, { useState, useEffect } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import type { Appointment } from "../types"; // ✅ Import Type เข้ามา

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventToEdit?: Appointment | null; // ✅ รับค่า Event ที่จะแก้ (ถ้ามี)
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
// สร้างปี พ.ศ. ย้อนหลังและล่วงหน้า
const CURRENT_YEAR = new Date().getFullYear() + 543;
const YEARS = Array.from({ length: 10 }, (_, i) =>
  (CURRENT_YEAR - 2 + i).toString(),
); // 2 ปีก่อน - 7 ปีหน้า

const DAYS = Array.from({ length: 31 }, (_, i) =>
  (i + 1).toString().padStart(2, "0"),
);
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const MINUTES = ["00", "15", "30", "45"];

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
    // วันที่เริ่ม
    startDay: "01",
    startMonth: "มกราคม",
    startYear: YEARS[2], // default ปีปัจจุบัน
    // วันที่สิ้นสุด
    endDay: "01",
    endMonth: "มกราคม",
    endYear: YEARS[2],
    // เวลา
    startHour: "09",
    startMinute: "00",
    endHour: "10",
    endMinute: "00",
    // อื่นๆ
    type: "health",
    location: "",
  });

  // ✅ Effect: ดึงข้อมูลเก่ามาใส่ฟอร์ม (เมื่อเปิด Modal และมี eventToEdit)
  useEffect(() => {
    if (isOpen && eventToEdit) {
      const startDate = new Date(eventToEdit.date);
      const endDate = new Date(eventToEdit.endDate || eventToEdit.date);

      // แกะเวลาจาก string "09:00 - 10:00"
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

        // แปลงวันที่ Start
        startDay: startDate.getDate().toString().padStart(2, "0"),
        startMonth: THAI_MONTHS[startDate.getMonth()],
        startYear: (startDate.getFullYear() + 543).toString(),

        // แปลงวันที่ End
        endDay: endDate.getDate().toString().padStart(2, "0"),
        endMonth: THAI_MONTHS[endDate.getMonth()],
        endYear: (endDate.getFullYear() + 543).toString(),

        // เวลา
        startHour: sHour,
        startMinute: sMin,
        endHour: eHour,
        endMinute: eMin,
      });
    } else if (isOpen && !eventToEdit) {
      // ถ้าเปิดแบบ "สร้างใหม่" ให้รีเซ็ตฟอร์ม
      resetForm();
    }
  }, [isOpen, eventToEdit]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      type: "health",
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
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. แปลงวันที่ (เหมือนเดิม)
      const monthIndexStart = THAI_MONTHS.indexOf(formData.startMonth);
      const yearADStart = parseInt(formData.startYear) - 543;
      const startDateObj = new Date(
        yearADStart,
        monthIndexStart,
        parseInt(formData.startDay),
      );

      const monthIndexEnd = THAI_MONTHS.indexOf(formData.endMonth);
      const yearADEnd = parseInt(formData.endYear) - 543;
      const endDateObj = new Date(
        yearADEnd,
        monthIndexEnd,
        parseInt(formData.endDay),
      );

      // 2. เตรียม Payload
      const payload = {
        title: formData.title,
        description: formData.description,
        date: startDateObj,
        endDate: endDateObj,
        time: `${formData.startHour}:${formData.startMinute} - ${formData.endHour}:${formData.endMinute}`,
        type: formData.type.toLowerCase(),
        location: formData.location,
        status: eventToEdit ? eventToEdit.status : "Pending", // ถ้าแก้ ให้คงสถานะเดิม
      };

      // ✅ 3. เช็คว่าจะ POST (สร้าง) หรือ PUT (แก้)
      let url = "http://localhost:5000/appointments";
      let method = "POST";

      if (eventToEdit && eventToEdit.id) {
        url = `http://localhost:5000/appointments/${eventToEdit.id}`;
        method = "PUT"; // เปลี่ยนเป็นแก้ไข
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      // alert(eventToEdit ? "แก้ไขข้อมูลสำเร็จ! 📝" : "บันทึกข้อมูลสำเร็จ! 🎉");
      onClose();
      resetForm();

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          {/* เปลี่ยนหัวข้อตามสถานะ */}
          <h2 className="text-2xl font-bold text-gray-800">
            {eventToEdit ? "Edit Event" : "Add New Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6"
        >
          {/* ชื่อหัวข้อ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ชื่อหัวข้อ
            </label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-base"
            />
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition resize-none text-base"
            />
          </div>

          {/* Grid วันที่เริ่ม - สิ้นสุด */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* วันที่เริ่ม */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                วันที่เริ่ม
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    name="startDay"
                    value={formData.startDay}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative flex-[2]">
                  <select
                    name="startMonth"
                    value={formData.startMonth}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center"
                  >
                    {THAI_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <select
                    name="startYear"
                    value={formData.startYear}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* วันที่สิ้นสุด */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    name="endDay"
                    value={formData.endDay}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative flex-[2]">
                  <select
                    name="endMonth"
                    value={formData.endMonth}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center"
                  >
                    {THAI_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <select
                    name="endYear"
                    value={formData.endYear}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 bg-white focus:outline-none focus:border-green-500 cursor-pointer text-center"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* เวลา */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              เวลา
            </label>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-3 bg-white">
                <select
                  name="startHour"
                  value={formData.startHour}
                  onChange={handleChange}
                  className="appearance-none outline-none bg-transparent text-center w-8 cursor-pointer"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  name="startMinute"
                  value={formData.startMinute}
                  onChange={handleChange}
                  className="appearance-none outline-none bg-transparent text-center w-8 cursor-pointer"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-gray-500 font-medium">ถึง</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-3 bg-white">
                <select
                  name="endHour"
                  value={formData.endHour}
                  onChange={handleChange}
                  className="appearance-none outline-none bg-transparent text-center w-8 cursor-pointer"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  name="endMinute"
                  value={formData.endMinute}
                  onChange={handleChange}
                  className="appearance-none outline-none bg-transparent text-center w-8 cursor-pointer"
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
          <div>
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
        </form>

        {/* Footer Buttons */}
        <div className="px-8 py-6 border-t border-gray-100 flex gap-4 bg-white shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition active:scale-95"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3.5 rounded-full bg-[#009245] text-white font-bold hover:bg-[#007a3a] transition shadow-lg shadow-green-200 active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
};
