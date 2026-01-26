import React from 'react';
import { X, ChevronDown } from 'lucide-react';

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddEventModal = ({ isOpen, onClose }: AddEventModalProps) => {
    if (!isOpen) return null;

    // Helper data สำหรับ Dropdown
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const years = ['2567', '2568', '2569'];

    return (
        // Wrapper: ปรับ z-index สูงๆ เพื่อทับ Navbar/BottomBar
        // Mobile: items-end (ชิดล่าง) | Desktop: items-center (กึ่งกลาง)
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
            
            {/* Container */}
            {/* Mobile: h-[90vh] (เกือบเต็มจอ), rounded-t-[2rem] (มนเฉพาะด้านบน), slide-in-from-bottom */}
            {/* Desktop: h-auto (ตามเนื้อหา), rounded-[2rem] (มนรอบทิศ), zoom-in */}
            <div className="bg-white w-full md:max-w-3xl h-[95vh] md:h-auto md:max-h-[85vh] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
                
                {/* === Header === */}
                <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-100 flex justify-between items-center shrink-0 bg-white">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Add New Event</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* === Body (Scrollable) === */}
                <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    
                    {/* 1. ชื่อหัวข้อ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อหัวข้อ</label>
                        <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-base" placeholder="ระบุชื่อกิจกรรม..." />
                    </div>

                    {/* 2. รายละเอียด */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียด</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition resize-none text-base" placeholder="ระบุรายละเอียดเพิ่มเติม..." />
                    </div>

                    {/* 3. วันที่เริ่ม / สิ้นสุด (Grid: Mobile 1 column / Desktop 2 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        
                        {/* วันที่เริ่ม */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">วันที่เริ่ม</label>
                            <div className="flex gap-2">
                                {/* วัน */}
                                <div className="relative flex-1">
                                    <select className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 pr-6 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-sm md:text-base cursor-pointer">
                                        <option>01</option>
                                        {days.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                                {/* เดือน */}
                                <div className="relative flex-[2]">
                                    <select className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 pr-6 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-sm md:text-base cursor-pointer">
                                        <option>มกราคม</option>
                                        {months.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                                {/* ปี */}
                                <div className="relative flex-1">
                                    <select className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 pr-6 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-sm md:text-base cursor-pointer">
                                        <option>2568</option>
                                        {years.map(y => <option key={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* วันที่สิ้นสุด */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">วันที่สิ้นสุด</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 pr-6 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-sm md:text-base cursor-pointer">
                                        <option>01</option>
                                        {days.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                                <div className="relative flex-[2]">
                                    <select className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 pr-6 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-sm md:text-base cursor-pointer">
                                        <option>มกราคม</option>
                                        {months.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-3 pr-6 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-sm md:text-base cursor-pointer">
                                        <option>2568</option>
                                        {years.map(y => <option key={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. เวลา */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">เวลา</label>
                        <div className="flex items-center gap-3">
                            <input type="text" placeholder="HH" className="w-20 text-center border border-gray-300 rounded-xl px-2 py-3 focus:outline-none focus:border-green-500 text-gray-700 text-base" defaultValue="10" />
                            <span className="font-bold text-gray-400">:</span>
                            <input type="text" placeholder="MM" className="w-20 text-center border border-gray-300 rounded-xl px-2 py-3 focus:outline-none focus:border-green-500 text-gray-700 text-base" defaultValue="00" />
                            <span className="text-sm text-gray-500 mx-1 md:mx-2 font-medium">ถึง</span>
                            <input type="text" placeholder="HH" className="w-20 text-center border border-gray-300 rounded-xl px-2 py-3 focus:outline-none focus:border-green-500 text-gray-700 text-base" defaultValue="11" />
                            <span className="font-bold text-gray-400">:</span>
                            <input type="text" placeholder="MM" className="w-20 text-center border border-gray-300 rounded-xl px-2 py-3 focus:outline-none focus:border-green-500 text-gray-700 text-base" defaultValue="00" />
                        </div>
                    </div>

                    {/* 5. ประเภท */}
                    <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">ประเภท</label>
                         <div className="relative">
                            <select className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-8 bg-white focus:outline-none focus:border-green-500 text-gray-700 text-base cursor-pointer">
                                <option>Health</option>
                                <option>Zoom</option>
                                <option>Tele-medicine</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                         </div>
                    </div>

                    {/* 6. สถานที่ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">สถานที่</label>
                        <input type="text" defaultValue="https://maps.app.goo.gl/..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-blue-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-base" />
                    </div>
                </div>

                {/* === Footer Buttons === */}
                <div className="px-6 py-4 md:px-8 md:py-6 border-t border-gray-100 flex gap-4 shrink-0 bg-white pb-safe md:pb-6">
                    <button onClick={onClose} className="flex-1 px-6 py-3.5 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition active:scale-95 text-sm md:text-base">
                        ยกเลิก
                    </button>
                    <button onClick={onClose} className="flex-1 px-6 py-3.5 rounded-full bg-[#009245] text-white font-bold hover:bg-[#007a3a] transition shadow-lg shadow-green-200 active:scale-95 text-sm md:text-base">
                        ตกลง
                    </button>
                </div>
            </div>
        </div>
    );
};