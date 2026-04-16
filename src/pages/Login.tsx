import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginWithUsernameOrEmail } from "../services/authService";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithUsernameOrEmail(identifier, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full p-8 shadow-2xl border-purple-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Hệ thống Đăng nhập</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Sử dụng Tên đăng nhập hoặc Email để truy cập
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
              Tên đăng nhập / Email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 pl-12 pr-4 outline-none transition-all font-bold"
                placeholder="username hoặc email..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 pl-12 pr-4 outline-none transition-all font-bold"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl text-lg font-black shadow-lg shadow-purple-200"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400 font-medium italic">
            "Nếu chưa có tài khoản, vui lòng liên hệ Quản trị viên"
          </p>
        </div>
      </Card>
    </div>
  );
}
