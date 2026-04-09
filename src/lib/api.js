import { supabase } from './supabase';

async function query(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

// ── Folders ──

export async function listFolders() {
  return query(
    supabase.from('folders').select('*').order('name')
  );
}

export async function createFolder(name) {
  const { data: { user } } = await supabase.auth.getUser();
  return query(
    supabase.from('folders').insert({ name, user_id: user.id }).select().single()
  );
}

export async function updateFolder(id, name) {
  return query(
    supabase.from('folders').update({ name }).eq('id', id).select().single()
  );
}

export async function deleteFolder(id) {
  return query(
    supabase.from('folders').delete().eq('id', id)
  );
}

// ── Flows ──

export async function listFlows(folderId) {
  let q = supabase
    .from('flows')
    .select('id, name, folder_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (folderId === 'root') {
    q = q.is('folder_id', null);
  } else if (folderId) {
    q = q.eq('folder_id', folderId);
  }

  return query(q);
}

export async function getFlow(id) {
  const flow = await query(
    supabase.from('flows').select('*').eq('id', id).single()
  );

  const revisions = await query(
    supabase
      .from('flow_revisions')
      .select('*')
      .eq('flow_id', id)
      .order('revision_number', { ascending: false })
      .limit(1)
  );

  const latest = revisions.length > 0 ? revisions[0] : null;

  return {
    ...flow,
    data: latest?.data ?? { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    latestRevisionNumber: latest?.revision_number ?? 0,
  };
}

export async function createFlow(name = 'Untitled flow', folderId = null, data = null) {
  const { data: { user } } = await supabase.auth.getUser();

  const flow = await query(
    supabase
      .from('flows')
      .insert({ name, folder_id: folderId || null, user_id: user.id })
      .select()
      .single()
  );

  const initialData = data ?? { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };

  await query(
    supabase
      .from('flow_revisions')
      .insert({ flow_id: flow.id, revision_number: 1, data: initialData })
  );

  return { ...flow, data: initialData, latestRevisionNumber: 1 };
}

export async function updateFlow(id, updates) {
  const allowed = {};
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.folder_id !== undefined) allowed.folder_id = updates.folder_id;

  return query(
    supabase.from('flows').update(allowed).eq('id', id).select().single()
  );
}

export async function saveFlowData(flowId, data, currentRevisionNumber) {
  const newRevisionNumber = currentRevisionNumber + 1;

  await query(
    supabase
      .from('flow_revisions')
      .insert({ flow_id: flowId, revision_number: newRevisionNumber, data })
  );

  // Touch updated_at (trigger handles the timestamp)
  await query(
    supabase.from('flows').update({ updated_at: new Date().toISOString() }).eq('id', flowId)
  );

  return newRevisionNumber;
}

export async function deleteFlow(id) {
  return query(
    supabase.from('flows').delete().eq('id', id)
  );
}

export async function getFlowRevisions(flowId) {
  return query(
    supabase
      .from('flow_revisions')
      .select('id, revision_number, created_at')
      .eq('flow_id', flowId)
      .order('revision_number', { ascending: false })
  );
}

export async function getRevision(revisionId) {
  return query(
    supabase.from('flow_revisions').select('*').eq('id', revisionId).single()
  );
}
