import type { SVGProps } from 'react'

export function Keyboard(props: SVGProps<SVGSVGElement>) {
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
      <rect x='2' y='8' width='20' height='8' rx='2' ry='2'></rect>
      <line x1='6' y1='12' x2='6.01' y2='12'></line>
      <line x1='10' y1='12' x2='10.01' y2='12'></line>
      <line x1='14' y1='12' x2='14.01' y2='12'></line>
      <line x1='18' y1='12' x2='18.01' y2='12'></line>
      <line x1='6' y1='16' x2='18' y2='16'></line>
    </svg>
  )
}