import React from "react";
import {
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isToday,
  endOfWeek,
  differenceInCalendarDays,
} from "date-fns";
import { th } from "date-fns/locale"; // 🇹🇭 อย่าลืม import locale ไทยมาใช้
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Clock,
  Calendar as CalendarIcon,
  Info,
  Inbox,
  Check,
  ExternalLink,
  X,
  User,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Appointment } from "../types";
import zoomIcon from "../../../assets/zoom.png";
import healthIcon from "../../../assets/health.png";
import teleIcon from "../../../assets/tele.png";
import API_URL from "../../../config";

const eventImages = {
  zoom: zoomIcon,
  health: healthIcon,
  "tele-medicine": teleIcon,
};

// --- Configuration สีและไอคอน ---
const eventStyles = {
  zoom: "bg-[#60A5FA]",
  health: "bg-[#FB923C]",
  "tele-medicine": "bg-[#f472b6]",
};

// สี Background สำหรับแถบในปฏิทิน
const eventBgStyles = {
  zoom: "bg-blue-200 text-blue-800",
  health: "bg-orange-200 text-orange-800",
  "tele-medicine": "bg-pink-200 text-pink-800",
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarViewProps {
  currentDate: Date;
  nextMonth: () => void;
  prevMonth: () => void;
  calendarDays: Date[];
  monthStart: Date;
  events: Appointment[];
  handleEventClick: (event: Appointment) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  activeTab: "list" | "detail";
  setActiveTab: (tab: "list" | "detail") => void;
  selectedEvent: Appointment;
  isMobile?: boolean;
}

export const CalendarView = ({
  currentDate,
  nextMonth,
  prevMonth,
  calendarDays,
  monthStart,
  events,
  handleEventClick,
  setIsModalOpen,
  activeTab,
  setActiveTab,
  selectedEvent,
  isMobile,
}: CalendarViewProps) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [participantList, setParticipantList] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (selectedEvent) {
      setParticipantList((selectedEvent as any).participants || []);
    }
  }, [selectedEvent]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      return isWithinInterval(day, {
        start: startOfDay(event.date),
        end: endOfDay(event.endDate || event.date),
      });
    });
  };

  const handleAddParticipant = async () => {
    if (!inviteEmail.trim() || !selectedEvent) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    const currentList = (selectedEvent as any).participants || [];
    if (currentList.includes(inviteEmail)) {
      alert("อีเมลนี้มีอยู่ในรายการแล้วครับ");
      return;
    }

    const newList = [...currentList, inviteEmail];

    try {
      const token = localStorage.getItem("user_token");
      const API_BASE = "http://localhost:5000"; 

      const res = await fetch(`${API_BASE}/appointments/${selectedEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...selectedEvent, participants: newList }),
      });

      if (res.ok) {
        setInviteEmail("");
        setParticipantList(newList);
        (selectedEvent as any).participants = newList;
        alert("เพิ่มผู้เข้าร่วมเรียบร้อยแล้ว!");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleRemoveParticipant = async (emailToRemove: string) => {
    if (!selectedEvent) return;

    const isConfirmed = window.confirm(
      `คุณต้องการลบ "${emailToRemove}" ออกจากรายชื่อใช่หรือไม่?`,
    );
    if (!isConfirmed) return;

    const currentList = (selectedEvent as any).participants || [];
    const newList = currentList.filter(
      (email: string) => email !== emailToRemove,
    );

    try {
      const token = localStorage.getItem("user_token");

      const res = await fetch(`${API_URL}/appointments/${selectedEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...selectedEvent, participants: newList }),
      });

      if (res.ok) {
        setParticipantList(newList);
        (selectedEvent as any).participants = newList;
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // 🔥 [NEW LOGIC] ระบบจองแถวแบบคงที่ (Track Assignment) เพื่อแก้ปัญหานัดซ้อนทับ
  const eventSlots = React.useMemo(() => {
    const slots = new Map<string, number>();
    
    // เรียง Event ตามวันที่เริ่ม (เก่าสุดขึ้นก่อน) ถ่าเริ่มพร้อมกันเอาตัวยาวกว่าขึ้นก่อน
    const sortedEvents = [...events].sort((a, b) => {
      const startA = startOfDay(new Date(a.date)).getTime();
      const startB = startOfDay(new Date(b.date)).getTime();
      if (startA !== startB) return startA - startB;

      const durA = (a.endDate ? endOfDay(new Date(a.endDate)).getTime() : startA) - startA;
      const durB = (b.endDate ? endOfDay(new Date(b.endDate)).getTime() : startB) - startB;
      return durB - durA; 
    });

    const tracks: number[] = [];
    sortedEvents.forEach((evt) => {
      const start = startOfDay(new Date(evt.date)).getTime();
      const end = endOfDay(new Date(evt.endDate || evt.date)).getTime();
      
      // หาช่องวาง (เลน) ที่ว่างอยู่
      let slotIndex = tracks.findIndex((trackEnd) => start > trackEnd);
      if (slotIndex === -1) {
        slotIndex = tracks.length;
        tracks.push(end);
      } else {
        tracks[slotIndex] = end;
      }
      slots.set(evt.id, slotIndex);
    });

    return slots;
  }, [events]);

  return (
    <div className="max-w-[1600px] mx-auto p-0 lg:p-6 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 bg-white lg:bg-transparent ">
      {/* ================= LEFT SIDE: CALENDAR GRID ================= */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="lg:hidden flex flex-col gap-4 mb-2">
          <div className="flex items-center justify-between px-1 pt-1 lg:px-0 lg:pt-0 lg:mb-8">
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-gray-100 active:bg-gray-200 transition"
              >
                <ChevronLeft size={24} />
              </button>

              <h2 className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
                {format(currentDate, "MMMM yyyy")}
              </h2>

              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-gray-100 active:bg-gray-200 transition"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="
                bg-[#0033A0] text-white rounded-full font-bold shadow-md shadow-blue-200 flex items-center transition active:scale-95
                px-3 py-1.5 gap-1 text-[12px]
                lg:px-5 lg:py-2.5 lg:gap-2 lg:text-[14px]
              "
            >
              <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
              Add Event
            </button>
          </div>

          <div className="flex flex-wrap gap-3 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
              <span className="text-xs text-slate-500 font-medium">
                Tele-medicine
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-500 font-medium">Zoom</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span className="text-xs text-slate-500 font-medium">Health</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#009245] hover:bg-[#007a3a] text-white px-6 py-2.5 rounded-full font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
            >
              <Plus size={18} /> Add New Event
            </button>
          </div>

          <div className="flex flex-wrap gap-4 ml-1">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-pink-400"></span>{" "}
              Tele-medicine
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span> Zoom
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-orange-400"></span>{" "}
              Health
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white lg:rounded-[2rem] lg:p-8 lg:shadow-sm lg:border lg:border-slate-100 min-h-[500px]">
          <div className="hidden lg:flex items-center gap-4 mb-8">
            <button
              onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-3xl font-bold text-slate-900 select-none">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-bold text-gray-400 tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-slate-200">
            {calendarDays.map((day, idx) => {
              // 1. กรองนัดหมายประจำวัน
              const dayEvents = events.filter((event) => {
                const eventStart = startOfDay(new Date(event.date));
                const eventEnd = endOfDay(new Date(event.endDate || event.date));
                return day >= eventStart && day <= eventEnd;
              });

              // 2. คำนวณหาว่าวันนี้ใช้พื้นที่(แถว)ไปมากสุดเท่าไหร่
              const maxSlot = dayEvents.length > 0 
                ? Math.max(...dayEvents.map(e => eventSlots.get(e.id) ?? 0)) 
                : -1;

              // 3. สร้าง Array ของแถวเพื่อใช้ Render (เว้นกล่องเปล่าให้แถวที่ถูกจองไปแล้ว)
              const renderSlots = [];
              for (let i = 0; i <= maxSlot; i++) {
                renderSlots.push({
                  slotIndex: i,
                  event: dayEvents.find((e) => eventSlots.get(e.id) === i) || null,
                });
              }

              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] lg:min-h-[120px] relative border-b lg:border-r border-slate-100 transition",
                    idx % 7 === 0 && "border-l",
                    !isCurrentMonth && "bg-gray-50/50 text-gray-300",
                  )}
                >
                  <div className="flex justify-center py-2">
                    <span
                      className={cn(
                        "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all",
                        !isCurrentMonth && "text-gray-300",
                        isCurrentDay && "bg-[#0033A0] text-white shadow-md font-bold scale-110",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* ✅ Event Rendering Loop (ใช้ข้อมูล RenderSlots แทน) */}
                  <div className="flex flex-col gap-1">
                    {renderSlots.map(({ slotIndex, event }) => {
                      // ถ้าไม่มี Event ในแถวนี้ ให้เรนเดอร์กล่องเปล่าเพื่อรักษาระดับความสูง (Ghost Slot)
                      if (!event) {
                        return (
                          <div 
                            key={`empty-${day.getTime()}-${slotIndex}`} 
                            className="h-6 mb-1 pointer-events-none opacity-0" 
                          />
                        );
                      }

                      // --- ตัวแปรพื้นฐาน ---
                      const actualEndDate = event.endDate || event.date;
                      const isStart = isSameDay(day, event.date);
                      const isEnd = isSameDay(day, actualEndDate);
                      const isSingleDay = isStart && isEnd;
                      
                      // 🌟 ตัวแปรสำคัญ: แสดงผลหัวการ์ดเมื่อเป็น "วันเริ่ม" หรือ "วันอาทิตย์(ขึ้นบรรทัดใหม่)"
                      const isLabelVisible = isStart || format(day, "eee") === "Sun";

                      // --- เช็คการข้ามสัปดาห์ ---
                      const currentDayStart = startOfDay(day);
                      const rowEnd = endOfWeek(currentDayStart);
                      const isOverlappingWeek = actualEndDate > rowEnd;

                      // --- 📐 คำนวณความกว้าง (Visual Width) ---
                      let labelStyle: React.CSSProperties = {};
                      if (isLabelVisible && !isSingleDay) {
                        const visualEnd = actualEndDate < rowEnd ? actualEndDate : rowEnd;
                        const span = differenceInCalendarDays(visualEnd, currentDayStart) + 1;

                        labelStyle = {
                          width: `calc(${span * 100}% - 6px)`,
                          zIndex: 20,
                        };
                      }

                      return (
                        <div
                          key={`${event.id}-${day.toString()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={cn(
                            // ✅ ดีไซน์เดิมของคุณ
                            "h-6 px-2 text-[8px] md:text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-80 transition shadow-sm mb-1 relative",

                            // ✅ 1. Z-Index & Overflow (อิงจาก isLabelVisible)
                            isSingleDay
                              ? "z-10 overflow-hidden"
                              : isLabelVisible
                                ? "z-20 overflow-visible"
                                : "z-0 overflow-hidden",

                            // ✅ 2. Background Color (ถ้าข้ามบรรทัดมา วันอาทิตย์ต้องมีสีด้วย!)
                            isLabelVisible
                              ? eventBgStyles[event.type as keyof typeof eventBgStyles] || "bg-gray-200"
                              : "bg-transparent",

                            // ✅ 3. Shape Logic (จัดการมุมโค้งเวลาข้ามบรรทัด)
                            isSingleDay
                              ? "rounded-full mx-1"
                              : isStart // กรณี: วันเริ่มต้นจริงๆ (มนซ้ายเสมอ)
                                ? cn(
                                    "ml-1 mr-0 rounded-l-full",
                                    isOverlappingWeek
                                      ? "rounded-r-none" // ทะลุ week ตัดตรงขวา
                                      : "rounded-r-full", // จบใน week มนขวา
                                  )
                                : isLabelVisible // กรณี: วันอาทิตย์ (ข้ามบรรทัดมา)
                                  ? cn(
                                      "ml-0 mr-0 rounded-l-none", // ซ้ายตัดตรง! (เพื่อเชื่อมกับบรรทัดบน)
                                      isOverlappingWeek
                                        ? "rounded-r-none" 
                                        : "rounded-r-full"
                                    )
                                  : "mx-0",

                            // ซ่อนชื่อถ้าไม่ใช่วันที่ต้องแสดง
                            !isLabelVisible && !isSingleDay && "text-transparent",
                          )}
                          style={!isSingleDay && isLabelVisible ? labelStyle : undefined}
                        >
                          {/* ไอคอน (แสดงเฉพาะวันที่เริ่มต้นจริงๆ เท่านั้น ไม่เอามาโชว์ซ้ำตอนขึ้นบรรทัดใหม่) */}
                          {isStart && (
                            <img
                              src={eventImages[event.type as keyof typeof eventImages]}
                              alt="icon"
                              className="w-3 h-3 md:w-5 md:h-5 object-contain shrink-0"
                            />
                          )}

                          {/* ข้อความ */}
                          <span
                            className={cn(
                              "font-medium leading-none truncate",
                              isSingleDay && "flex-1 min-w-0",
                              !isSingleDay && "block shrink-0",
                              !isLabelVisible && !isSingleDay && "hidden",
                            )}
                          >
                            {event.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: DETAIL SIDEBAR ================= */}
      {!isMobile && (
        <div className="w-full lg:w-[380px] flex flex-col gap-6 pt-0 lg:pt-16">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition",
                activeTab === "list"
                  ? "bg-pink-400 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setActiveTab("detail")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition",
                activeTab === "detail"
                  ? "bg-pink-400 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              Detail
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
            {activeTab === "list" ? (
              events.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-60">
                  <Inbox size={48} strokeWidth={1.5} />
                  <p className="text-lg font-bold">ตอนนี้ไม่มีนัดหมาย</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                  {(() => {
                    const now = new Date();
                    const sortedEvents = events
                      .filter((e) => (e.endDate || e.date) >= now)
                      .sort((a, b) => {
                        const dateDiff = a.date.getTime() - b.date.getTime();
                        if (dateDiff !== 0) return dateDiff;
                        const timeA = a.time.split(" - ")[0] || "00:00";
                        const timeB = b.time.split(" - ")[0] || "00:00";
                        return timeA.localeCompare(timeB);
                      });

                    if (sortedEvents.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-[200px] text-gray-300 gap-2 opacity-60">
                          <p>ไม่มีนัดหมายเร็วๆ นี้</p>
                        </div>
                      );
                    }

                    return sortedEvents.map((event) => {
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="bg-gray-50 rounded-[1.5rem] p-4 flex items-center gap-4 border border-slate-100 transition cursor-pointer group hover:shadow-md hover:scale-[1.02]"
                        >
                          <div className="shrink-0 relative">
                            <img
                              src={
                                eventImages[
                                  event.type as keyof typeof eventImages
                                ]
                              }
                              alt="icon"
                              className="w-12 h-12 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate text-slate-800">
                              {event.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>
                                {format(event.date, "MMM d")} • {event.time}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )
            ) : !selectedEvent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-60">
                <CalendarIcon size={48} strokeWidth={1.5} />
                <p className="text-lg font-bold">
                  เลือกรายการเพื่อดูรายละเอียด
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    ชื่อหัวข้อ
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-bold text-slate-800 border border-gray-100 shadow-sm">
                    {selectedEvent.title}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    รายละเอียด
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-600 border border-gray-100 min-h-[80px]">
                    {selectedEvent.description || "-"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    ช่วงวันที่
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-3 text-xs font-bold text-slate-700 border border-gray-100 flex items-center gap-2">
                    <CalendarIcon size={14} className="text-pink-400" />
                    {format(selectedEvent.date, "dd MMM yyyy")}
                    {selectedEvent.endDate &&
                      ` - ${format(selectedEvent.endDate, "dd MMM yyyy")}`}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    ช่วงเวลา
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-3 text-xs font-bold text-slate-700 border border-gray-100 flex items-center gap-2">
                    <Clock size={14} className="text-pink-400" />
                    {selectedEvent.time}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    ประเภท
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-700 border border-gray-100 capitalize flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedEvent.type === "health"
                          ? "bg-orange-400"
                          : selectedEvent.type === "zoom"
                            ? "bg-blue-400"
                            : "bg-pink-400"
                      }`}
                    />
                    {selectedEvent.type}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    สถานที่ / Link
                  </label>

                  {selectedEvent.location?.startsWith("http") ? (
                    <div className="bg-white rounded-2xl p-3 text-sm border border-gray-200 flex justify-between items-center group hover:border-blue-300 transition">
                      <a
                        href={selectedEvent.location}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate flex-1 font-medium text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        {selectedEvent.location}
                      </a>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(selectedEvent.location || "");
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-blue-500"
                        title="Copy Link"
                      >
                        {isCopied ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleCopy(selectedEvent.location || "-")}
                      className="bg-white rounded-2xl p-3 text-sm text-gray-700 border border-gray-200 flex justify-between items-center cursor-pointer group hover:border-blue-300 transition hover:bg-gray-50 active:scale-[0.99]"
                    >
                      <span className="truncate flex-1 font-medium">
                        {selectedEvent.location || "-"}
                      </span>
                      <div className="text-gray-300 group-hover:text-blue-400 transition">
                        {isCopied ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    แจ้งเตือนล่วงหน้า
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-slate-700 border border-gray-100 flex items-center gap-2">
                    {selectedEvent.notificationTime &&
                    selectedEvent.notificationTime > 0
                      ? `${selectedEvent.notificationTime} นาที`
                      : "ไม่ได้ตั้งเตือน"}
                  </div>
                </div>

                <div className="mt-1.5 pt-1 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-400 mb-2 block ml-1">
                    เชิญผู้เข้าร่วม (ระบุ Email)
                  </label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="doctor@example.com"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      onClick={handleAddParticipant}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-200 transition"
                    >
                      เพิ่ม
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {participantList.map((email, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 text-gray-600 text-xs pl-2 pr-1 py-1 rounded-lg flex items-center gap-1 shadow-sm group hover:border-red-200 transition"
                      >
                        <span>👤 {email}</span>
                        <button
                          onClick={() => handleRemoveParticipant(email)}
                          className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="ลบรายชื่อนี้"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {participantList.length === 0 && (
                      <span className="text-gray-300 text-xs italic ml-1">
                        ยังไม่มีผู้เข้าร่วมอื่น
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};