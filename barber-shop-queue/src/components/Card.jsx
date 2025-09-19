import React from 'react';

const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;