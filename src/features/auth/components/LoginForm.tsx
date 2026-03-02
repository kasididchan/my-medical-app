import React, { useState } from "react";
import { User, Lock, Loader2, ArrowRight } from "lucide-react";
import API_URL from "../../../config";

interface LoginFormProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void; // ✅ รับ prop เพิ่ม
}

export const LoginForm = ({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // 🔍 DEBUG: อ่านค่าเป็น Text ก่อน (อย่าเพิ่ง .json())
      const text = await response.text();
      console.log("Server Response:", text); // กด F12 ดูใน Console ได้เลย

      // ลองแปลงเป็น JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        // ถ้าแปลงไม่ได้ แสดงว่า Server พัง หรือส่ง HTML Error มา
        throw new Error("Server Error: " + text); 
      }

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // ถ้าผ่าน
      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user_info", JSON.stringify(data.user));
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}
      
      {/* Username Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ชื่อผู้ใช้งาน</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={20} /></div>
          <input required type="text" placeholder="Username" value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full border border-gray-200 bg-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">รหัสผ่าน</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={20} /></div>
          <input required type="password" placeholder="••••••••" value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border border-gray-200 bg-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      <button disabled={isLoading} className="mt-4 w-full bg-[#0033A0] hover:bg-[#002880] text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-blue-200 transition active:scale-[0.98] flex items-center justify-center gap-2">
        {isLoading ? <Loader2 className="animate-spin" /> : <>เข้าสู่ระบบ <ArrowRight size={20} /></>}
      </button>
      
      {/* ปุ่มไปหน้าสมัครสมาชิก */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-500">ยังไม่มีบัญชี? </span>
        <button type="button" onClick={onSwitchToRegister} className="text-sm font-bold text-blue-600 hover:underline">สมัครสมาชิกใหม่</button>
      </div>

      {/*<div className="text-center">
        <div className="text-xs text-gray-400 mb-1">----- หรือใช้ user สำหรับทดสอบระบบ -----</div>
        <div className="bg-gray-100 border border-gray-100 rounded-xl p-3 text-xs text-slate-600 w-[200px] mx-auto">
          <p>
            <span className="font-bold">Username:</span> test001
          </p>
          <p className="mt-1">
            <span className="font-bold">Password:</span> 001
          </p>
        </div>
      </div>*/}
    </form>
  );
};