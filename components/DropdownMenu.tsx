import React, { useRef, useEffect, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { LucideIcon } from 'lucide-react';

interface DropdownMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: DropdownMenuItem[];
  anchorRef: React.RefObject<HTMLElement>;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onClose,
  items,
  anchorRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' });
  const [focusedIndex, setFocusedIndex] = useState(0);

  useClickOutside(dropdownRef, onClose, isOpen);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Position below the anchor with 8px gap
      const top = anchorRect.bottom + 8;

      // Check if dropdown would overflow right edge
      const estimatedWidth = 200; // Approximate dropdown width
      const shouldAlignRight = anchorRect.right > viewportWidth - estimatedWidth;

      if (shouldAlignRight) {
        setPosition({
          top,
          left: 'auto' as any,
          right: viewportWidth - anchorRect.right,
        });
      } else {
        setPosition({
          top,
          left: anchorRect.left,
          right: 'auto' as any,
        });
      }
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
          event.preventDefault();
          items[focusedIndex]?.onClick();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, focusedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md min-w-[200px]"
      style={{
        top: `${position.top}px`,
        ...(position.right !== 'auto' ? { right: `${position.right}px` } : { left: `${position.left}px` }),
      }}
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              role="menuitem"
              tabIndex={0}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                focusedIndex === index ? 'bg-slate-800' : ''
              } ${
                item.variant === 'danger'
                  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {Icon && <Icon size={16} />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
