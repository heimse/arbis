"use client";

import * as React from "react";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

/**
 * Контекст для управления видимостью сайдбара
 */
export const SidebarContext = React.createContext<{
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
}>({
  isSidebarVisible: true,
  toggleSidebar: () => {},
  setSidebarVisible: () => {},
});

export function useSidebar() {
  return React.useContext(SidebarContext);
}

/**
 * Client-компонент для дашборда с управлением видимостью сайдбара
 */
export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarVisible((v) => !v);
  }, []);

  const setSidebarVisible = React.useCallback((visible: boolean) => {
    setIsSidebarVisible(visible);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isSidebarVisible, toggleSidebar, setSidebarVisible }}
    >
      <div className="flex h-screen overflow-hidden">
        {/* Боковая панель с анимацией */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isSidebarVisible ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          <DashboardSidebar />
        </div>

        {/* Основной контент */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}

