"use client";
import { useAuth } from "@/lib/AuthContext";
import { updateUserPassword, signOut } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, LogOut, Loader2, CheckCircle, Shield } from "lucide-react";

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await updateUserPassword(newPassword);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and security settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User size={20} className="text-indigo-500" /> Profile Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Mail size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{user?.email || "Not logged in"}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">User ID</label>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-mono text-gray-400">{user?.id || "-"}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Joined</label>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-sm text-gray-500">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' }) : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-indigo-500" /> Change Password
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium border border-emerald-100 flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                required type="password" minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                required type="password" minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#6366f1] text-white py-3 rounded-xl font-bold hover:bg-[#4f46e5] transition-all disabled:bg-gray-300 shadow-md shadow-indigo-200 text-sm flex items-center justify-center gap-2">
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Sign Out */}
      <button onClick={handleSignOut}
        className="w-full bg-white text-red-600 py-3 rounded-2xl font-semibold border border-red-200 hover:bg-red-50 transition-all text-sm flex items-center justify-center gap-2">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
