import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function MobileSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  options = [], 
  className 
}) {
  const [open, setOpen] = React.useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Desktop: use regular Select
  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: use Drawer as bottom sheet
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between ${className}`}
        >
          <span>{selectedOption?.label || placeholder}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <h3 className="text-lg font-semibold mb-4 px-2">{placeholder}</h3>
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  value === option.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className={value === option.value ? 'font-semibold text-[#1e3a5f] dark:text-[#d4af37]' : ''}>
                  {option.label}
                </span>
                {value === option.value && (
                  <Check className="w-5 h-5 text-[#1e3a5f] dark:text-[#d4af37]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}