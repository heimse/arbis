/**
 * NextAuth v5 (Auth.js) API Route Handler
 * 
 * Этот файл обрабатывает все запросы к /api/auth/*
 * включая signin, signout, session и т.д.
 */

import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
