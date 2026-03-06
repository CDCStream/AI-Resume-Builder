import { createClient } from "./client";
import { Resume } from "@/lib/types/resume";

export interface DbResume {
  id: string;
  user_id: string;
  name: string;
  resume_data: Resume;
  template_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbCoverLetter {
  id: string;
  user_id: string;
  name: string;
  cover_letter_data: {
    recipientName: string;
    recipientTitle: string;
    companyName: string;
    companyAddress: string;
    date: string;
    subject: string;
    greeting: string;
    body: string;
    closing: string;
    senderName: string;
    senderTitle: string;
  };
  template_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

const supabase = createClient();

export async function getResumes(): Promise<DbResume[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching resumes:", error);
    return [];
  }

  return data || [];
}

export async function getResumeById(id: string): Promise<DbResume | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching resume:", error);
    return null;
  }

  return data;
}

export async function createResume(
  name: string,
  resumeData: Resume,
  templateId: string
): Promise<DbResume | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      name,
      resume_data: resumeData,
      template_id: templateId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating resume:", error);
    return null;
  }

  return data;
}

export async function updateResume(
  id: string,
  updates: Partial<Pick<DbResume, "name" | "resume_data" | "template_id">>
): Promise<DbResume | null> {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.resume_data !== undefined) updateData.resume_data = updates.resume_data;
  if (updates.template_id !== undefined) updateData.template_id = updates.template_id;

  const { data, error } = await supabase
    .from("resumes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating resume:", error);
    return null;
  }

  return data;
}

export async function deleteResume(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting resume:", error);
    return false;
  }

  return true;
}

export async function duplicateResume(id: string, newName?: string): Promise<DbResume | null> {
  const original = await getResumeById(id);
  if (!original) return null;

  const name = newName || `${original.name} (Copy)`;
  return createResume(name, original.resume_data, original.template_id);
}

export async function getCoverLetters(): Promise<DbCoverLetter[]> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching cover letters:", error);
    return [];
  }

  return data || [];
}

export async function getCoverLetterById(id: string): Promise<DbCoverLetter | null> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching cover letter:", error);
    return null;
  }

  return data;
}

export async function createCoverLetter(
  name: string,
  coverLetterData: DbCoverLetter["cover_letter_data"],
  templateId: string
): Promise<DbCoverLetter | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("User not authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("cover_letters")
    .insert({
      user_id: user.id,
      name,
      cover_letter_data: coverLetterData,
      template_id: templateId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating cover letter:", error);
    return null;
  }

  return data;
}

export async function updateCoverLetter(
  id: string,
  updates: Partial<Pick<DbCoverLetter, "name" | "cover_letter_data" | "template_id">>
): Promise<DbCoverLetter | null> {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.cover_letter_data !== undefined) updateData.cover_letter_data = updates.cover_letter_data;
  if (updates.template_id !== undefined) updateData.template_id = updates.template_id;

  const { data, error } = await supabase
    .from("cover_letters")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating cover letter:", error);
    return null;
  }

  return data;
}

export async function deleteCoverLetter(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("cover_letters")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cover letter:", error);
    return false;
  }

  return true;
}

export async function duplicateCoverLetter(id: string, newName?: string): Promise<DbCoverLetter | null> {
  const original = await getCoverLetterById(id);
  if (!original) return null;

  const name = newName || `${original.name} (Copy)`;
  return createCoverLetter(name, original.cover_letter_data, original.template_id);
}

export async function getProfile(): Promise<DbProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function updateProfile(
  updates: Partial<Pick<DbProfile, "full_name" | "avatar_url">>
): Promise<DbProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data;
}

// Feedback
export async function hasUserGivenFeedback(source: "resume_pdf" | "cover_letter_pdf"): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true; // Don't show modal if not authenticated

  const { count, error } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("source", source);

  if (error) {
    console.error("Error checking feedback:", error);
    return true;
  }

  return (count ?? 0) > 0;
}

export async function insertFeedback(
  rating: number,
  source: "resume_pdf" | "cover_letter_pdf",
  comment?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      rating,
      source,
      comment: comment || null,
    });

  if (error) {
    console.error("Error inserting feedback:", error);
    return false;
  }

  return true;
}
