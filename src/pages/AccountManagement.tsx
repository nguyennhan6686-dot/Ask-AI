import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  Mail, 
  AtSign,
  Plus,
  X,
  Save,
  Loader2
} from "lucide-react";
import { UserProfile, UserRole } from "../types/auth";
import { getAllUsers, createOrUpdateUser, deleteUser } from "../services/userService";
import { cn } from "../utils/cn";

export function AccountManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: UserProfile) => {
    setEditingUser(user || { role: "user_type_1" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.uid || !editingUser?.email || !editingUser?.username) {
      alert("Vui lòng nhập đầy đủ thông tin cơ bản (UID, Email, Username)");
      return;
    }

    try {
      setFormLoading(true);
      await createOrUpdateUser(editingUser);
      await fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error("Lỗi khi lưu user:", error);
      alert("Lỗi khi lưu thông tin người dùng.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      await deleteUser(uid);
      await fetchUsers();
    } catch (error) {
      console.error("Lỗi khi xóa user:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" /> Quản lý Tài khoản
          </h1>
          <p className="text-gray-500 font-medium mt-1">Quản lý phân quyền và hồ sơ người dùng hệ thống</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 px-6 py-3 rounded-2xl shadow-lg shadow-purple-100">
          <UserPlus className="w-5 h-5" /> Thêm Tài khoản
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.uid} className="p-6 border-gray-100 hover:border-purple-200 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-tight">{user.displayName}</h3>
                    <p className="text-xs text-gray-400 font-bold">@{user.username}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                  user.role === "admin" ? "bg-red-100 text-red-600" : 
                  user.role === "user_type_1" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                  {user.role}
                </div>
              </div>

              <div className="mt-6 space-y-3 relative z-10">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                </div>
                {user.fieldA && (
                  <div className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-400 uppercase mr-2">Thông tin A:</span>
                    <span className="text-gray-700">{user.fieldA}</span>
                  </div>
                )}
                {user.fieldB && (
                  <div className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-400 uppercase mr-2">Thông tin B:</span>
                    <span className="text-gray-700">{user.fieldB}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-end gap-2 relative z-10">
                <button 
                  onClick={() => handleOpenModal(user)}
                  className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(user.uid)}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border-purple-100 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                {editingUser?.uid ? <Edit2 className="w-6 h-6 text-blue-600" /> : <UserPlus className="w-6 h-6 text-purple-600" />}
                {editingUser?.uid ? "Chỉnh sửa Tài khoản" : "Thêm Tài khoản mới"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* UID - Chỉ nhập khi tạo mới */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">UID (Firebase Auth UID)</label>
                  <input
                    type="text"
                    disabled={!!editingUser?.createdAt}
                    value={editingUser?.uid || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, uid: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 px-4 outline-none transition-all font-bold disabled:opacity-50"
                    placeholder="Dán UID từ Firebase Console..."
                    required
                  />
                </div>

                {/* Role Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Phân quyền (Role)</label>
                  <select
                    value={editingUser?.role || "user_type_1"}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 px-4 outline-none transition-all font-bold appearance-none"
                  >
                    <option value="admin">Admin (Quản trị viên)</option>
                    <option value="user_type_1">User Loại 1</option>
                    <option value="user_type_2">User Loại 2</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Họ và Tên</label>
                  <input
                    type="text"
                    value={editingUser?.displayName || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 px-4 outline-none transition-all font-bold"
                    placeholder="Nguyễn Văn A..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
                  <input
                    type="text"
                    value={editingUser?.username || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 px-4 outline-none transition-all font-bold"
                    placeholder="van_a_123..."
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                  <input
                    type="email"
                    value={editingUser?.email || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-500 rounded-xl py-3 px-4 outline-none transition-all font-bold"
                    placeholder="email@example.com..."
                    required
                  />
                </div>

                {/* TRƯỜNG ĐỘNG THEO ROLE */}
                {editingUser?.role === "user_type_1" && (
                  <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                    <label className="text-xs font-black uppercase tracking-widest text-purple-600 ml-1">Thông tin bổ sung A (Dành cho Loại 1)</label>
                    <input
                      type="text"
                      value={editingUser?.fieldA || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, fieldA: e.target.value })}
                      className="w-full bg-purple-50 border-2 border-purple-100 focus:border-purple-500 rounded-xl py-3 px-4 outline-none transition-all font-bold"
                      placeholder="Nhập thông tin chuyên biệt A..."
                    />
                  </div>
                )}

                {editingUser?.role === "user_type_2" && (
                  <>
                    <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                      <label className="text-xs font-black uppercase tracking-widest text-green-600 ml-1">Thông tin bổ sung B (Dành cho Loại 2)</label>
                      <input
                        type="text"
                        value={editingUser?.fieldB || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, fieldB: e.target.value })}
                        className="w-full bg-green-50 border-2 border-green-100 focus:border-green-500 rounded-xl py-3 px-4 outline-none transition-all font-bold"
                        placeholder="Nhập thông tin chuyên biệt B..."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2">
                      <label className="text-xs font-black uppercase tracking-widest text-green-600 ml-1">Liên kết User Loại 1</label>
                      <select
                        value={editingUser?.linkedUserType1Id || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, linkedUserType1Id: e.target.value })}
                        className="w-full bg-green-50 border-2 border-green-100 focus:border-green-500 rounded-xl py-3 px-4 outline-none transition-all font-bold appearance-none"
                      >
                        <option value="">-- Chọn User Loại 1 liên kết --</option>
                        {users.filter(u => u.role === "user_type_1").map(u => (
                          <option key={u.uid} value={u.uid}>{u.displayName} (@{u.username})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <Button type="button" onClick={handleCloseModal} className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-none">
                  Hủy bỏ
                </Button>
                <Button type="submit" disabled={formLoading} className="gap-2 px-8">
                  {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
