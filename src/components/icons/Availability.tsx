import type { SVGProps } from 'react'

export function Availability(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em' 
      height='1em' 
      viewBox='0 0 24 24'
      fill='none' 
      stroke='currentColor' 
      strokeWidth='2'
      strokeLinecap='round' 
      strokeLinejoin='round' 
      {...props}
    >
      {/* The Gauge/Clock Base */}
      <path d='M12 2a10 10 0 1 0 10 10' />
      
      {/* The "Uptime" indicator/Hand */}
      <path d='M12 12L16 8' />
      <path d='M12 7V12' />
      
      {/* Success/Available Checkmark */}
      <path d='M16 16l3 3 5-5' />
    </svg>
  )
}