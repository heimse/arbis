import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-xl text-center space-y-8 pt-24">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Онлайн-редактор планировок квартиры и дома
          </h1>
          <p className="text-lg text-muted-foreground">
            Наш сервис помогает придумывать перепланировки, проверять соответствие нормам 
            и визуализировать идеи в 2D и 3D. Создавайте идеальное пространство легко и быстро.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="text-base">
            <Link href="/signin">Войти в личный кабинет</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link href="/signup">Зарегистрироваться</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Безопасно. В любой момент можно удалить свои данные.
        </p>
      </div>
    </div>
  )
}

