import React, { useState, useEffect, useRef } from "react";
import API_URL from "../config";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
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
  ChevronLeft,
  MapPin,
  Check,
  Copy,
  // ✅ เพิ่ม Import ไอคอนสำหรับเมนูโปรไฟล์
  LogOut,
  HelpCircle,
  Moon,
  User as UserIcon,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { Appointment } from "../features/calendar/types";

// Import Components
import { AddEventModal } from "../features/calendar/components/AddEventModal";
import { CalendarView } from "../features/calendar/components/CalendarView";
import { ManageEventsView } from "../features/calendar/components/ManageEventsView";

// Import Assets
import zoomIcon from "../assets/zoom.png";
import healthIcon from "../assets/health.png";
import teleIcon from "../assets/tele.png";
import defaultProfileIcon from "../assets/default-icon.png";

const eventImages: Record<string, string> = {
  zoom: zoomIcon,
  health: healthIcon,
  "tele-medicine": teleIcon,
};

interface CalendarPageProps {
  onLogout?: () => void;
}

export default function CalendarPage({ onLogout }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");
  const [events, setEvents] = useState<Appointment[]>([]);
  const [eventToEdit, setEventToEdit] = useState<Appointment | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "manage">("calendar");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // ✅ State เมนูโปรไฟล์
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [participantList, setParticipantList] = React.useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const notifiedEvents = useRef(new Set<string>());
  const [userInfo, setUserInfo] = useState<{
    username: string;
    email: string;
  } | null>(null);
  React.useEffect(() => {
    if (selectedEvent) {
      setParticipantList((selectedEvent as any).participants || []);
    }
  }, [selectedEvent]);

  const handleAddParticipant = async () => {
    if (!inviteEmail.trim() || !selectedEvent) return;

    // 1. 🛡️ เช็คว่าเป็นรูปแบบอีเมลที่ถูกต้องหรือไม่ (รองรับทุกค่าย)
    // สูตรนี้จะเช็คว่าต้องมีตัวอักษร + @ + ตัวอักษร + . + ตัวอักษร
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(inviteEmail)) {
      alert(
        "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง (เช่น name@example.com)",
      );
      return;
    }

    // เตรียมรายชื่อใหม่
    const currentList = (selectedEvent as any).participants || [];

    // เช็คอีเมลซ้ำ
    if (currentList.includes(inviteEmail)) {
      alert("อีเมลนี้มีอยู่ในรายการแล้วครับ");
      return;
    }

    const newList = [...currentList, inviteEmail];

    try {
      const token = localStorage.getItem("user_token");
      // ⚠️ อย่าลืมเช็ค API_URL ให้ตรงกับที่ประกาศไว้ในไฟล์นี้นะครับ
      const res = await fetch(`${API_URL}/appointments/${selectedEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...selectedEvent, participants: newList }),
      });

      if (res.ok) {
        setInviteEmail(""); // ล้างช่องพิมพ์

        // ✅ 1. อัปเดตลิสต์ที่โชว์อยู่ทันที
        setParticipantList(newList);

        // ✅ 2. อัปเดต "ข้อมูลหลัก (Events)" เพื่อให้ปิดแล้วเปิดใหม่ข้อมูลยังอยู่
        setEvents((prevEvents) =>
          prevEvents.map(
            (ev) =>
              ev.id === selectedEvent.id
                ? { ...ev, participants: newList } // เจอตัวที่แก้ -> อัปเดตลิสต์
                : ev, // ตัวอื่น -> ปล่อยไว้เหมือนเดิม
          ),
        );

        // ✅ 3. อัปเดตตัวแปร selectedEvent ปัจจุบันด้วย
        setSelectedEvent((prev) =>
          prev ? { ...prev, participants: newList } : null,
        );

        alert("เพิ่มผู้เข้าร่วมเรียบร้อยแล้ว!");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleRemoveParticipant = async (emailToRemove: string) => {
    if (!selectedEvent) return;

    // 🛡️ ถามยืนยันก่อนลบ
    if (!window.confirm(`ยืนยันการลบ "${emailToRemove}"?`)) {
      return; // ถ้าไม่ยืนยัน ก็ออกไปเลย
    }

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

        // อัปเดตข้อมูลหลัก (เพื่อให้กดย้อนกลับแล้วเข้ามาใหม่ ข้อมูลยังอยู่)
        setEvents((prevEvents) =>
          prevEvents.map((ev) =>
            ev.id === selectedEvent.id ? { ...ev, participants: newList } : ev,
          ),
        );

        setSelectedEvent((prev) =>
          prev ? { ...prev, participants: newList } : null,
        );
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<
    "calendar" | "upcoming" | "manage"
  >("calendar");

  const [upcomingView, setUpcomingView] = useState<"list" | "detail">("list");

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
    setUpcomingView("detail");
    if (mobileTab === "calendar") {
      setMobileTab("upcoming");
    }
  };

  const handleEditClick = (event: Appointment) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const fetchEvents = async () => {
    try {
      // 1. ดึง Token จากกระเป๋า (LocalStorage)
      const token = localStorage.getItem("user_token");

      // ถ้าไม่มี Token (เช่น หลุด Login) ไม่ต้องดึงข้อมูล
      if (!token) return;

      // 2. ยิงไปที่ API_URL (localhost หรือ IP ที่ตั้งไว้) พร้อมแนบ Token
      const response = await fetch(`${API_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`, // 🔑 ยื่นบัตรผ่านตรงนี้
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // ถ้า Token หมดอายุ -> เด้งไปหน้า Login (ถ้าทำ onLogout ไว้ก็เรียกใช้ได้)
          console.error("Token expired or invalid");
          if (onLogout) onLogout();
        }
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      // ... (โค้ดแปลงข้อมูล Date เหมือนเดิม) ...
      const formattedEvents = data.map((evt: any) => {
        const startObj = new Date(evt.date);
        const endObj = new Date(evt.endDate || evt.date);

        if (evt.time && evt.time.includes(" - ")) {
          const [startTimeStr, endTimeStr] = evt.time.split(" - ");
          const [startHour, startMin] = startTimeStr.split(":").map(Number);
          const [endHour, endMin] = endTimeStr.split(":").map(Number);
          startObj.setHours(startHour, startMin, 0, 0);
          endObj.setHours(endHour, endMin, 0, 0);
        }

        return {
          ...evt,
          id: evt._id,
          date: startObj,
          endDate: endObj,
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user info:", error);
      }
    }
  }, []);

  // ✅ 1. ขออนุญาตแจ้งเตือนทันทีเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    // เช็คว่า Browser รองรับไหม และยังไม่ได้ขออนุญาตใช่ไหม
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // ✅ 2. ระบบเช็คเวลา + แจ้งเตือน (แบบกัน spam)
  useEffect(() => {
    if (events.length === 0) return;

    const checkUpcomingEvents = () => {
      const now = new Date();

      events.forEach((event) => {
        const timeDiff = event.date.getTime() - now.getTime();
        const minutesLeft = Math.ceil(timeDiff / 1000 / 60);
        const triggerTime =
          event.notificationTime !== undefined ? event.notificationTime : 30;

        if (triggerTime === 0) return;

        // 🎯 ตั้งเวลาเตือน (เช่น 30 นาที)
        if (minutesLeft <= triggerTime && minutesLeft >= 0) {
          // ✅ สร้าง Key แบบพิเศษ: "ID + เวลาเริ่ม"
          // เช่น: "65a123...-1701234567890"
          const notificationKey = `${event.id}-${event.date.getTime()}-${triggerTime}`;

          // 🛑 เช็คด้วย Key ใหม่
          if (notifiedEvents.current.has(notificationKey)) {
            return;
          }

          // ✅ ถ้าผ่านด่านมาได้ -> แจ้งเตือน
          const title = "🔔 ใกล้ถึงเวลานัดแล้ว!";
          const body = `นัดหมาย "${event.title}" จะเริ่มในอีก ${minutesLeft} นาที (${format(event.date, "HH:mm")})`;

          if (Notification.permission === "granted") {
            try {
              new Notification(title, { body, icon: defaultProfileIcon });
            } catch (e) {
              console.log("Native notification failed");
            }
          }

          setToastMessage({ title, body });
          setTimeout(() => setToastMessage(null), 10000);

          // 📝 จดบันทึกด้วย Key ใหม่
          notifiedEvents.current.add(notificationKey);
        }
      });
    };

    checkUpcomingEvents();
    const intervalId = setInterval(checkUpcomingEvents, 10000);
    return () => clearInterval(intervalId);
  }, [events]);

  useEffect(() => {
    if (selectedEvent) {
      // ลองหาดูว่า event ที่เปิดอยู่ ยังอยู่ใน list หลักไหม?
      const currentEventData = events.find((e) => e.id === selectedEvent.id);

      if (!currentEventData) {
        // ❌ ถ้าหาไม่เจอ (แปลว่าโดนลบไปแล้ว) -> ให้เคลียร์ทิ้ง
        setSelectedEvent(null);
        setUpcomingView("list"); // (สำหรับมือถือ) ดีดกลับไปหน้ารายการ
      } else {
        // ✅ ถ้ายังอยู่ (แปลว่าอาจจะถูกแก้ไข) -> ให้อัปเดตข้อมูลล่าสุดลงไป (เช่น เปลี่ยนชื่อ, เปลี่ยนเวลา)
        // บรรทัดนี้จะช่วยแก้บัคเวลาแก้ไขแล้วหน้า Detail ไม่เปลี่ยนตามด้วยครับ
        if (JSON.stringify(selectedEvent) !== JSON.stringify(currentEventData)) {
            setSelectedEvent(currentEventData);
        }
      }
    }
  }, [events]); // ทำงานทุกครั้งที่ตัวแปร events เปลี่ยนค่า (เช่น หลัง fetchEvents)

  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 font-sans text-slate-800 pb-24 md:pb-0">
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
        }}
        onSuccess={fetchEvents}
        eventToEdit={eventToEdit}
      />

      {/* ================= NAVBAR DESKTOP ================= */}
      <nav className="hidden lg:flex bg-[#0033A0] text-white px-6 py-4 justify-between items-center shadow-md sticky top-0 z-40 relative">
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

        {/* ✅ USER PROFILE SECTION (แก้ไขตรงนี้) */}
        <div className="flex items-center gap-4 z-10">
          <Grid className="w-6 h-6 cursor-pointer hover:opacity-80 text-white" />

          {/* 👤 START: PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer overflow-hidden hover:scale-105 transition shadow-sm focus:outline-none"
            >
              {/* ✅ ใช้รูป defaultProfileIcon แทน Icon User */}
              <img
                src={defaultProfileIcon}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute top-full right-0 mt-3 w-[300px] bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  {/* Header: User Info */}
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={defaultProfileIcon}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-800 font-bold text-sm truncate max-w-[180px]">
                        {userInfo?.username || "Guest User"}
                      </span>

                      {/* ✅ แก้อีเมล: ใช้ userInfo.email */}
                      <span className="text-slate-500 text-xs truncate max-w-[180px]">
                        {userInfo?.email || "No email provided"}
                      </span>
                      <a
                        href="#"
                        className="text-blue-600 text-xs mt-0.5 hover:underline"
                      >
                        จัดการบัญชีของคุณ
                      </a>
                    </div>
                  </div>

                  {/* Menu List */}
                  <div className="py-2 flex flex-col">
                    {/*<button className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-slate-700 text-sm transition text-left">
                      <UserIcon size={18} className="text-gray-400" />
                      ช่องของคุณ
                    </button>
                    <button className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-slate-700 text-sm transition text-left">
                      <Settings size={18} className="text-gray-400" />
                      การตั้งค่า
                    </button>
                    <button className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-slate-700 text-sm transition text-left">
                      <Moon size={18} className="text-gray-400" />
                      ลักษณะหน้าตา: ธีมอุปกรณ์
                    </button>
                    <button className="px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-slate-700 text-sm transition text-left">
                      <HelpCircle size={18} className="text-gray-400" />
                      ความช่วยเหลือ
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>*}

                    {/* 🚪 LOGOUT BUTTON */}
                    <button
                      onClick={() => {
                        if (onLogout) onLogout();
                      }}
                      className="px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-red-600 text-sm transition text-left w-full"
                    >
                      <LogOut size={18} />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* 👤 END: PROFILE DROPDOWN */}
        </div>
      </nav>

      {/* ================= REST OF THE CONTENT (คงเดิม) ================= */}

      {/* ✅ MOBILE HEADER (ฉบับรวมร่าง: Logic เดิม + ปุ่ม Profile) */}
      {mobileTab !== "calendar" && (
        <div className="lg:hidden flex flex-col items-start justify-center p-4 bg-white sticky top-0 z-30 shadow-sm transition-all duration-300 gap-2">
          {/* 1. แถวบน: แบ่งซ้าย (ชื่อ) - ขวา (รูปโปรไฟล์) */}
          <div className="flex items-center justify-between w-full">
            {/* 🟢 กลุ่มซ้าย: ปุ่ม Back + ชื่อหน้า */}
            <div className="flex items-center gap-2">
              {mobileTab === "upcoming" && upcomingView === "detail" && (
                <button
                  onClick={() => setUpcomingView("list")}
                  className="p-1 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <h1 className="text-xl font-bold text-slate-800">
                {mobileTab === "upcoming"
                  ? upcomingView === "list"
                    ? "Upcoming Events"
                    : "Detail"
                  : "Manage Events"}
              </h1>
            </div>

            {/* 🔵 กลุ่มขวา: ปุ่มโปรไฟล์ (เพิ่มใหม่! เฉพาะหน้า Manage) */}
            {mobileTab === "manage" && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-full cursor-pointer overflow-hidden active:scale-95 transition"
                >
                  <img
                    src={defaultProfileIcon}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Dropdown Menu สำหรับ Mobile */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-[220px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {userInfo?.username || "Guest"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {userInfo?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (onLogout) onLogout();
                        }}
                        className="w-full px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm transition text-left"
                      >
                        <LogOut size={16} />
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. แถวล่าง: Tags (Logic เดิมของคุณ คงไว้เหมือนเดิม) */}
          {mobileTab === "upcoming" && upcomingView === "list" && (
            <div className="flex flex-wrap gap-3 mt-1 animate-in fade-in slide-in-from-top-1">
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
                <span className="text-xs text-slate-500 font-medium">
                  Health
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DESKTOP VIEW */}
      <div className="lg:block hidden">
        {viewMode === "calendar" ? (
          <CalendarView
            currentDate={currentDate}
            monthStart={monthStart}
            calendarDays={calendarDays}
            events={events}
            nextMonth={nextMonth}
            prevMonth={prevMonth}
            handleEventClick={handleEventClick}
            setIsModalOpen={setIsModalOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedEvent={selectedEvent || events[0]}
          />
        ) : (
          <ManageEventsView
            events={events}
            onRefresh={fetchEvents}
            onEdit={handleEditClick}
          />
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="block lg:hidden">
        {mobileTab === "calendar" && (
          <CalendarView
            currentDate={currentDate}
            monthStart={monthStart}
            calendarDays={calendarDays}
            events={events}
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

        {/* ✅ MOBILE UPCOMING EVENTS LIST */}
        {mobileTab === "upcoming" && (
          <div className="p-4 min-h-[50vh]">
            {upcomingView === "list" &&
              (events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-300 gap-4 opacity-60">
                  <List size={48} />
                  <p className="text-xl font-bold">ไม่มีนัดหมายเร็วๆ นี้</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* 🌟 จุดแก้ไขสำคัญ: เพิ่ม .filter() และลบ logic สีเทาออก */}
                  {[...events]
                    // 1. กรองนัดเก่าทิ้งไปเลย (ไม่เอามาโชว์)
                    .filter((event) => {
                      const now = new Date();
                      return (event.endDate || event.date) >= now;
                    })
                    // 2. เรียงจากเวลา ใกล้ -> ไกล
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((event) => {
                      // (ไม่ต้องคำนวณ isPast แล้ว เพราะเรากรองทิ้งไปหมดแล้ว)

                      return (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={cn(
                            // ลบเงื่อนไขสีเทาออก เหลือแค่สไตล์ปกติ (Active)
                            "rounded-[1.5rem] p-4 flex items-center gap-4 transition cursor-pointer border bg-white border-blue-50/50 shadow-sm active:scale-[0.98]",
                          )}
                        >
                          <div className="shrink-0 relative">
                            <img
                              src={eventImages[event.type] || healthIcon}
                              alt={event.type}
                              className="w-12 h-12 object-contain drop-shadow-sm"
                            />
                            {/* ลบไอคอนติ๊กถูก (Past Check) ออก เพราะไม่ใช้แล้ว */}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate text-slate-800">
                              {event.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              {format(event.date, "dd MMM yyyy")} • {event.time}
                              {/* ลบป้าย Past ออก */}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}

            {/* ... (ส่วน Detail ด้านล่าง คงไว้เหมือนเดิม ไม่ต้องแก้) ... */}
            {upcomingView === "detail" && selectedEvent && (
              // ... code detail เดิมของคุณ ...
              // (ถ้าขี้เกียจก๊อปปี้ซ้ำ ก็ปล่อยส่วนนี้ไว้เหมือนเดิมได้เลยครับ)
              <div className="flex flex-col gap-5 animate-in slide-in-from-right-8 duration-300">
                {/* ... เนื้อหา Detail ... */}
                {/* ... เพื่อความสั้น ผมขอละส่วนนี้ไว้ คุณใช้ของเดิมได้เลยครับ ... */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    ชื่อหัวข้อ
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-bold text-slate-800">
                    {selectedEvent.title}
                  </div>
                </div>
                {/* ... (Copy ส่วนที่เหลือของ Detail มาใส่ตรงนี้ให้ครบนะครับ) ... */}
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    รายละเอียด
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-4 text-sm font-medium text-gray-600 min-h-[80px]">
                    {selectedEvent.description || "-"}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                      ช่วงวันที่
                    </label>
                    <div className="bg-gray-50 rounded-2xl p-3 text-xs font-bold text-slate-700 flex items-center gap-2">
                      <CalendarIcon size={14} className="text-pink-400" />
                      {format(selectedEvent.date, "dd MMM yyyy")}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                      ช่วงเวลา
                    </label>
                    <div className="bg-gray-50 rounded-2xl p-3 text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Clock size={14} className="text-pink-400" />
                      {selectedEvent.time}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                    ประเภท
                  </label>
                  <div className="bg-gray-50 rounded-2xl p-3 text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
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
                  <div
                    onClick={() => handleCopy(selectedEvent.location || "")}
                    className="bg-white rounded-2xl p-3 text-sm text-blue-500 border border-gray-200 flex justify-between items-center cursor-pointer active:scale-95 transition"
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="truncate underline">
                        {selectedEvent.location || "-"}
                      </span>
                    </div>
                    <div className="text-gray-300">
                      {isCopied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                      แจ้งเตือนล่วงหน้า
                    </label>
                    <div className="bg-gray-50 rounded-2xl p-3 text-sm font-medium text-slate-700 border border-gray-100 flex items-center gap-2">
                      <span className="text-lg">🔔</span>
                      {selectedEvent.notificationTime &&
                      selectedEvent.notificationTime > 0
                        ? `${selectedEvent.notificationTime} นาที`
                        : "ไม่ได้ตั้งเตือน"}
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 pb-8">
                    {" "}
                    {/* pb-8 เผื่อที่ด้านล่าง */}
                    <label className="text-xs font-bold text-gray-400 mb-1.5 block ml-1">
                      เชิญผู้เข้าร่วม (Email)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="ระบุอีเมล..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleAddParticipant}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition"
                      >
                        เพิ่ม
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {participantList.map((email, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 text-gray-600 text-xs pl-2 pr-1 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <span className="truncate max-w-[150px]">
                            👤 {email}
                          </span>

                          {/* ✅ ปุ่มลบ */}
                          <button
                            onClick={() => handleRemoveParticipant(email)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 active:bg-red-100 active:text-red-500 transition"
                          >
                            <X size={14} />
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
              </div>
            )}
          </div>
        )}

        {mobileTab === "manage" && (
          <div className="pb-32 px-4 pt-4 w-full max-w-[100vw] overflow-x-hidden">
            <ManageEventsView
              events={events}
              isMobile={true}
              onRefresh={fetchEvents}
              onEdit={handleEditClick}
            />
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-white/90 backdrop-blur-md border border-gray-200/50 flex justify-between items-center px-6 py-2 z-50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <button
          onClick={() => {
            setMobileTab("calendar");
            setUpcomingView("list");
          }}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
            mobileTab === "calendar"
              ? "bg-blue-50 text-[#0033A0] shadow-sm translate-y-[-4px]"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          <CalendarIcon
            size={20}
            strokeWidth={mobileTab === "calendar" ? 2.5 : 2}
            className="mb-0.5"
          />
          <span className="text-[9px] font-bold">Calendar</span>
        </button>

        <button
          onClick={() => {
            setMobileTab("upcoming");
            setUpcomingView("list");
          }}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
            mobileTab === "upcoming"
              ? "bg-blue-50 text-[#0033A0] shadow-sm translate-y-[-4px]"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          <Clock
            size={20}
            strokeWidth={mobileTab === "upcoming" ? 2.5 : 2}
            className="mb-0.5"
          />
          <span className="text-[9px] font-bold">Upcoming</span>
        </button>

        <button
          onClick={() => {
            setMobileTab("manage");
            setUpcomingView("list");
          }}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
            mobileTab === "manage"
              ? "bg-blue-50 text-[#0033A0] shadow-sm translate-y-[-4px]"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          <Settings
            size={20}
            strokeWidth={mobileTab === "manage" ? 2.5 : 2}
            className="mb-0.5"
          />
          <span className="text-[9px] font-bold">Manage</span>
        </button>
      </div>
      {/* ✅ กล่องแจ้งเตือนในแอป (In-App Toast) */}
      {/* จะแสดงก็ต่อเมื่อมีข้อความใน toastMessage */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-white/90 backdrop-blur-md border border-blue-100 shadow-2xl rounded-2xl p-4 flex gap-4 items-start">
            {/* Icon กระดิ่ง */}
            <div className="bg-yellow-100 p-2 rounded-full shrink-0">
              <span className="text-2xl">🔔</span>
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm mb-1">
                {toastMessage.title}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {toastMessage.body}
              </p>
            </div>

            {/* ปุ่มปิด */}
            <button
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
