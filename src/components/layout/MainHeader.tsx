'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggleAdvanced } from '@/components/ui/theme-toggle-advanced'

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">Абрис</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <ThemeToggleAdvanced />
            <Button asChild variant="ghost">
              <Link href="/signin">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Зарегистрироваться</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

