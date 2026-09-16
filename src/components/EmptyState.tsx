import React from "react";
import { BellOff, Radio, Clock, BarChart3 } from "lucide-react";

interface EmptyStateProps {
  icon?: "notifications-off-outline" | "radio-outline" | "time-outline" | "bar-chart-outline" | string;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const renderIcon = () => {
    switch (icon) {
      case "notifications-off-outline":
        return <BellOff className="w-10 h-10 text-[#90CAF9]" />;
      case "radio-outline":
        return <Radio className="w-10 h-10 text-[#90CAF9]" />;
      case "time-outline":
        return <Clock className="w-10 h-10 text-[#90CAF9]" />;
      case "bar-chart-outline":
        return <BarChart3 className="w-10 h-10 text-[#90CAF9]" />;
      default:
        return <Radio className="w-10 h-10 text-[#90CAF9]" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-7 px-4 text-center">
      {renderIcon()}
      <h4 className="mt-3 text-base font-bold text-[#123047]">{title}</h4>
      <p className="mt-1.5 text-sm text-[#5C6E80] leading-relaxed max-w-sm">{message}</p>
    </div>
  );
}
