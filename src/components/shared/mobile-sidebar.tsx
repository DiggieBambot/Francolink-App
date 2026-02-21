"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface MobileSidebarProps {
  children: React.ReactNode;
}

export function MobileSidebar({ children }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-hard lg:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer z-10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Sidebar Content */}
        <div className="flex flex-col h-full" onClick={() => setIsOpen(false)}>
          {children}
        </div>
      </div>
    </>
  );
}