"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as supabaseDb from "@/lib/supabase/database";

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

function dbToSavedCoverLetter(dbCoverLetter: supabaseDb.DbCoverLetter): SavedCoverLetter {
  return {
    id: dbCoverLetter.id,
    name: dbCoverLetter.name,
    createdAt: dbCoverLetter.created_at,
    updatedAt: dbCoverLetter.updated_at,
    coverLetterData: dbCoverLetter.cover_letter_data,
    templateId: dbCoverLetter.template_id,
  };
}

export function useCoverLetters() {
  const { user, loading: authLoading } = useAuth();
  const [coverLetters, setCoverLetters] = useState<SavedCoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoverLetters = useCallback(async () => {
    if (!user) {
      setCoverLetters([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const dbCoverLetters = await supabaseDb.getCoverLetters();
    setCoverLetters(dbCoverLetters.map(dbToSavedCoverLetter));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchCoverLetters();
    }
  }, [authLoading, fetchCoverLetters]);

  const getCoverLetterById = useCallback(async (id: string): Promise<SavedCoverLetter | null> => {
    if (!user) return null;
    const dbCoverLetter = await supabaseDb.getCoverLetterById(id);
    return dbCoverLetter ? dbToSavedCoverLetter(dbCoverLetter) : null;
  }, [user]);

  const createCoverLetter = useCallback(async (
    name: string,
    coverLetterData: SavedCoverLetter["coverLetterData"],
    templateId: string
  ): Promise<SavedCoverLetter | null> => {
    if (!user) return null;
    
    const dbCoverLetter = await supabaseDb.createCoverLetter(name, coverLetterData, templateId);
    if (dbCoverLetter) {
      const saved = dbToSavedCoverLetter(dbCoverLetter);
      setCoverLetters(prev => [saved, ...prev]);
      return saved;
    }
    return null;
  }, [user]);

  const updateCoverLetter = useCallback(async (
    id: string,
    updates: Partial<Pick<SavedCoverLetter, "name" | "coverLetterData" | "templateId">>
  ): Promise<SavedCoverLetter | null> => {
    if (!user) return null;
    
    const dbUpdates: Partial<Pick<supabaseDb.DbCoverLetter, "name" | "cover_letter_data" | "template_id">> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.coverLetterData !== undefined) dbUpdates.cover_letter_data = updates.coverLetterData;
    if (updates.templateId !== undefined) dbUpdates.template_id = updates.templateId;

    const dbCoverLetter = await supabaseDb.updateCoverLetter(id, dbUpdates);
    if (dbCoverLetter) {
      const updated = dbToSavedCoverLetter(dbCoverLetter);
      setCoverLetters(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    }
    return null;
  }, [user]);

  const deleteCoverLetter = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    const success = await supabaseDb.deleteCoverLetter(id);
    if (success) {
      setCoverLetters(prev => prev.filter(c => c.id !== id));
    }
    return success;
  }, [user]);

  const duplicateCoverLetter = useCallback(async (id: string, newName?: string): Promise<SavedCoverLetter | null> => {
    if (!user) return null;
    
    const dbCoverLetter = await supabaseDb.duplicateCoverLetter(id, newName);
    if (dbCoverLetter) {
      const saved = dbToSavedCoverLetter(dbCoverLetter);
      setCoverLetters(prev => [saved, ...prev]);
      return saved;
    }
    return null;
  }, [user]);

  return {
    coverLetters,
    loading: loading || authLoading,
    isAuthenticated: !!user,
    getCoverLetterById,
    createCoverLetter,
    updateCoverLetter,
    deleteCoverLetter,
    duplicateCoverLetter,
    refetch: fetchCoverLetters,
  };
}
