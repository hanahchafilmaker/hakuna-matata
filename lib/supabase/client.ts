import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export type TaskRow = {
  id: string
  text: string
  assignee: string
  type: 'ui' | 'nui' | 'uni' | 'ocr'
  date_start: string
  date_end: string
  time: string
  location: string
  memo: string
  repeat: string
  done: boolean
  created_at: string
  updated_at: string
}