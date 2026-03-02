import React, { useState, useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import API_URL from "../../../config";
import {
  ChevronDown,
  Edit,
  Trash2,
  Loader2,
  RotateCcw,
  Search, // ✅ เพิ่มไอคอน Search
  CheckCircle, // ✅ เพิ่มไอคอน Check
  Calendar as CalendarIcon, // ✅ เพิ่มไอคอน Calendar
} from "lucide-react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Appointment } from "../types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ManageEventsViewProps {
  events: Appointment[];
  isMobile?: boolean;
  onRefresh?: () => void;
  onEdit?: (event: Appointment) => void;
}

export const ManageEventsView = ({
  events,
  isMobile,
  onRefresh,
  onEdit,
}: ManageEventsViewProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- State ตัวกรอง ---
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- Logic กรอง + เรียงลำดับ + คำนวณสถานะ (เหมือนเดิมเป๊ะ) ---
  const processedEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. กรองข้อมูล
    const filtered = events.filter((event) => {
      const eventEndDate = new Date(event.endDate || event.date);
      const isPast = eventEndDate < now;
      const currentStatus =
        event.status === "Pending" && isPast ? "Success" : event.status;

      const matchType =
        filterType === "All" ||
        event.type.toLowerCase() === filterType.toLowerCase();
      const matchStatus =
        filterStatus === "All" || currentStatus === filterStatus;

      let matchDate = true;
      if (startDate && endDate) {
        const startFilter = startOfDay(new Date(startDate));
        const endFilter = endOfDay(new Date(endDate));
        const eventDate = new Date(event.date);
        matchDate = eventDate >= startFilter && eventDate <= endFilter;
      }
      return matchType && matchStatus && matchDate;
    });

    // 2. เรียงลำดับ (อนาคตขึ้นก่อน -> อดีต)
    const upcoming = filtered.filter(
      (e) => new Date(e.endDate || e.date) >= now,
    );
    const past = filtered.filter((e) => new Date(e.endDate || e.date) < now);

    upcoming.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    past.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return [...upcoming, ...past];
  }, [events, filterType, filterStatus, startDate, endDate]);

  const resetFilters = () => {
    setFilterType("All");
    setFilterStatus("All");
    setStartDate("");
    setEndDate("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบนัดหมายนี้ใช่หรือไม่?")) return;

    try {
      const token = localStorage.getItem("user_token"); // 🔑 ดึง Token

      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}` // 🔑 แนบ Token
        }
      });

      if (!response.ok) throw new Error("Failed to delete");

      onRefresh(); // โหลดข้อมูลใหม่
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  };

  const getDisplayStatus = (event: Appointment) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventEndDate = new Date(event.endDate || event.date);
    if (eventEndDate < now && event.status === "Pending") return "Success";
    return event.status;
  };

  return (
    // ✅ เปลี่ยน md: เป็น lg: เพื่อให้ Tablet ใช้ Mobile View
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="bg-transparent lg:bg-white rounded-[2rem] lg:p-8 shadow-none lg:shadow-sm border-none lg:border border-slate-100 min-h-[80vh]">
        {/* ================= 📱 MOBILE & TABLET FILTERS (GRID 2x2 แบบใหม่) ================= */}
        {/* ✅ เปลี่ยน md:hidden เป็น lg:hidden เพื่อให้ Tablet เห็นส่วนนี้ */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-6">
          {/* 1. ปุ่มเลือกประเภท */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Search size={18} />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">ประเภท</option>
              <option value="health">Health</option>
              <option value="zoom">Zoom</option>
              <option value="tele-medicine">Tele-medicine</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* 2. ปุ่มเลือกสถานะ */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <CheckCircle size={18} />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">สถานะ</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* 3. วันที่เริ่ม */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <CalendarIcon size={18} />
            </div>
            <input
              type="text"
              placeholder="วว/ดด/ปป"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
            />
          </div>

          {/* 4. วันที่สิ้นสุด */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <CalendarIcon size={18} />
            </div>
            <input
              type="text"
              placeholder="ถึงวันที่"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => (e.target.type = "text")}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* ================= 💻 DESKTOP FILTERS (คงเดิมไว้) ================= */}
        {/* ✅ เปลี่ยน hidden md:flex เป็น hidden lg:flex เพื่อซ่อนใน Tablet */}
        <div className="hidden lg:flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50/50 rounded-3xl border border-gray-100">
          {/* ... (Desktop Filters Code - เหมือนเดิมทุกบรรทัด) ... */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">
              ประเภท
            </label>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full appearance-none border border-gray-200 bg-white rounded-2xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 cursor-pointer text-sm shadow-sm"
              >
                <option value="All">All</option>
                <option value="health">Health</option>
                <option value="zoom">Zoom</option>
                <option value="tele-medicine">Tele-medicine</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">
              สถานะ
            </label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none border border-gray-200 bg-white rounded-2xl px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 cursor-pointer text-sm shadow-sm"
              >
                <option value="All">All</option>
                <option value="Success">Success</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="flex-[2] min-w-[300px]">
            <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">
              วันที่
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 text-sm shadow-sm cursor-pointer"
                />
              </div>
              <span className="text-sm font-bold text-gray-400">ถึง</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 font-bold text-gray-700 text-sm shadow-sm cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="h-[46px] w-[46px] flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition shadow-sm"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* ================= 💻 DESKTOP TABLE (Style เดิม) ================= */}
        {/* ✅ เปลี่ยน hidden md:block เป็น hidden lg:block */}
        <div className="hidden lg:block overflow-y-auto max-h-[600px] custom-scrollbar border-t border-gray-100">
          <table className="w-full min-w-[800px] border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-left">
                <th className="py-4 bg-white font-bold text-gray-800 text-sm pl-4">
                  ประเภท
                </th>
                <th className="py-4 bg-white font-bold text-gray-800 text-sm">
                  ชื่อหัวข้อ
                </th>
                <th className="py-4 bg-white font-bold text-gray-800 text-sm">
                  วันที่
                </th>
                <th className="py-4 bg-white font-bold text-gray-800 text-sm">
                  สถานะ
                </th>
                <th className="py-4 bg-white font-bold text-gray-800 text-sm text-right pr-4"></th>
              </tr>
            </thead>
            <tbody className="space-y-4">
              {processedEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-gray-400 font-medium"
                  >
                    ไม่พบข้อมูลตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                processedEvents.map((event) => {
                  const displayStatus = getDisplayStatus(event);

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition group"
                    >
                      <td className="py-5 pl-4 align-top pt-6">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {event.type}
                        </span>
                      </td>
                      <td className="py-5 align-top pt-6">
                        <span className="text-sm font-medium text-gray-700 block max-w-[300px] truncate">
                          {event.title}
                        </span>
                      </td>
                      <td className="py-5 align-top pt-6">
                        <span className="text-sm font-medium text-gray-700">
                          {format(event.date, "dd MMM yyyy")}
                          {event.endDate &&
                            ` - ${format(event.endDate, "dd MMM yyyy")}`}
                        </span>
                      </td>
                      <td className="py-5 align-top pt-6">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            displayStatus === "Success"
                              ? "text-green-600"
                              : displayStatus === "Pending"
                                ? "text-orange-500"
                                : "text-red-500",
                          )}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-right pt-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => onEdit && onEdit(event)}
                            className="flex items-center gap-1.5 bg-[#FFC107] hover:bg-[#ffb300] text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => event.id && handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="flex items-center gap-1.5 bg-[#FF3B30] hover:bg-[#d63027] text-white px-4 py-2 rounded-full text-xs font-bold transition shadow-sm disabled:opacity-50"
                          >
                            {deletingId === event.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            {deletingId === event.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= 📱 MOBILE & TABLET CARD LIST (ดีไซน์ใหม่) ================= */}
        {/* ✅ เปลี่ยน md:hidden เป็น lg:hidden */}
        <div className="lg:hidden flex flex-col gap-4 pb-20">
          {processedEvents.map((event) => {
            const displayStatus = getDisplayStatus(event);
            return (
              <div
                key={event.id}
                className="bg-gray-50 p-5 rounded-[1.5rem] flex flex-col gap-3"
              >
                {/* 1. Badge ประเภท */}
                <div className="flex justify-start">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold capitalize",
                      event.type === "health"
                        ? "bg-orange-100 text-orange-700"
                        : event.type === "zoom"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700",
                    )}
                  >
                    {event.type}
                  </span>
                </div>

                {/* 2. ชื่อหัวข้อ */}
                <h3 className="font-bold text-gray-800 text-base leading-tight">
                  {event.title}
                </h3>

                {/* 3. วันที่ & สถานะ (สถานะอยู่ใต้วันที่ตามขอ) */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-400 font-medium">
                    {format(event.date, "dd MMM yyyy")}
                    {event.endDate &&
                      ` - ${format(event.endDate, "dd MMM yyyy")}`}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      displayStatus === "Success"
                        ? "text-green-600"
                        : displayStatus === "Pending"
                          ? "text-orange-500"
                          : "text-red-500",
                    )}
                  >
                    {displayStatus}
                  </span>
                </div>

                {/* 4. ปุ่ม Action (Mobile: Edit เป็นก้อน, Delete เป็นไอคอนถังขยะ) */}
                <div className="flex justify-start items-center gap-2 mt-2">
                    {/* ปุ่ม Edit (เหมือนเดิม) */}
                    <button
                        onClick={() => onEdit && onEdit(event)}
                        className="bg-[#FFC107] hover:bg-[#ffb300] text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition"
                    >
                        Edit
                    </button>

                    {/* ✅ ปุ่ม Delete (แก้ใหม่: เป็นไอคอนถังขยะล้วน) */}
                    <button
                        onClick={() => event.id && handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="bg-[#FF3B30] hover:bg-[#d63027] text-white w-10 h-7 flex items-center justify-center rounded-full shadow-sm active:scale-95 transition"
                    >
                        {deletingId === event.id ? (
                             <Loader2 size={12} className="animate-spin" />
                        ) : (
                             <Trash2 size={14} /> 
                        )}
                    </button>
                </div>
              </div>
            );
          })}
          {processedEvents.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-3xl">
              ไม่พบข้อมูลตามเงื่อนไข
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
