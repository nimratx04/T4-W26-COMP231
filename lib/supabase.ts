import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================
// M14 / CR-1: Connect incident data model and storage
// ============================================================

export interface IncidentReportData {
  incident_type: string;
  description: string;
  location: string;
  urgency: string;
  photo_name?: string | null;
  status?: string;
}

export const createIncidentReport = async (report: IncidentReportData) => {
  const { data, error } = await supabase
    .from("incident_reports")
    .insert({
      ...report,
      status: report.status || "Pending Verification",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
};

// ============================================================
// M15 / CR-3: Add submission handling and status logic
// ============================================================

export const submitIncidentReportWithStatus = async (report: IncidentReportData) => {
  const { data, error } = await supabase
    .from("incident_reports")
    .insert({
      ...report,
      status: "Pending Verification",
    })
    .select("id, status, created_at")
    .single();

  if (error) throw error;
  return data;
};

export const getIncidentReportStatus = async (reportId: string) => {
  const { data, error } = await supabase
    .from("incident_reports")
    .select("id, status, created_at")
    .eq("id", reportId)
    .single();

  if (error) throw error;
  return data;
};

// ============================================================
// S8 / CR-4: Query and display the current user's reports
// ============================================================

export const getUserIncidentReports = async (userId?: string) => {
  let query = supabase
    .from("incident_reports")
    .select("*")
    .order("created_at", { ascending: false });

  // In a real app, filter by user_id. For demo, we return all.
  // In production, add: .eq("user_id", userId)
  
  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const getIncidentReportsByStatus = async (status: string) => {
  const { data, error } = await supabase
    .from("incident_reports")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// ============================================================
// C1 / CR-2: Add photo upload to Firebase Storage (Supabase Storage)
// ============================================================

export const uploadIncidentPhoto = async (uri: string, fileName: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();

  const path = `incident-photos/${Date.now()}-${fileName}`;
  
  const { data, error } = await supabase.storage
    .from("incident-photos")
    .upload(path, blob, {
      contentType: blob.type,
      cacheControl: "3600",
    });

  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from("incident-photos")
    .getPublicUrl(path);

  return {
    path: data?.path || path,
    url: urlData?.publicUrl || null,
  };
};

export const deleteIncidentPhoto = async (path: string) => {
  const { error } = await supabase.storage
    .from("incident-photos")
    .remove([path]);

  if (error) throw error;
  return true;
};

// ============================================================
// C2 / CR-5: Connect alerts data feed
// ============================================================

export const getCommunityAlerts = async () => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getAlertById = async (alertId: string) => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .single();

  if (error) throw error;
  return data;
};

export const getAlertsByArea = async (area: string) => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .ilike("area", `%${area}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// ============================================================
// M13 / AC-4: Connect incident status update backend
// ============================================================

export const updateIncidentStatus = async (
  incidentId: string,
  status: "Verified" | "Responding" | "Resolved" | "Rejected"
) => {
  const { data, error } = await supabase
    .from("incident_reports")
    .update({ status })
    .eq("id", incidentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const bulkUpdateIncidentStatus = async (
  incidentIds: string[],
  status: "Verified" | "Responding" | "Resolved" | "Rejected"
) => {
  const { data, error } = await supabase
    .from("incident_reports")
    .update({ status })
    .in("id", incidentIds)
    .select();

  if (error) throw error;
  return data;
};
