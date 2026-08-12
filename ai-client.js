import { supabase } from './supabase.js';

async function callEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');

  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `AI request failed.`);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function askNotesTutor({ noteId, noteTitle, noteContent, question, history = [], mode = 'teach', contextNotes = [] }) {
  return callEdgeFunction('ai-tutor', {
    mode: 'tutor', noteId, noteTitle, noteContent, question, history, tutoringMode: mode, contextNotes
  });
}

export async function getLearningProfile() {
  return callEdgeFunction('ai-tutor', { mode: 'profile' });
}

export async function askAdminLearningInsights({ question, context = {} }) {
  return callEdgeFunction('admin-ai', { mode: 'insights', question, context });
}

export async function generateHomework({ topic, difficulty, count = 5, subject = 'Java Programming' }) {
  return callEdgeFunction('admin-ai', { mode:'homework', topic, difficulty, count, subject });
}
export async function generateAssignment({ topic, difficulty, count = 5, subject = 'Java Programming' }) {
  return callEdgeFunction('admin-ai', { mode:'assignment', topic, difficulty, count, subject });
}
