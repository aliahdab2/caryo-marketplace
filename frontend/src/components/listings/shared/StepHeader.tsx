"use client";

import React from "react";

interface StepHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

const StepHeader: React.FC<StepHeaderProps> = ({ title, subtitle, className = "" }) => {
  return (
    <div className={`text-center border-b border-gray-200 dark:border-gray-700 pb-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-600 dark:text-gray-300">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StepHeader;


