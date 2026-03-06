import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>{children}</a>
    )
  }
})

vi.mock('@/components/ui/sheet', () => ({
  SheetClose: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  )
}))

import NavbarLogic from '../navbar-logic'

describe('NavbarLogic component', () => {
  it('should render with custom className', () => {
    const { container } = render(<NavbarLogic className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeDefined()
  })

  it('should render empty nav when no links defined', () => {
    const { container } = render(<NavbarLogic />)
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(0)
  })
})
