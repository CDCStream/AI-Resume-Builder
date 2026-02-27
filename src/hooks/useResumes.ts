"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as supabaseDb from "@/lib/supabase/database";
import { Resume } from "@/lib/types/resume";

export interface SavedResume {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  resumeData: Resume;
  templateId: string;
}

function dbToSavedResume(dbResume: supabaseDb.DbResume): SavedResume {
  return {
    id: dbResume.id,
    name: dbResume.name,
    createdAt: dbResume.created_at,
    updatedAt: dbResume.updated_at,
    resumeData: dbResume.resume_data,
    templateId: dbResume.template_id,
  };
}

export function useResumes() {
  const { user, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    if (!user) {
      setResumes([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const dbResumes = await supabaseDb.getResumes();
    setResumes(dbResumes.map(dbToSavedResume));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchResumes();
    }
  }, [authLoading, fetchResumes]);

  const getResumeById = useCallback(async (id: string): Promise<SavedResume | null> => {
    if (!user) return null;
    const dbResume = await supabaseDb.getResumeById(id);
    return dbResume ? dbToSavedResume(dbResume) : null;
  }, [user]);

  const createResume = useCallback(async (
    name: string,
    resumeData: Resume,
    templateId: string
  ): Promise<SavedResume | null> => {
    if (!user) return null;
    
    const dbResume = await supabaseDb.createResume(name, resumeData, templateId);
    if (dbResume) {
      const saved = dbToSavedResume(dbResume);
      setResumes(prev => [saved, ...prev]);
      return saved;
    }
    return null;
  }, [user]);

  const updateResume = useCallback(async (
    id: string,
    updates: Partial<Pick<SavedResume, "name" | "resumeData" | "templateId">>
  ): Promise<SavedResume | null> => {
    if (!user) return null;
    
    const dbUpdates: Partial<Pick<supabaseDb.DbResume, "name" | "resume_data" | "template_id">> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.resumeData !== undefined) dbUpdates.resume_data = updates.resumeData;
    if (updates.templateId !== undefined) dbUpdates.template_id = updates.templateId;

    const dbResume = await supabaseDb.updateResume(id, dbUpdates);
    if (dbResume) {
      const updated = dbToSavedResume(dbResume);
      setResumes(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    }
    return null;
  }, [user]);

  const deleteResume = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    const success = await supabaseDb.deleteResume(id);
    if (success) {
      setResumes(prev => prev.filter(r => r.id !== id));
    }
    return success;
  }, [user]);

  const duplicateResume = useCallback(async (id: string, newName?: string): Promise<SavedResume | null> => {
    if (!user) return null;
    
    const dbResume = await supabaseDb.duplicateResume(id, newName);
    if (dbResume) {
      const saved = dbToSavedResume(dbResume);
      setResumes(prev => [saved, ...prev]);
      return saved;
    }
    return null;
  }, [user]);

  return {
    resumes,
    loading: loading || authLoading,
    isAuthenticated: !!user,
    getResumeById,
    createResume,
    updateResume,
    deleteResume,
    duplicateResume,
    refetch: fetchResumes,
  };
}
