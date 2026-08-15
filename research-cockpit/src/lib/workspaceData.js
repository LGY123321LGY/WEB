const WORKSPACE_TABLES = {
  tasks: {
    table: 'tasks',
    select: '*',
    order: { column: 'created_at', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      title: item.title,
      meta: item.meta || null,
      tag: item.tag || null,
      done: Boolean(item.done),
    }),
  },
  papers: {
    table: 'papers',
    select: '*',
    order: { column: 'created_at', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      title: item.title,
      venue: item.venue || null,
      status: item.status || 'to_read',
      progress: Number.isFinite(Number(item.progress)) ? Number(item.progress) : 0,
      tags: Array.isArray(item.tags) ? item.tags : [],
      note: item.note || null,
      url: item.url || null,
      pdf_path: item.pdf_path || null,
      pdf_url: item.pdf_url || null,
      file_name: item.file_name || null,
      file_size: Number.isFinite(Number(item.file_size)) ? Number(item.file_size) : null,
      mime_type: item.mime_type || null,
    }),
  },
  experiments: {
    table: 'experiments',
    select: '*',
    order: { column: 'created_at', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      code: String(item.id || item.code || ''),
      name: item.name,
      status: item.status || 'queued',
      metric: item.metric || null,
      change: item.change || null,
      progress: Number.isFinite(Number(item.progress)) ? Number(item.progress) : 0,
      eta: item.eta || null,
      seed: item.seed || null,
    }),
    fromDb: (row) => ({ ...row, id: row.code || row.id }),
  },
  projects: {
    table: 'projects',
    select: '*',
    order: { column: 'created_at', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      title: item.title,
      description: item.description || null,
      status: item.status || 'active',
    }),
  },
  artifacts: {
    table: 'artifacts',
    select: '*',
    order: { column: 'created_at', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      type: item.type,
      title: item.title,
      url: item.url,
      meta: item.meta || null,
    }),
  },
  learningPhases: {
    table: 'learning_phases',
    select: '*',
    order: { column: 'sort_order', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      title: item.title,
      description: item.description || null,
      sort_order: item.sort_order || 0,
      completed: Boolean(item.completed),
    }),
  },
  studySessions: {
    table: 'study_sessions',
    select: '*',
    order: { column: 'started_at', ascending: false },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      started_at: item.started_at,
      ended_at: item.ended_at || null,
      minutes: item.minutes || null,
      notes: item.notes || null,
    }),
  },
  researchNotes: {
    table: 'research_notes',
    select: '*',
    order: { column: 'created_at', ascending: true },
    toDb: (item, ownerId) => ({
      owner_id: ownerId,
      title: item.title,
      body: item.body || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
    }),
  },
}

const toAppRows = (key, rows) => rows.map((row) => WORKSPACE_TABLES[key].fromDb?.(row) || row)

export async function loadWorkspaceData(supabase) {
  const entries = await Promise.all(
    Object.entries(WORKSPACE_TABLES).map(async ([key, config]) => {
      let query = supabase.from(config.table).select(config.select)
      if (config.order) query = query.order(config.order.column, { ascending: config.order.ascending })
      const { data, error } = await query
      if (error) throw error
      return [key, toAppRows(key, data || [])]
    }),
  )

  return Object.fromEntries(entries)
}

export async function insertWorkspaceItem(supabase, ownerId, key, item) {
  const config = WORKSPACE_TABLES[key]
  const { data, error } = await supabase
    .from(config.table)
    .insert(config.toDb(item, ownerId))
    .select(config.select)
    .single()
  if (error) throw error
  return config.fromDb?.(data) || data
}

export async function updateWorkspaceItem(supabase, key, id, patch) {
  const config = WORKSPACE_TABLES[key]
  const { data, error } = await supabase
    .from(config.table)
    .update(patch)
    .eq('id', id)
    .select(config.select)
    .single()
  if (error) throw error
  return config.fromDb?.(data) || data
}

export async function deleteWorkspaceItem(supabase, key, id) {
  const config = WORKSPACE_TABLES[key]
  const { data, error } = await supabase
    .from(config.table)
    .delete()
    .eq('id', id)
    .select(config.select)
    .single()
  if (error) throw error
  return config.fromDb?.(data) || data
}

export async function importLocalWorkspaceData(supabase, ownerId, localData) {
  const results = {}

  for (const [key, rows] of Object.entries(localData)) {
    const config = WORKSPACE_TABLES[key]
    if (!config || !Array.isArray(rows) || rows.length === 0) {
      results[key] = []
      continue
    }

    const payload = rows.map((item) => config.toDb(item, ownerId))
    const { data, error } = await supabase.from(config.table).insert(payload).select(config.select)
    if (error) throw error
    results[key] = toAppRows(key, data || [])
  }

  return results
}

export async function loadAdminData(supabase) {
  const [{ data: requests, error: requestsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from('access_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  ])

  if (requestsError) throw requestsError
  if (profilesError) throw profilesError

  return { requests: requests || [], profiles: profiles || [] }
}

export async function reviewAccessRequest(supabase, requestId, status, reviewerId) {
  const reviewedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('access_requests')
    .update({ status, reviewed_by: reviewerId, reviewed_at: reviewedAt })
    .eq('id', requestId)
    .select()
    .single()
  if (error) throw error

  await supabase.from('admin_audit_logs').insert({
    actor_id: reviewerId,
    action: `access_request.${status}`,
    target_table: 'access_requests',
    target_id: requestId,
    metadata: { email: data.email, github_username: data.github_username },
  })

  return data
}

export async function updateMemberStatus(supabase, profileId, status, actorId) {
  const payload = {
    status,
    approved_at: status === 'approved' ? new Date().toISOString() : null,
    approved_by: status === 'approved' ? actorId : null,
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
    .select()
    .single()
  if (error) throw error

  await supabase.from('admin_audit_logs').insert({
    actor_id: actorId,
    action: `profile.${status}`,
    target_table: 'profiles',
    target_id: profileId,
    metadata: { email: data.email, github_username: data.github_username },
  })

  return data
}
