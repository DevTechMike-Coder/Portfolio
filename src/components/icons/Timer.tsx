import type { SVGProps } from 'react'

export function Timer(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em' height='1em' viewBox='0 0 24 24'
      fill='none' stroke='currentColor' strokeWidth='2'
      strokeLinecap='round' strokeLinejoin='round' {...props}
    >
      <circle cx='12' cy='13' r='8' />
      <path d='M12 9v4l2.5 2.5' />
      <path d='M12 3v2' />
    </svg>
  )
}