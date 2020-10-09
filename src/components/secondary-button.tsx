import React from 'react';

export const SecondaryButton: React.FC = ({ children, ...otherProps }) => {
  return (
    <button
      className="px-2 py-2 font-medium text-sm leading-5 rounded-md text-gray-500 hover:text-gray-700 hover:outline-none hover:text-gray-700 hover:bg-gray-100 whitespace-no-wrap"
      {...otherProps}
    >
      {children}
    </button>
  );
};
