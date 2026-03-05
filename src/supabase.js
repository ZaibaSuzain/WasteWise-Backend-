import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://eebifcsdxjnqtfvciwkd.supabase.co"
const SUPABASE_KEY = "sb_publishable_ltS9La75GFlHE8KvLyXwOw_WNlnRoRo"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)