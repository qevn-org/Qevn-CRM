import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'right',
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${
              align === 'right' ? 'right-0' : 'left-0'
            } z-50 mt-2 min-w-[8rem] origin-top rounded-lg border border-border bg-card p-1 shadow-lg glass focus:outline-none ${className}`}
            onClick={() => setOpen(false)} // Auto-close on item click
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  className = '',
  disabled = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={(e) => {
        if (disabled) {
          e.stopPropagation();
          return;
        }
        if (onClick) onClick(e);
      }}
      className={`flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary/60 transition-colors ${
        disabled ? 'pointer-events-none opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
