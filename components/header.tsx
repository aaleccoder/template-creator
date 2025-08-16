"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      } else {
        alert('Error al cerrar sesión.');
      }
    } catch (error) {
      alert('Ocurrió un error inesperado.');
    }
  };

  return (
    <header className="flex justify-between items-center border-b md:p-4 p-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={toggleSidebar}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
        <Button onClick={handleLogout}>Cerrar Sesión</Button>
      </div>
    </header>
  );
}