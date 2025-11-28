/**
 * NextAuth v5 (Auth.js) Configuration
 * 
 * Конфигурация авторизации с использованием:
 * - Prisma Adapter для хранения сессий в БД
 * - Credentials Provider для email/password авторизации
 */

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email и пароль обязательны')
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Ищем пользователя по email
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Неверный email или пароль')
        }

        // Проверяем пароль
        const isPasswordValid = await compare(password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error('Неверный email или пароль')
        }

        // Возвращаем данные пользователя
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
