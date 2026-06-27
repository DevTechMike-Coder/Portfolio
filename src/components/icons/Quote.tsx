import type { SVGProps } from 'react'

export function Quote(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden='true'
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
      <path d='M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v3l-2 2' />
      <path d='M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v3l-2 2' />
    </svg>
  )
}
