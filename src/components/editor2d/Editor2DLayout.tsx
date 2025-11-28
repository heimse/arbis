"use client";

import * as React from "react";
import { Editor2DCanvas } from "./Editor2DCanvas";
import { Editor2DToolbar } from "./Editor2DToolbar";
import { Editor2DPropertiesPanel } from "./Editor2DPropertiesPanel";
import { useSidebar } from "@/components/layout/DashboardLayoutClient";

/**
 * Компонент центральной части редактора (canvas + панель + плавающий тулбар)
 * Переиспользуется в обычном и fullscreen режимах
 */
function Editor2DContent({
  isRightPanelVisible,
  isFullscreen,
  onToggleFullscreen,
  onToggleRightPanel,
  onToggleLeftPanel,
  isLeftPanelVisible,
}: {
  isRightPanelVisible: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleRightPanel: () => void;
  onToggleLeftPanel?: () => void;
  isLeftPanelVisible?: boolean;
}) {
  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Canvas занимает всё доступное пространство */}
      <div className="flex-1 relative">
        <Editor2DCanvas />
        
        {/* Плавающий тулбар поверх canvas */}
        <Editor2DToolbar
          onToggleFullscreen={onToggleFullscreen}
          isFullscreen={isFullscreen}
          onToggleRightPanel={onToggleRightPanel}
          isRightPanelVisible={isRightPanelVisible}
          onToggleLeftPanel={onToggleLeftPanel}
          isLeftPanelVisible={isLeftPanelVisible}
        />
      </div>

      {/* Панель свойств справа */}
      {isRightPanelVisible && <Editor2DPropertiesPanel />}
    </div>
  );
}

/**
 * Основной layout для 2D-редактора
 * Объединяет canvas, плавающий toolbar и панель свойств
 */
export function Editor2DLayout() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isRightPanelVisible, setIsRightPanelVisible] = React.useState(true);
  
  // Получаем контекст сайдбара (если есть)
  const sidebarContext = useSidebar();
  const { isSidebarVisible, toggleSidebar } = sidebarContext;

  // Обработка ESC для выхода из fullscreen
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  // Обычный режим
  if (!isFullscreen) {
    return (
      <div className="flex flex-col h-full">
        {/* Основное содержимое с плавающим тулбаром */}
        <Editor2DContent
          isRightPanelVisible={isRightPanelVisible}
          isFullscreen={false}
          onToggleFullscreen={() => setIsFullscreen(true)}
          onToggleRightPanel={() => setIsRightPanelVisible((v) => !v)}
          onToggleLeftPanel={toggleSidebar}
          isLeftPanelVisible={isSidebarVisible}
        />
      </div>
    );
  }

  // Fullscreen режим
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Основное содержимое */}
      <Editor2DContent
        isRightPanelVisible={isRightPanelVisible}
        isFullscreen={true}
        onToggleFullscreen={() => setIsFullscreen(false)}
        onToggleRightPanel={() => setIsRightPanelVisible((v) => !v)}
        onToggleLeftPanel={toggleSidebar}
        isLeftPanelVisible={isSidebarVisible}
      />
    </div>
  );
}

