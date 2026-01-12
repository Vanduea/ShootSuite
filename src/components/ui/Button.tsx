/**
 * Button Component
 * Follows brand guide specifications
 */

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-primary text-white hover:opacity-90 active:opacity-80 focus:ring-primary',
      secondary: 'bg-secondary text-white hover:opacity-90 active:opacity-80 focus:ring-secondary',
      tertiary: 'border-2 border-secondary text-secondary bg-transparent hover:bg-secondary hover:text-white focus:ring-secondary',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-button',
      md: 'px-4 py-2 rounded-button',
      lg: 'px-6 py-3 text-base rounded-button-lg',
    }
    
    // Apply text size separately for md to avoid conflicts
    const textSize = size === 'md' ? 'text-body' : ''
    
    // Force text-white for primary and secondary variants (must come after textSize)
    const textColor = variant === 'primary' || variant === 'secondary' ? '!text-white' : ''

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], textSize, textColor, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

