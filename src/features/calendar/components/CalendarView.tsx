import React from "react";
import {
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isToday,
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
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Appointment } from "../types";
import zoomIcon from "../../../assets/zoom.png";
import healthIcon from "../../../assets/health.png";
import teleIcon from "../../../assets/tele.png";

const eventImages = {
  zoom: zoomIcon,
  health: healthIcon,
  'tele-medicine': teleIcon,
};

// --- Configuration สีและไอคอน ---
const eventStyles = {
  zoom: "bg-[#60A5FA]",
  health: "bg-[#FB923C]",
  'tele-medicine': "bg-[#f472b6]",
};

// สี Background สำหรับแถบในปฏิทิน (เข้มกว่าปกติเล็กน้อยเพื่อให้เห็นชัด)
const eventBgStyles = {
  zoom: "bg-blue-200 text-blue-800",
  health: "bg-orange-200 text-orange-800",
  'tele-medicine': "bg-pink-200 text-pink-800",
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
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  // ฟังก์ชันเช็คว่าวันนั้นมีอีเวนต์อะไรบ้าง (รองรับ Multi-day)
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      // เช็คว่า 'วันปัจจุบัน' อยู่ในช่วง 'เริ่ม-จบ' ของอีเวนต์หรือไม่
      return isWithinInterval(day, {
        start: startOfDay(event.date),
        end: endOfDay(event.endDate || event.date), // ถ้าไม่มี endDate ให้ใช้วันเริ่ม
      });
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* ================= LEFT SIDE: CALENDAR GRID ================= */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Header Controls & Legend */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#009245] hover:bg-[#007a3a] text-white px-6 py-2.5 rounded-full font-medium shadow-sm flex items-center gap-2 transition active:scale-95"
            >
              <Plus size={18} /> Add New Event
            </button>
          </div>

          {/* ✅ 1. เพิ่ม LEGEND (คำอธิบายสี) ตรงนี้ */}
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
        <div className="bg-white rounded-[2rem] p-4 lg:p-8 shadow-sm border border-slate-100 min-h-[600px]">
          <div className="flex items-center gap-4 mb-8">
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
              const dayEvents = getEventsForDay(day); // ใช้ฟังก์ชันใหม่ที่สร้างข้างบน
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[120px] relative border-b border-r border-slate-100 transition", // ✅ ลบ p-1 ออกแล้ว
                    idx % 7 === 0 && "border-l",
                    !isCurrentMonth && "bg-gray-50/50 text-gray-300",
                  )}
                >
                  <div className="flex justify-center py-2">
                    <span
                      className={cn(
                        "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all", // จัดให้อยู่กึ่งกลางวงกลม
                        !isCurrentMonth && "text-gray-300",
                        // ✨ ถ้าเป็นวันนี้: ใส่สีพื้นหลัง + ตัวหนังสือขาว + เงา + ขยายหน่อยๆ
                        isCurrentDay && "bg-[#0033A0] text-white shadow-md font-bold scale-110" 
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Event Rendering Loop */}
                  <div className="flex flex-col gap-1">
                    {dayEvents.map((event) => {
                      // เช็ค Logic เพื่อทำมุมโค้ง (ต่อเนื่อง)
                      const isStart = isSameDay(day, event.date);
                      const isEnd = isSameDay(day, event.endDate || event.date);
                      const isSingleDay = isStart && isEnd;

                      return (
                        <div
                          key={`${event.id}-${day.toString()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={cn(
                            "h-6 px-2 text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-80 transition shadow-sm truncate",
                            // เลือกสีพื้นหลัง
                            eventBgStyles[
                              event.type as keyof typeof eventBgStyles
                            ] || "bg-gray-200",
                            // ✅ Logic: ถ้าเป็นวันแรกให้โค้งซ้าย, วันสุดท้ายโค้งขวา, วันตรงกลางไม่ต้องโค้ง
                            isSingleDay
                              ? "mx-2 rounded-md"
                              : isStart
                                ? "rounded-l-md ml-1"
                                : "rounded-l-none -ml-[1px]",
                            isEnd
                              ? "rounded-r-md mr-1"
                              : "rounded-r-none -mr-[1px]",
                            // ซ่อนชื่อถ้าไม่ใช่วันแรก (เพื่อให้ดูเหมือนแถบเดียว) ยกเว้นวันจันทร์ให้โชว์
                            "mx-0 rounded-none",
                            !isStart &&
                              format(day, "eee") !== "Sun" &&
                              "text-transparent",
                          )}
                        >
                          {isStart && (
                            <img
                              src={
                                eventImages[
                                  event.type as keyof typeof eventImages
                                ]
                              }
                              alt="icon"
                              className="w-4 h-4 object-contain" // กำหนดขนาดไอคอนในแถบ
                            />
                          )}
                          <span className="truncate">
                            {isStart || format(day, "eee") === "Sun"
                              ? event.title
                              : ""}
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
      <div className="w-full lg:w-[380px] flex flex-col gap-6 pt-0 lg:pt-16">
        
        {/* Tab Controls (ปุ่มเลือก Tab ด้านบน) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold transition",
              activeTab === "list"
                ? "bg-pink-400 text-white shadow-md"
                : "text-gray-500 hover:text-gray-800"
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
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            Detail
          </button>
        </div>

        {/* ส่วนแสดงผลข้อมูล (กล่องขาวใหญ่) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
          
          {activeTab === "list" ? (
            // ==================== TAB: LIST ====================
            events.length === 0 ? (
              // 1.1 ถ้าไม่มีนัดหมายเลย (List ว่าง) -> โชว์ไอคอนกล่อง
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-60">
                <Inbox size={48} strokeWidth={1.5} />
                <p className="text-lg font-bold">ตอนนี้ไม่มีนัดหมาย</p>
              </div>
            ) : (
              // 1.2 ถ้ามีนัดหมาย -> โชว์รายการตามปกติ
              <div className="flex flex-col gap-4">
                {events.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="bg-white rounded-[1.5rem] p-4 flex items-center gap-4 hover:shadow-md transition cursor-pointer border border-slate-100 group"
                  >
                    <div className="shrink-0">
                      <img
                        src={eventImages[event.type as keyof typeof eventImages]}
                        alt="icon"
                        className="w-12 h-12 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(event.date, "MMM d")} • {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // ==================== TAB: DETAIL ====================
            !selectedEvent ? (
              // 2.1 ถ้ายังไม่ได้เลือก Event หรือโดนลบไปแล้ว -> ป้องกันจอขาว!
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-60">
                <CalendarIcon size={48} strokeWidth={1.5} />
                <p className="text-lg font-bold">เลือกรายการเพื่อดูรายละเอียด</p>
              </div>
            ) : (
              // 2.2 ถ้ามีข้อมูล -> โชว์รายละเอียด
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* 1. ชื่อหัวข้อ */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">ชื่อหัวข้อ</label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-bold text-slate-800 border border-gray-100 shadow-sm">
                    {selectedEvent.title}
                  </div>
                </div>

                {/* 2. รายละเอียด */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">รายละเอียด</label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-600 border border-gray-100 min-h-[80px]">
                    {selectedEvent.description || "-"}
                  </div>
                </div>

                {/* 3. วันที่ */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">ช่วงวันที่</label>
                  <div className="bg-gray-50 rounded-2xl p-3 text-xs font-bold text-slate-700 border border-gray-100 flex items-center gap-2">
                    <CalendarIcon size={14} className="text-pink-400" />
                    {format(selectedEvent.date, "dd MMM yyyy")}
                    {selectedEvent.endDate && ` - ${format(selectedEvent.endDate, "dd MMM yyyy")}`}
                  </div>
                </div>

                {/* 4. เวลา */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">ช่วงเวลา</label>
                  <div className="bg-gray-50 rounded-2xl p-3 text-xs font-bold text-slate-700 border border-gray-100 flex items-center gap-2">
                    <Clock size={14} className="text-pink-400" />
                    {selectedEvent.time}
                  </div>
                </div>

                {/* 5. ประเภท */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">ประเภท</label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-700 border border-gray-100 capitalize">
                    {selectedEvent.type}
                  </div>
                </div>

                {/* 6. สถานที่ (อัปเกรดใหม่ 🚀) */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">สถานที่ / Link</label>
                  
                  {/* เช็คว่าเป็น Link หรือไม่? */}
                  {selectedEvent.location?.startsWith("http") ? (
                    // 🅰️ กรณีเป็น Link: กดแล้วเปิด Tab ใหม่
                    <div className="bg-white rounded-2xl p-3 text-sm border border-gray-200 flex justify-between items-center group hover:border-blue-300 transition">
                      <a 
                        href={selectedEvent.location} 
                        target="_blank" 
                        rel="noreferrer"
                        className="truncate flex-1 font-medium text-blue-500 hover:underline flex items-center gap-1"
                      >
                         <ExternalLink size={12} /> {/* ไอคอนลูกศรชี้ออก */}
                         {selectedEvent.location}
                      </a>
                      
                      {/* ปุ่ม Copy แยกต่างหากทางขวา */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // กันไม่ให้ไปกดโดน Link
                          handleCopy(selectedEvent.location || "");
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-blue-500"
                        title="Copy Link"
                      >
                        {isCopied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                      </button>
                    </div>
                  ) : (
                    // 🅱️ กรณีข้อความธรรมดา: กดที่กล่องเพื่อ Copy ได้เลย
                    <div 
                      onClick={() => handleCopy(selectedEvent.location || "Online")}
                      className="bg-white rounded-2xl p-3 text-sm text-gray-700 border border-gray-200 flex justify-between items-center cursor-pointer group hover:border-blue-300 transition hover:bg-gray-50 active:scale-[0.99]"
                    >
                      <span className="truncate flex-1 font-medium">
                        {selectedEvent.location || "Online"}
                      </span>
                      <div className="text-gray-300 group-hover:text-blue-400 transition">
                         {isCopied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
