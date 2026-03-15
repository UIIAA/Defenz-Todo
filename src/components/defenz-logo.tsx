import Image from 'next/image'

interface DefenzLogoIconProps {
  size?: number
  className?: string
  variant?: 'blue' | 'dark'
}

export function DefenzLogoIcon({ size = 32, className = '', variant = 'blue' }: DefenzLogoIconProps) {
  return (
    <Image
      src={variant === 'blue' ? '/defenz-icon.png' : '/defenz-icon-dark.png'}
      alt="Defenz"
      width={size}
      height={Math.round(size * (544 / 496))}
      className={className}
      priority
    />
  )
}

interface DefenzLogoFullProps {
  height?: number
  className?: string
}

export function DefenzLogoFull({ height = 36, className = '' }: DefenzLogoFullProps) {
  return (
    <Image
      src="/defenz-logo.png"
      alt="Defenz"
      width={Math.round(height * (1984 / 544))}
      height={height}
      className={className}
      priority
    />
  )
}
