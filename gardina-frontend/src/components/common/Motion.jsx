import React from 'react';
import { motion } from 'framer-motion';

/**
 * Shared motion primitives — one calm, restrained motion language for the whole
 * app (shadcn-style: subtle fade + small upward slide, soft easing, short).
 *
 *  - PageTransition  wrap routed content; re-animates on every navigation
 *  - Reveal          fade-up on scroll into view (once)
 *  - Stagger/Item    list/grid container that reveals children one-by-one
 */
export const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className = '', delay = 0, y = 12, amount = 0.15 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = '', amount = 0.1 }) {
  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export default PageTransition;
