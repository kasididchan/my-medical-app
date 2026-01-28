import React, { useState, useEffect } from "react"; // ✅ เพิ่ม useEffect
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Grid,
  User,
  ChevronDown,
  Calendar as CalendarIcon,
  List,
  Clock,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Appointment } from "../features/calendar/types";
// ❌ ไม่ใช้ initialEvents แล้ว (ลบออกหรือ comment ไว้ก็ได้)
// import { initialEvents } from "../features/calendar/data";

// Import Components
import { AddEventModal } from "../features/calendar/components/AddEventModal";
import { CalendarView } from "../features/calendar/components/CalendarView";
import { ManageEventsView } from "../features/calendar/components/ManageEventsView";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // เริ่มที่วันปัจจุบัน
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");

  // ✅ 1. สร้าง State เพื่อเก็บข้อมูลจาก Database (เริ่มต้นเป็นอาเรย์ว่าง [])
  const [events, setEvents] = useState<Appointment[]>([]);
  const [eventToEdit, setEventToEdit] = useState<Appointment | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "manage">("calendar");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<
    "calendar" | "upcoming" | "manage"
  >("calendar");

  // Date Calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleEventClick = (event: Appointment) => {
    setSelectedEvent(event);
    setActiveTab("detail");
  };
  const handleEditClick = (event: Appointment) => {
    setEventToEdit(event); // จำไว้ว่าจะแก้อันนี้
    setIsModalOpen(true); // เปิด Modal ขึ้นมา
  };

  // ✅ 2. สร้างฟังก์ชันดึงข้อมูลจาก Backend
  const fetchEvents = async () => {
    try {
      // ยิงไปที่ Server ที่เรารันไว้ (Port 5000)
      const response = await fetch("http://localhost:5000/appointments");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      // แปลงข้อมูลวันที่จาก String (ที่มาจาก DB) ให้เป็น Date Object
      const formattedEvents = data.map((evt: any) => ({
        ...evt,
        id: evt._id, // MongoDB ใช้ _id เราอาจจะต้องแมพกลับเป็น id หรือแก้ Type ให้รองรับ
        date: new Date(evt.date),
        endDate: new Date(evt.endDate),
      }));

      setEvents(formattedEvents); // อัปเดตข้อมูลเข้า State
      console.log("✅ Data fetched:", formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // ✅ 3. สั่งให้ดึงข้อมูลทันทีที่เปิดหน้านี้ (Component Mount)
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-20 md:pb-0">
      {/* ✅ 4. ส่ง fetchEvents ไปให้ Modal ผ่าน onSuccess */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null); // ✅ สำคัญ! ปิดแล้วต้องเคลียร์ค่า ไม่งั้นเปิดมาจะเจอข้อมูลเดิมค้าง
        }}
        onSuccess={() => {
          fetchEvents();
          // ถ้าต้องการปิด Modal อัตโนมัติหลังบันทึก ให้ทำใน AddEventModal แล้ว
        }}
        eventToEdit={eventToEdit} // ✅ ต้องส่ง prop นี้ไปด้วย!
      />

      {/* ... (NAVBAR ส่วนเดิม ไม่ต้องแก้) ... */}
      <nav className="hidden md:flex bg-[#0033A0] text-white px-6 py-4 justify-between items-center shadow-md sticky top-0 z-40 relative">
        <div className="flex items-center gap-3 z-10">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-400 via-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
            PHC
          </div>
          <h1 className="font-bold text-lg tracking-wide hidden sm:block">
            Pattaya Health Center
          </h1>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-white/90">
            <a href="#" className="hover:text-white opacity-90 transition">
              รายชื่อ
            </a>
            <a href="#" className="hover:text-white opacity-90 transition">
              วิเคราะห์ข้อมูลสุขภาพ
            </a>
            <a href="#" className="hover:text-white opacity-90 transition">
              รายงาน
            </a>
            <a href="#" className="hover:text-white opacity-90 transition">
              เจ้าหน้าที่
            </a>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white text-[#0033A0] px-6 py-1.5 rounded-full shadow-sm font-bold flex items-center gap-2 transition hover:bg-gray-100 text-sm"
            >
              {viewMode === "calendar" ? "ปฏิทิน" : "จัดการกิจกรรม"}
              <ChevronDown
                size={14}
                className={cn(
                  "text-[#0033A0] transition-transform",
                  isDropdownOpen && "rotate-180",
                )}
              />
            </button>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden py-0 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => {
                      setViewMode("calendar");
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 transition",
                      viewMode === "calendar"
                        ? "bg-[#0033A0] text-white"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <CalendarIcon size={16} /> Calendar
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("manage");
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-2 transition",
                      viewMode === "manage"
                        ? "bg-[#0033A0] text-white"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <List size={16} /> Manage Events
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 z-10">
          <Grid className="w-6 h-6 cursor-pointer hover:opacity-80 text-white" />
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white cursor-pointer overflow-hidden">
            <User size={20} />
          </div>
        </div>
      </nav>

      {/* ... (MOBILE HEADER ส่วนเดิม) ... */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-bold">
          {mobileTab === "calendar"
            ? "September"
            : mobileTab === "upcoming"
              ? "Upcoming Events"
              : "Manage Events"}
        </h1>
        {mobileTab === "calendar" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0033A0] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
          >
            <Plus size={14} /> Add Event
          </button>
        )}
      </div>

      {/* === CONTENT AREA === */}
      <div className="md:block hidden">
        {/* Desktop Logic */}
        {viewMode === "calendar" ? (
          <CalendarView
            currentDate={currentDate}
            monthStart={monthStart}
            calendarDays={calendarDays}
            events={events} // ✅ 5. เปลี่ยนจาก initialEvents เป็น events (ข้อมูลจริง)
            nextMonth={nextMonth}
            prevMonth={prevMonth}
            handleEventClick={handleEventClick}
            setIsModalOpen={setIsModalOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedEvent={selectedEvent || events[0]} // กัน error ถ้ายังไม่มี event
          />
        ) : (
          <ManageEventsView
            events={events}
            onRefresh={fetchEvents} // ✅ ส่งฟังก์ชันรีเฟรชไป
            onEdit={handleEditClick} // ✅ ส่งฟังก์ชันเปิด Modal ไป
          /> // ✅ ส่ง events จริงไปหน้าจัดการด้วย
        )}
      </div>

      <div className="block md:hidden">
        {/* Mobile Logic */}
        {mobileTab === "calendar" && (
          <CalendarView
            currentDate={currentDate}
            monthStart={monthStart}
            calendarDays={calendarDays}
            events={events} // ✅ ใช้ข้อมูลจริง
            nextMonth={nextMonth}
            prevMonth={prevMonth}
            handleEventClick={handleEventClick}
            setIsModalOpen={setIsModalOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedEvent={selectedEvent || events[0]}
            isMobile={true}
          />
        )}
        {mobileTab === "upcoming" && (
          <div className="p-4 min-h-[50vh]">            
            {/* ✅ เช็คว่ามีข้อมูลไหม? */}
            {events.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-[60vh] text-gray-300 gap-4 opacity-60">
                  <div className="bg-gray-50 p-6 rounded-full">
                    <List size={48} strokeWidth={1.5} />
                  </div>
                  <p className="text-xl font-bold">ไม่มีนัดหมายเร็วๆ นี้</p>
               </div>
            ) : (
               // ✨ ถ้ามีข้อมูล ก็วนลูปโชว์ (โค้ดเดิม)
               <div className="flex flex-col gap-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="bg-white rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm border border-slate-100"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500 text-white shrink-0">
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {mobileTab === "manage" && (
          <ManageEventsView
            events={events}
            isMobile={true}
            onRefresh={fetchEvents}
            onEdit={handleEditClick}
          />
        )}
      </div>

      {/* ... (MOBILE BOTTOM BAR ส่วนเดิม) ... */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 pb-4 z-50 rounded-t-[2rem] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setMobileTab("calendar")}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition w-20",
            mobileTab === "calendar" ? "text-[#0033A0]" : "text-gray-400",
          )}
        >
          <CalendarIcon
            size={24}
            strokeWidth={mobileTab === "calendar" ? 2.5 : 2}
          />
          <span className="text-[10px] font-bold">Calendar</span>
        </button>
        <button
          onClick={() => setMobileTab("upcoming")}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition w-20",
            mobileTab === "upcoming" ? "text-[#0033A0]" : "text-gray-400",
          )}
        >
          <Clock size={24} strokeWidth={mobileTab === "upcoming" ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Upcoming</span>
        </button>
        <button
          onClick={() => setMobileTab("manage")}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition w-20",
            mobileTab === "manage" ? "text-[#0033A0]" : "text-gray-400",
          )}
        >
          <Settings size={24} strokeWidth={mobileTab === "manage" ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Manage</span>
        </button>
      </div>
    </div>
  );
}
