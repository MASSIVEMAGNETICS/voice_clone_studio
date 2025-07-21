
import React from 'react';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ min = 0, max = 100, step = 1, value, onValueChange, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(Number(e.target.value));
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      className={`w-full h-2 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-400 ${className}`}
    />
  );
};
