import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  dir?: 'ltr' | 'rtl' | 'auto';
};

export default function Input({ className, dir, type = "text", ...props }: InputProps) {
  // If it's a number, password, email, phone, it MUST always be strictly LTR
  const isStrictLtr = type === 'password' || type === 'email' || type === 'tel' || type === 'number';
  const finalDir = isStrictLtr ? 'ltr' : (dir || 'auto');

  return (
    <input
      type={type}
      dir={finalDir}
      className={`focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${className || ''}`}
      style={{
        direction: finalDir === 'auto' ? undefined : finalDir,
        unicodeBidi: finalDir === 'ltr' ? 'normal' : 'plaintext'
      }}
      {...props}
    />
  );
}
