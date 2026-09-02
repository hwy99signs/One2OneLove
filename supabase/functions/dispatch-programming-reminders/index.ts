// Supabase Edge Function: dispatch-programming-reminders
// DEVELOPMENT CODE ONLY. Creates private, structured IN-APP notifications only.
// It does not send email, SMS, push notifications, or call an external provider.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const MAX_BATCH = 100
const STALE_PROCESSING_MS = 10 * 60 * 1000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const sha256Bytes = async (value: string) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))

const secretsMatch = async (expected: string, supplied: string) => {
  if (!expected || expected.length < 32 || !supplied) return false
  const [a, b] = await Promise.all([sha256Bytes(expected), sha256Bytes(supplied)])
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

const batchSize = () => {
  const configured = Number.parseInt(Deno.env.get('PROGRAMMING_REMINDER_BATCH_SIZE') || '', 10)
  if (!Number.isFinite(configured) || configured < 1) return 25
  return Math.min(configured, MAX_BATCH)
}

serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405)

  if (Deno.env.get('PROGRAMMING_REMINDERS_ENABLED') !== 'true') {
    return json({ success: true, enabled: false, processed: 0, results: [] })
  }

  const expectedSecret = Deno.env.get('PROGRAMMING_REMINDER_DISPATCH_SECRET') || ''
  const suppliedSecret = request.headers.get('x-o2ol-programming-reminder-secret') || ''
  if (!(await secretsMatch(expectedSecret, suppliedSecret))) {
    return json({ error: 'UNAUTHORIZED_DISPATCH' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'SERVER_CONFIGURATION_INCOMPLETE' }, 500)

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const now = new Date()
    const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS).toISOString()

    // Recover dispatcher claims left behind by a crash before notification creation.
    const { error: recoverError } = await serviceClient
      .from('programming_reminders')
      .update({ status: 'active' })
      .eq('status', 'processing')
      .lt('updated_at', staleBefore)
    if (recoverError) throw recoverError

    const { data: due, error: dueError } = await serviceClient
      .from('programming_reminders')
      .select('id,user_id,slot_id,remind_at')
      .eq('status', 'active')
      .lte('remind_at', now.toISOString())
      .order('remind_at', { ascending: true })
      .limit(batchSize())
    if (dueError) throw dueError

    const results: Array<{ id: string; status: string }> = []

    for (const reminder of due || []) {
      // Claim exactly one active row. Concurrent dispatchers will get null here after
      // the first worker changes the row to processing.
      const { data: claimed, error: claimError } = await serviceClient
        .from('programming_reminders')
        .update({ status: 'processing' })
        .eq('id', reminder.id)
        .eq('user_id', reminder.user_id)
        .eq('status', 'active')
        .select('id,user_id,slot_id')
        .maybeSingle()

      if (claimError) {
        console.error('Programming reminder claim failed:', reminder.id, claimError)
        continue
      }
      if (!claimed) continue

      try {
        const { data: slot, error: slotError } = await serviceClient
          .from('creator_programming_slots')
          .select('id,program_source,title,starts_at,ends_at,content_mode,status')
          .eq('id', claimed.slot_id)
          .maybeSingle()
        if (slotError) throw slotError

        const endsAt = slot?.ends_at ? new Date(slot.ends_at) : null
        if (!slot || slot.status !== 'booked' || !endsAt || Number.isNaN(endsAt.getTime()) || endsAt <= now) {
          await serviceClient
            .from('programming_reminders')
            .update({ status: 'cancelled' })
            .eq('id', claimed.id)
            .eq('status', 'processing')
          results.push({ id: claimed.id, status: 'program_unavailable' })
          continue
        }

        const { error: notificationError } = await serviceClient
          .from('programming_notifications')
          .insert({
            reminder_id: claimed.id,
            user_id: claimed.user_id,
            slot_id: slot.id,
            notification_type: 'programming_reminder',
            program_title: String(slot.title || '').slice(0, 160),
            program_source: slot.program_source === 'o2ol' ? 'o2ol' : 'creator',
            content_mode: slot.content_mode === 'replay' ? 'replay' : 'live',
            starts_at: slot.starts_at,
            action_path: '/LiveRoom?room=global-relationship-room',
          })

        if (notificationError && notificationError.code !== '23505') throw notificationError

        const { error: sentError } = await serviceClient
          .from('programming_reminders')
          .update({ status: 'sent' })
          .eq('id', claimed.id)
          .eq('status', 'processing')
        if (sentError) throw sentError

        results.push({ id: claimed.id, status: notificationError?.code === '23505' ? 'already_notified' : 'notified' })
      } catch (error) {
        console.error('Programming reminder dispatch failed:', claimed.id, error)
        // Return the claim to active for a future retry. The unique reminder_id on the
        // notification table prevents a duplicate if the insert succeeded before a
        // later state update failed.
        await serviceClient
          .from('programming_reminders')
          .update({ status: 'active' })
          .eq('id', claimed.id)
          .eq('status', 'processing')
        results.push({ id: claimed.id, status: 'retry' })
      }
    }

    return json({ success: true, enabled: true, processed: results.length, results })
  } catch (error) {
    console.error('dispatch-programming-reminders failed:', error instanceof Error ? error.message : 'unknown')
    return json({ error: 'PROGRAMMING_REMINDER_DISPATCH_FAILED' }, 500)
  }
})
