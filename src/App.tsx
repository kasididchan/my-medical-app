import { useState, useEffect } from "react";
import CalendarPage from "./pages/CalendarPage";
import LoginPage from "./pages/LoginPage";
// เราจะใช้ LoginPage เป็นตัวกลางแสดงผลทั้ง Login และ Register Form

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<"login" | "register">("login"); // ✅ เพิ่ม State สลับหน้า

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_info");
    setIsAuthenticated(false);
    setAuthPage("login"); // Reset กลับไปหน้า Login
  };

  // ถ้ายังไม่ Login
  if (!isAuthenticated) {
    // ส่ง props ไปบอก LoginPage ว่าให้แสดงหน้าไหน
    return (
      <LoginPage 
        view={authPage} 
        onSwitchView={(view) => setAuthPage(view)} 
        onLoginSuccess={handleLogin} 
      />
    );
  }

  return (
    <>
      <CalendarPage onLogout={handleLogout} />
    </>
  );
}

export default App;