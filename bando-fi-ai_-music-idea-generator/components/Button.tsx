
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  as?: React.ElementType;
};

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'default', size = 'md', as: Component = 'button', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-zinc-700 text-white hover:bg-zinc-600',
    ghost: 'hover:bg-zinc-700/50',
    outline: 'border border-solid bg-transparent hover:bg-zinc-800',
  };

  return (
    <Component className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
};
