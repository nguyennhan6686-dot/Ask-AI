import { Link, useLocation } from "react-router-dom";
import { Brain, Home, MessageSquare, Settings, Trophy, LogIn, LogOut } from "lucide-react";
import { cn } from "../utils/cn";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      if (error.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        alert(`Lỗi: Tên miền này chưa được cấp phép trong Firebase.\n\nBạn hãy vào Firebase Console -> Authentication -> Settings -> Authorized domains và thêm tên miền này vào nhé:\n👉 ${currentDomain}`);
      } else {
        alert("Lỗi đăng nhập: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const links = [
    { to: "/app", icon: Home, label: "Trang chủ" },
    { to: "/app/quiz", icon: Brain, label: "Trắc nghiệm" },
    { to: "/app/chat", icon: MessageSquare, label: "Gia sư AI" },
    { to: "/app/teacher", icon: Settings, label: "Giáo viên" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto bg-white/80 backdrop-blur-md border-t md:border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="hidden md:flex items-center">
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Hỏi Đáp Cùng AI
              </span>
            </Link>
          </div>

          <div className="flex flex-1 md:flex-none justify-around md:justify-end items-center md:gap-8">
            {links.map((link) => {
              const isActive = location.pathname === link.to || (link.to === '/app' && location.pathname === '/app/');
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-colors",
                    isActive ? "text-purple-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-purple-100 rounded-xl -z-10 hidden md:block"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("w-6 h-6 md:w-5 md:h-5", isActive && "fill-purple-100")} />
                  <span className="text-xs md:text-sm font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="hidden md:flex items-center ml-8 pl-8 border-l border-gray-200 gap-4">
            <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-orange-700">1.250</span>
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors" title="Đăng xuất">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-xl font-medium transition-colors">
                <LogIn className="w-4 h-4" /> Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
