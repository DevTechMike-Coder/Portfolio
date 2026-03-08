import type { SVGProps } from 'react'

export function Briefcase(props: SVGProps<SVGSVGElement>) {
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
      <rect x='2' y='7' width='20' height='14' rx='2' ry='2'></rect>
      <path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'></path>
    </svg>
  )
}