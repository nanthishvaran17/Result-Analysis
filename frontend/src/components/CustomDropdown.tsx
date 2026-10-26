import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  badge?: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomDropdownProps {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  options: DropdownOption[];
  value: string | number;
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
  minWidth?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  minWidth = 'min-w-[200px]',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const paddingClasses =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-4 py-2.5 text-sm'
      : 'px-3 py-2 text-xs';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 bg-white hover:bg-slate-50 border rounded-xl font-semibold shadow-2xs transition-all cursor-pointer ${paddingClasses} ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/20'
            : 'border-slate-200/90 text-slate-800 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 text-left">
          {Icon && <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
          <div className="min-w-0 truncate">
            {label && (
              <span className="block text-[10px] uppercase tracking-wider text-slate-700 font-extrabold leading-none mb-1">
                {label}
              </span>
            )}
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption?.badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100/90 text-blue-900 font-mono font-bold text-[10px]">
                  {selectedOption.badge}
                </span>
              )}
              <span className="truncate font-bold text-slate-900">
                {selectedOption?.label || placeholder}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 ${minWidth} max-h-72 overflow-y-auto animate-scale-up`}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-center text-xs text-slate-600 font-medium">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              const OptIcon = opt.icon;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/90 text-blue-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {OptIcon && <OptIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    {opt.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-800 font-bold border border-slate-200'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-xs text-slate-600 font-medium truncate">{opt.sublabel}</div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
