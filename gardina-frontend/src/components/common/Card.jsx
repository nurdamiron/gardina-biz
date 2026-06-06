import React from 'react';

/**
 * Card — shadcn/ui styled container. Default export keeps the original API
 * (children, onClick, padding, hover) so existing screens keep working; the
 * named sub-components (CardHeader/CardTitle/…/CardFooter) are available for
 * new shadcn-style layouts.
 */
const Card = ({ children, onClick, padding = 'p-4', hover, className = '', ...rest }) => {
  const interactive = hover ?? !!onClick;
  return (
    <div
      onClick={onClick}
      className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm ${padding} ${
        interactive ? 'cursor-pointer transition-all hover:shadow-md hover:border-primary/40 active:scale-[0.99]' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 p-6 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`} {...props} />
);

export const CardDescription = ({ className = '', ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export const CardFooter = ({ className = '', ...props }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);

export default Card;
