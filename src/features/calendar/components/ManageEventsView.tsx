import React, { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, Edit, Trash2, Loader2 } from "lucide-react"; // ✅ เพิ่ม Loader2
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Appointment } from "../types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ เพิ่ม Interface เพื่อรับ onRefresh และ onEdit
interface ManageEventsViewProps {
  events: Appointment[];
  isMobile?: boolean;
  onRefresh?: () => void; // ฟังก์ชันรีเฟรชข้อมูล
  onEdit?: (event: Appointment) => void; // ฟังก์ชันเปิด Modal แก้ไข
}

export const ManageEventsView = ({ events, isMobile, onRefresh, onEdit }: ManageEventsViewProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- ฟังก์ชันลบข้อมูล ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่? 🗑️")) return;

    setDeletingId(id); // โชว์ loading ที่ปุ่มนั้น
    try {
      const response = await fetch(`http://localhost:5000/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      // แจ้งเตือนและรีเฟรช
      // alert("ลบข้อมูลเรียบร้อย"); 
      if (onRefresh) onRefresh(); 

    } catch (error) {
      console.error("Error deleting:", error);
      alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="bg-white md:bg-white rounded-[2rem] md:p-8 shadow-sm border border-slate-100 md:border-slate-100 min-h-[80vh] bg-transparent border-none shadow-none">
        
        {/* === Filters Row === */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          {/* ... (ส่วน Filter เหมือนเดิม ไม่ได้แก้ logic) ... */}
           {/* 1. ประเภท */}
           <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-bold text-gray-700 mb-2">ประเภท</label>
            <div className="relative">
              <select className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-700 cursor-pointer text-sm">
                <option>Health</option>
                <option>Zoom</option>
                <option>Tele-medicine</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* 2. สถานะ */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-bold text-gray-700 mb-2">สถานะ</label>
            <div className="relative">
              <select className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-700 cursor-pointer text-sm">
                <option>Success</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* 3. วันที่ */}
          <div className="flex-[2] min-w-[200px] hidden md:block">
            <label className="block text-sm font-bold text-gray-700 mb-2">วันที่</label>
            <div className="relative">
              <select className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-700 cursor-pointer text-sm">
                <option>01 มกราคม 2568 ถึง 30 มกราคม 2568</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="text-left">
                <th className="pb-6 font-bold text-gray-800 text-sm pl-4">ประเภท</th>
                <th className="pb-6 font-bold text-gray-800 text-sm">ชื่อหัวข้อ</th>
                <th className="pb-6 font-bold text-gray-800 text-sm">วันที่</th>
                <th className="pb-6 font-bold text-gray-800 text-sm">สถานะ</th>
                <th className="pb-6 font-bold text-gray-800 text-sm text-right pr-4"></th>
              </tr>
            </thead>
            <tbody className="space-y-4">
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition group">
                  <td className="py-5 pl-4 align-top pt-6">
                    <span className="text-sm font-medium text-gray-700 capitalize">{event.type}</span>
                  </td>
                  <td className="py-5 align-top pt-6">
                    <span className="text-sm font-medium text-gray-700 block max-w-[300px] truncate">{event.title}</span>
                  </td>
                  <td className="py-5 align-top pt-6">
                    <span className="text-sm font-medium text-gray-700">
                      {format(event.date, "dd MMM yyyy")}
                      {event.endDate && ` - ${format(event.endDate, "dd MMM yyyy")}`}
                    </span>
                  </td>
                  <td className="py-5 align-top pt-6">
                    <span className={cn("text-sm font-medium", 
                      event.status === "Success" ? "text-green-600" : 
                      event.status === "Pending" ? "text-orange-500" : "text-red-500")}>
                      {event.status}
                    </span>
                  </td>
                  <td className="py-5 pr-4 text-right pt-4">
                    <div className="flex items-center justify-end gap-3">
                      {/* ปุ่ม Edit */}
                      <button 
                        onClick={() => onEdit && onEdit(event)}
                        className="flex items-center gap-1.5 bg-[#FFC107] hover:bg-[#ffb300] text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      
                      {/* ปุ่ม Delete */}
                      <button 
                        onClick={() => event.id && handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="flex items-center gap-1.5 bg-[#FF3B30] hover:bg-[#d63027] text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {deletingId === event.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />} 
                        {deletingId === event.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE CARD LIST ================= */}
        <div className="md:hidden flex flex-col gap-4 pb-20">
          {events.map((event) => (
            <div key={event.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold capitalize",
                    event.type === "health" ? "bg-orange-100 text-orange-700" :
                    event.type === "zoom" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700")}>
                  {event.type}
                </span>
                <span className={cn("text-xs font-bold",
                    event.status === "Success" ? "text-green-600" :
                    event.status === "Pending" ? "text-orange-500" : "text-red-500")}>
                  {event.status}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-2">{event.title}</h3>
                <p className="text-xs text-gray-400 font-medium">
                  {format(event.date, "dd MMM yyyy")} {event.endDate && `- ${format(event.endDate, "dd MMM yyyy")}`}
                </p>
              </div>
              <div className="flex gap-3 mt-1 pt-3 border-t border-gray-50">
                {/* Mobile Edit */}
                <button 
                  onClick={() => onEdit && onEdit(event)}
                  className="flex-1 bg-[#FFC107] hover:bg-[#ffb300] text-white py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition"
                >
                  Edit
                </button>
                {/* Mobile Delete */}
                <button 
                  onClick={() => event.id && handleDelete(event.id)}
                  disabled={deletingId === event.id}
                  className="flex-1 bg-[#FF3B30] hover:bg-[#d63027] text-white py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition flex justify-center items-center gap-2"
                >
                  {deletingId === event.id && <Loader2 size={16} className="animate-spin"/>} Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};