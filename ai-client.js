import { supabase } from './supabase.js';

async function callEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');

  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `AI request failed.`);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function askNotesTutor({ noteTitle, noteContent, question, history = [] }) {
  return callEdgeFunction('ai-tutor', { mode:'tutor', noteTitle, noteContent, question, history });
}
export async function generateHomework({ topic, difficulty, count = 5, subject = 'Java Programming' }) {
  return callEdgeFunction('admin-ai', { mode:'homework', topic, difficulty, count, subject });
}
export async function generateAssignment({ topic, difficulty, count = 5, subject = 'Java Programming' }) {
  return callEdgeFunction('admin-ai', { mode:'assignment', topic, difficulty, count, subject });
}
