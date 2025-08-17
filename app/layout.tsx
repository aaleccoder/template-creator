"use client";
import React from "react";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from 'sonner';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/";

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isAuthPage ? (
            <>{children}</>
          ) : (
            <SidebarProvider>
              <div className="flex h-screen w-full ">
                <Sidebar>
                  <SidebarHeader>
                    <SidebarGroup>
                      <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                      <SidebarContent>
                        <SidebarMenu>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === "/dashboard"}
                            >
                              <a href="/dashboard">Dashboard</a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname.startsWith("/templates")}
                            >
                              <a href="/templates">Plantillas</a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname.startsWith("/documents")}
                            >
                              <a href="/documents">Documentos</a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarContent>
                    </SidebarGroup>
                  </SidebarHeader>
                </Sidebar>
                <SidebarInset>
                  <Header />
                  <DynamicBreadcrumb />
                  <main className="w-full h-full overflow-auto md:p-8 p-2 space-y-4">
                    {children}
                  </main>
                </SidebarInset>
              </div>
            </SidebarProvider>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
