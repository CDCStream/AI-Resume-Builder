"use client";

import { Resume } from "@/lib/types/resume";

export interface SavedResume {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  resumeData: Resume;
  templateId: string;
}

export interface SavedCoverLetter {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  coverLetterData: {
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
  templateId: string;
}

const RESUMES_KEY = "saved_resumes";
const COVER_LETTERS_KEY = "saved_cover_letters";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Resume CRUD Operations
export function getResumes(): SavedResume[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(RESUMES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getResumeById(id: string): SavedResume | null {
  const resumes = getResumes();
  return resumes.find((r) => r.id === id) || null;
}

export function createResume(
  name: string,
  resumeData: Resume,
  templateId: string
): SavedResume {
  const resumes = getResumes();
  const now = new Date().toISOString();
  
  const newResume: SavedResume = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    resumeData,
    templateId,
  };
  
  resumes.push(newResume);
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  
  return newResume;
}

export function updateResume(
  id: string,
  updates: Partial<Pick<SavedResume, "name" | "resumeData" | "templateId">>
): SavedResume | null {
  const resumes = getResumes();
  const index = resumes.findIndex((r) => r.id === id);
  
  if (index === -1) return null;
  
  resumes[index] = {
    ...resumes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  
  return resumes[index];
}

export function deleteResume(id: string): boolean {
  const resumes = getResumes();
  const filtered = resumes.filter((r) => r.id !== id);
  
  if (filtered.length === resumes.length) return false;
  
  localStorage.setItem(RESUMES_KEY, JSON.stringify(filtered));
  return true;
}

export function duplicateResume(id: string, newName?: string): SavedResume | null {
  const original = getResumeById(id);
  if (!original) return null;
  
  const name = newName || `${original.name} (Copy)`;
  return createResume(name, original.resumeData, original.templateId);
}

// Cover Letter CRUD Operations
export function getCoverLetters(): SavedCoverLetter[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(COVER_LETTERS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getCoverLetterById(id: string): SavedCoverLetter | null {
  const coverLetters = getCoverLetters();
  return coverLetters.find((c) => c.id === id) || null;
}

export function createCoverLetter(
  name: string,
  coverLetterData: SavedCoverLetter["coverLetterData"],
  templateId: string
): SavedCoverLetter {
  const coverLetters = getCoverLetters();
  const now = new Date().toISOString();
  
  const newCoverLetter: SavedCoverLetter = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    coverLetterData,
    templateId,
  };
  
  coverLetters.push(newCoverLetter);
  localStorage.setItem(COVER_LETTERS_KEY, JSON.stringify(coverLetters));
  
  return newCoverLetter;
}

export function updateCoverLetter(
  id: string,
  updates: Partial<Pick<SavedCoverLetter, "name" | "coverLetterData" | "templateId">>
): SavedCoverLetter | null {
  const coverLetters = getCoverLetters();
  const index = coverLetters.findIndex((c) => c.id === id);
  
  if (index === -1) return null;
  
  coverLetters[index] = {
    ...coverLetters[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(COVER_LETTERS_KEY, JSON.stringify(coverLetters));
  
  return coverLetters[index];
}

export function deleteCoverLetter(id: string): boolean {
  const coverLetters = getCoverLetters();
  const filtered = coverLetters.filter((c) => c.id !== id);
  
  if (filtered.length === coverLetters.length) return false;
  
  localStorage.setItem(COVER_LETTERS_KEY, JSON.stringify(filtered));
  return true;
}

export function duplicateCoverLetter(id: string, newName?: string): SavedCoverLetter | null {
  const original = getCoverLetterById(id);
  if (!original) return null;
  
  const name = newName || `${original.name} (Copy)`;
  return createCoverLetter(name, original.coverLetterData, original.templateId);
}
