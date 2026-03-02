import React from "react";
import { LoginForm } from "../features/auth/components/LoginForm";
import { RegisterForm } from "../features/auth/components/RegisterForm"; // อย่าลืม import

interface LoginPageProps {
  view: "login" | "register";
  onSwitchView: (view: "login" | "register") => void;
  onLoginSuccess: () => void;
}

export default function LoginPage({ view, onSwitchView, onLoginSuccess }: LoginPageProps) {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Card */}
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md mb-6">
            PHC
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {view === "login" ? "ยินดีต้อนรับสู่เว็บการนัดหมาย" : "สร้างบัญชีใหม่ 🚀"}
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Pattaya Health Center Management System
          </p>
        </div>

        {/* เลือกโชว์ฟอร์มตาม State */}
        {view === "login" ? (
          <LoginForm 
            onLoginSuccess={onLoginSuccess} 
            onSwitchToRegister={() => onSwitchView("register")} 
          />
        ) : (
          <RegisterForm 
            onRegisterSuccess={() => onSwitchView("login")} 
            onSwitchToLogin={() => onSwitchView("login")}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 Pattaya Health Center. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}