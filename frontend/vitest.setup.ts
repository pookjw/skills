import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// React Testing Library 정리
afterEach(() => {
  cleanup()
})
