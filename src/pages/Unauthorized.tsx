import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home } from "lucide-react";
import { Button } from "../components/ui/Button";

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Truy cập bị từ chối</h1>
        <p className="text-gray-500 mb-8 font-medium">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ Quản trị viên nếu bạn tin rằng đây là một sự nhầm lẫn.
        </p>
        <Link to="/app">
          <Button className="gap-2 px-8 py-4 rounded-2xl">
            <Home className="w-5 h-5" /> Quay về Trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
