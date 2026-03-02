import React, { useState } from "react";
import { User, Lock, Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import API_URL from "../../../config"; // ✅ เรียกใช้จาก config กลาง

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm = ({
  onRegisterSuccess,
  onSwitchToLogin,
}: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ เพิ่ม confirmPassword ใน State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "", // ช่องยืนยันรหัสผ่าน
    email: "",
  });
  
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("❌ รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email
        }),
      });

      // 🔍 DEBUG CODE
      const text = await response.text();
      console.log("Register Response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Server Error: " + text);
      }

      if (!response.ok) {
        if (data.error === "Username already exists") {
          throw new Error("⚠️ ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
        }
        throw new Error(data.error || "สมัครสมาชิกไม่สำเร็จ");
      }

      alert("🎉 สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* ส่วนแสดง Error */}
      {error && (
        <div className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {/* 1. Username */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">
          ชื่อผู้ใช้งาน
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <User size={20} />
          </div>
          <input
            required
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="w-full border border-gray-200 bg-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* 2. Password (สลับขึ้นมาก่อน Email) */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">
          รหัสผ่าน
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={20} />
          </div>
          <input
            required
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full border border-gray-200 bg-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* ✅ 3. Confirm Password (ช่องใหม่) */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">
          ยืนยันรหัสผ่าน
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {/* เปลี่ยนไอคอนเป็น Check เพื่อสื่อถึงการยืนยัน */}
            <CheckCircle2 size={20} />
          </div>
          <input
            required
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className={`w-full border bg-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:outline-none focus:ring-2 transition ${
              // ลูกเล่น: ถ้ากรอกแล้วไม่ตรงกัน ขอบจะเป็นสีแดง
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            }`}
          />
        </div>
      </div>

      {/* 4. Email (ย้ายมาไว้ล่างสุดตามขอ) */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">
          อีเมล
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail size={20} />
          </div>
          <input
            required
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full border border-gray-200 bg-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        disabled={isLoading}
        className="mt-2 w-full bg-[#009245] hover:bg-[#007a3a] text-white rounded-2xl py-3.5 font-bold text-base shadow-lg shadow-green-200 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            สมัครสมาชิก <ArrowRight size={20} />
          </>
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-500">มีบัญชีอยู่แล้ว? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </form>
  );
};