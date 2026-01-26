import React, { useState } from "react";
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
import { initialEvents } from "../features/calendar/data";

// Import Components
import { AddEventModal } from "../features/calendar/components/AddEventModal";
import { CalendarView } from "../features/calendar/components/CalendarView";
import { ManageEventsView } from "../features/calendar/components/ManageEventsView";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1));
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  const [selectedEvent, setSelectedEvent] = useState<Appointment>(
    initialEvents[0],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "manage">("calendar");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mobile Tab State ('calendar', 'upcoming', 'manage')
  const [mobileTab, setMobileTab] = useState<
    "calendar" | "upcoming" | "manage"
  >("calendar");

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-20 md:pb-0">
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* === DESKTOP NAVBAR (ซ่อนบนมือถือ hidden md:flex) === */}
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

      {/* === MOBILE HEADER (โชว์เฉพาะมือถือ md:hidden) === */}
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
            events={initialEvents}
            nextMonth={nextMonth}
            prevMonth={prevMonth}
            handleEventClick={handleEventClick}
            setIsModalOpen={setIsModalOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedEvent={selectedEvent}
          />
        ) : (
          <ManageEventsView events={initialEvents} />
        )}
      </div>

      <div className="block md:hidden">
        {/* Mobile Logic */}
        {mobileTab === "calendar" && (
          <CalendarView
            currentDate={currentDate}
            monthStart={monthStart}
            calendarDays={calendarDays}
            events={initialEvents}
            nextMonth={nextMonth}
            prevMonth={prevMonth}
            handleEventClick={handleEventClick}
            setIsModalOpen={setIsModalOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedEvent={selectedEvent}
            isMobile={true} // ส่ง prop พิเศษไปบอกว่านี่คือมือถือ
          />
        )}
        {mobileTab === "upcoming" && (
          <div className="p-4">
            {/* Reuse Sidebar Logic for Mobile Upcoming Page */}
            {/* (Render Event Cards Here like Image 6) */}
            <div className="flex flex-col gap-4">
              {initialEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="bg-white rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm border border-slate-100"
                >
                  {/* ... Icon & Text ... */}
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
          </div>
        )}
        {mobileTab === "manage" && (
          <ManageEventsView events={initialEvents} isMobile={true} />
        )}
      </div>

      {/* === MOBILE BOTTOM BAR (ตามภาพ 5) === */}
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
