import React from 'react';

/**
 * Single card container so every card shares the same radius / border / shadow /
 * hover behaviour (was: rounded-xl vs rounded-2xl, gray-100 vs border-light, p-4 vs p-5).
 *
 * Props:
 *  - onClick: makes the card interactive (hover + press affordance)
 *  - padding: tailwind padding class (default 'p-4')
 *  - hover:   force hover affordance even without onClick
 *  - className: extra classes
 */
const Card = ({ children, onClick, padding = 'p-4', hover, className = '', ...rest }) => {
  const interactive = hover ?? !!onClick;
  return (
    <div
      onClick={onClick}
      className={`bg-surface-light rounded-2xl border border-border-light shadow-sm ${padding} ${
        interactive ? 'cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.99]' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
