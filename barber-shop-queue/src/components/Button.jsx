import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 disabled:bg-primary-300',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500 disabled:bg-gray-100',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500 disabled:bg-gray-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-300',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-300',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;