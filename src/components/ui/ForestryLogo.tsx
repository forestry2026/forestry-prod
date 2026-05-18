interface LogoProps {
  className?: string
}

export function ForestryLogo({ className = 'w-7 h-7' }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 4C14 4 8 9 8 15C8 18.866 10.686 22 14 22C17.314 22 20 18.866 20 15C20 9 14 4 14 4Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path d="M14 22V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 18C10 18 6 17 5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M18 18C18 18 22 17 23 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
