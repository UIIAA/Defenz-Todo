interface DefenzLogoIconProps {
  className?: string
  size?: number
}

export function DefenzLogoIcon({ className = '', size = 32 }: DefenzLogoIconProps) {
  return (
    <svg
      viewBox="0 0 500 540"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      {/* Shield outer shape */}
      <path
        d="M90 80C90 50 110 20 150 20H310C340 20 370 35 385 60L430 140C445 165 445 195 430 220L280 480C265 505 240 520 210 520H150C120 520 95 505 80 480L30 380C15 355 15 325 30 300L90 200V80Z"
        fill="currentColor"
      />
      {/* Inner shield cutout */}
      <path
        d="M180 190C180 170 195 155 215 155H280C295 155 310 165 318 178L345 225C352 238 352 253 345 266L280 380C273 393 260 400 245 400H215C200 400 187 393 180 380V190Z"
        fill="white"
        className="dark:fill-[#0a1628]"
      />
      {/* Dot accent top-right */}
      <rect
        x="370"
        y="30"
        width="55"
        height="55"
        rx="12"
        fill="currentColor"
      />
    </svg>
  )
}

interface DefenzLogoFullProps {
  className?: string
  height?: number
  variant?: 'horizontal' | 'vertical'
}

export function DefenzLogoFull({ className = '', height = 40, variant = 'horizontal' }: DefenzLogoFullProps) {
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        <DefenzLogoIcon size={height * 1.2} />
        <span
          className="font-extrabold tracking-tight"
          style={{ fontSize: height * 0.45 }}
        >
          DEFENZ<span className="text-blue-600">.</span>
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <DefenzLogoIcon size={height * 0.85} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: height * 0.55 }}
      >
        DEFENZ<span className="text-blue-600">.</span>
      </span>
    </div>
  )
}
