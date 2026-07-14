import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks",
].join(" ");

export function getAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  if (state) params.set("state", state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error("Failed to exchange code");
  return response.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error("Failed to refresh token");
  return response.json();
}

export async function getValidAccessToken(specialistId: string): Promise<string | null> {
  const { data: spec, error } = await supabase
    .from("specialists")
    .select("google_access_token, google_refresh_token, google_token_expiry")
    .eq("id", specialistId)
    .single();

  if (error || !spec?.google_access_token) return null;

  const expiry = spec.google_token_expiry ? new Date(spec.google_token_expiry).getTime() : 0;
  const now = Date.now();

  if (expiry > now + 60_000) {
    return spec.google_access_token;
  }

  if (!spec.google_refresh_token) return null;

  try {
    const tokens = await refreshAccessToken(spec.google_refresh_token);
    const newExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    await supabase.rpc("save_google_tokens", {
      p_specialist_id: specialistId,
      p_access_token: tokens.access_token,
      p_refresh_token: spec.google_refresh_token,
      p_expiry: newExpiry,
    });

    return tokens.access_token;
  } catch {
    return null;
  }
}

export interface GoogleEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
  extendedProperties?: { private?: Record<string, string> };
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleEvent
): Promise<{ id: string; htmlLink: string } | null> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    console.error("Create event error:", err);
    return null;
  }
  return response.json();
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<GoogleEvent>
): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    console.error("Update event error:", err);
    return false;
  }
  return true;
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response.ok || response.status === 410;
}

export async function listGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  syncToken?: string
): Promise<{ items: GoogleEvent[]; nextSyncToken?: string; nextPageToken?: string }> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  if (syncToken) params.set("syncToken", syncToken);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("Failed to list events");
  return response.json();
}

export function buildEventFromAppointment(appt: any, patientName: string, specialistName: string): GoogleEvent {
  const start = new Date(appt.scheduled_at);
  const end = new Date(start.getTime() + (appt.duration_minutes || 60) * 60_000);

  return {
    summary: `Cita: ${patientName} con ${specialistName}`,
    description: [
      appt.reason && `Motivo: ${appt.reason}`,
      appt.notes && `Notas: ${appt.notes}`,
      `Estado: ${appt.status}`,
      `ID Synapsia: ${appt.id}`,
    ].filter(Boolean).join("\n"),
    start: { dateTime: start.toISOString(), timeZone: "America/Mexico_City" },
    end: { dateTime: end.toISOString(), timeZone: "America/Mexico_City" },
    extendedProperties: { private: { synapsia_appointment_id: appt.id } },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }, { method: "email", minutes: 60 }] },
  };
}

export async function updateSynapsiaFromGcal(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<Array<{ synapsiaId: string; gcalEvent: GoogleEvent; needsUpdate: boolean }>> {
  const result = await listGoogleEvents(accessToken, calendarId, timeMin, timeMax);
  const changes: Array<{ synapsiaId: string; gcalEvent: GoogleEvent; needsUpdate: boolean }> = [];

  for (const event of result.items || []) {
    const synapsiaId = event.extendedProperties?.private?.synapsia_appointment_id;
    if (synapsiaId) {
      changes.push({ synapsiaId, gcalEvent: event, needsUpdate: true });
    }
  }
  return changes;
}

export interface GoogleTask {
  id?: string;
  title: string;
  notes?: string;
  due?: string;
  status?: string;
  completed?: string;
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

export async function listTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const response = await fetch("https://www.googleapis.com/tasks/v1/users/@me/lists", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to list task lists");
  const data = await response.json();
  return data.items || [];
}

export async function listTasks(accessToken: string, taskListId: string, dueMin?: string, dueMax?: string): Promise<GoogleTask[]> {
  const params = new URLSearchParams({ showCompleted: "false", maxResults: "100" });
  if (dueMin) params.set("dueMin", dueMin);
  if (dueMax) params.set("dueMax", dueMax);
  const response = await fetch(
    `https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("Failed to list tasks");
  const data = await response.json();
  return data.items || [];
}

export async function createTask(accessToken: string, taskListId: string, task: GoogleTask): Promise<GoogleTask | null> {
  const response = await fetch(
    `https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }
  );
  if (!response.ok) { console.error("Create task error:", await response.json()); return null; }
  return response.json();
}

export async function updateTask(accessToken: string, taskListId: string, taskId: string, task: Partial<GoogleTask>): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(task),
    }
  );
  return response.ok;
}

export async function completeTask(accessToken: string, taskListId: string, taskId: string): Promise<boolean> {
  return updateTask(accessToken, taskListId, taskId, { status: "completed" });
}

export async function deleteTask(accessToken: string, taskListId: string, taskId: string): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${taskId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.ok || response.status === 404;
}