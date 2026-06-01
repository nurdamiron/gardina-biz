import React from 'react';

/**
 * Avatar with initials fallback (no more generic person-icon stubs).
 * Colour is derived deterministically from the name so the same person
 * always gets the same tone.
 *
 * Props: name, src (optional photo url), size ('sm'|'md'|'lg'), className
 */
const PALETTE = [
  'bg-primary/10 text-primary',
  'bg-info-soft text-info',
  'bg-warning-soft text-warning',
  'bg-success-soft text-success',
  'bg-danger-soft text-danger',
];

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
};

function hashName(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const Avatar = ({ name = '', src, size = 'md', className = '' }) => {
  const sizeCls = SIZES[size] || SIZES.md;
  if (src) {
    return <img src={src} alt={name} className={`${sizeCls} rounded-full object-cover shrink-0 ${className}`} />;
  }
  const initials =
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  const tone = PALETTE[hashName(name) % PALETTE.length];
  return (
    <div className={`${sizeCls} ${tone} rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}>
      {initials}
    </div>
  );
};

export default Avatar;
