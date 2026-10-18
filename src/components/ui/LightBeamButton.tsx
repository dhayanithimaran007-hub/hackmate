import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { motion, type Transition } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

type MotionConflictingProps = 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag';

export interface BaseLightBeamProps {
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  gradientColors?: [string, string, string] | string[];
  icon?: React.ReactNode;
  iconPlacement?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  borderWidth?: number;
  duration?: number;
  rounded?: 'full' | 'xl' | 'lg' | 'md' | 'none';
  disabled?: boolean;
}

export type LightBeamButtonProps = BaseLightBeamProps & (
  | ({ to: LinkProps['to']; href?: never } & Omit<LinkProps, 'to' | 'className' | MotionConflictingProps>)
  | ({ href: string; to?: never } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | MotionConflictingProps>)
  | ({ to?: never; href?: never } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | MotionConflictingProps>)
);

const sizeClasses = {
  sm: 'min-h-[38px] px-4 py-1.5 text-xs tracking-wider',
  md: 'min-h-[48px] px-6 py-2.5 text-xs sm:text-sm tracking-wider',
  lg: 'min-h-[52px] px-7 py-3 text-sm sm:text-base tracking-wider',
};

const radiusMap = {
  full: '9999px',
  xl: '16px',
  lg: '12px',
  md: '8px',
  none: '0px',
};

const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

const MotionLink = motion.create(Link);

export const LightBeamButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  LightBeamButtonProps
>((props, ref) => {
  const {
    children,
    className,
    innerClassName,
    gradientColors,
    icon,
    iconPlacement = 'right',
    size = 'md',
    borderWidth = 1.5,
    duration = 4,
    rounded = 'full',
    disabled = false,
    style: customStyle,
    onAnimationStart: _unusedOas,
    onDragStart: _unusedOds,
    onDragEnd: _unusedOde,
    onDrag: _unusedOd,
    ...rest
  } = props as any;

  const [c1 = '#FF3548', c2 = '#FF5262', c3 = '#FF3548'] = gradientColors || [];

  const dynamicStyles: React.CSSProperties = {
    '--beam-c1': c1,
    '--beam-c2': c2,
    '--beam-c3': c3,
    '--beam-radius': radiusMap[rounded as keyof typeof radiusMap] || '9999px',
    '--beam-border-width': `${borderWidth}px`,
    '--beam-duration': `${duration}s`,
    ...customStyle,
  } as React.CSSProperties;

  const innerContent = (
    <>
      {/* 1. Neon Aura Glow on Hover */}
      <span className="light-beam-glow" aria-hidden="true" />

      {/* 2. Static Dark Base Track */}
      <span className="light-beam-track" aria-hidden="true" />

      {/* 3. Smooth Rotating Conic-Gradient Light Beam */}
      <span className="light-beam-border" aria-hidden="true" />

      {/* 4. Opaque Core Container with Readable Typography */}
      <span
        className={twMerge(
          'light-beam-inner',
          sizeClasses[size as keyof typeof sizeClasses],
          innerClassName
        )}
      >
        {icon && iconPlacement === 'left' && (
          <span className="inline-flex shrink-0 items-center justify-center transition-transform group-hover:-translate-x-0.5">
            {icon}
          </span>
        )}
        <span className="inline-flex items-center gap-2">{children}</span>
        {icon && iconPlacement === 'right' && (
          <span className="inline-flex shrink-0 items-center justify-center transition-transform group-hover:translate-x-0.5">
            {icon}
          </span>
        )}
      </span>
    </>
  );

  const sharedMotionProps = {
    whileHover: disabled ? undefined : { scale: 1.02 },
    whileTap: disabled ? undefined : { scale: 0.98 },
    transition: springTransition,
  };

  const combinedClassName = twMerge(
    'light-beam-wrapper group',
    disabled && 'cursor-not-allowed opacity-45 pointer-events-none',
    className
  );

  // Link navigation mode (React Router)
  if ('to' in props && props.to !== undefined) {
    const { to, onClick, ...linkRest } = rest;

    return (
      <MotionLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={to}
        style={dynamicStyles}
        className={combinedClassName}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...sharedMotionProps}
        {...linkRest}
      >
        {innerContent}
      </MotionLink>
    );
  }

  // External anchor mode
  if ('href' in props && props.href !== undefined) {
    const { href, onClick, ...anchorRest } = rest;

    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={disabled ? undefined : href}
        style={dynamicStyles}
        className={combinedClassName}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...sharedMotionProps}
        {...anchorRest}
      >
        {innerContent}
      </motion.a>
    );
  }

  // Standard Button mode
  const { type = 'button', onClick, ...buttonRest } = rest;

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      style={dynamicStyles}
      className={combinedClassName}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      {...sharedMotionProps}
      {...buttonRest}
    >
      {innerContent}
    </motion.button>
  );
});

LightBeamButton.displayName = 'LightBeamButton';
export default LightBeamButton;
