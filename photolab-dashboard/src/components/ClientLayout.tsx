"use client";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const isPublicPage = isLoginPage || pathname.startsWith("/download");

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.push("/login");
    }
  }, [user, loading, isPublicPage, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8f9fc]">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#6366f1] mx-auto mb-3" size={40} />
          <p className="text-gray-400 text-sm">Loading Photolab...</p>
        </div>
      </div>
    );
  }

  // Public pages: no sidebar/navbar
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Not logged in and not on login page: show nothing (redirect happening)
  if (!user) {
    return null;
  }

  // Logged in: show full dashboard layout
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
