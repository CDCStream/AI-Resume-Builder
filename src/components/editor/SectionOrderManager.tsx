"use client";

import { useState, useRef } from "react";
import { SectionType } from "@/lib/types/resume";

interface SectionOrderManagerProps {
  sectionOrder: SectionType[];
  activeSections: SectionType[];
  onOrderChange: (newOrder: SectionType[]) => void;
}

const sectionLabels: Record<SectionType, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  courses: "Courses",
  internships: "Internships",
  hobbies: "Hobbies & Interests",
  references: "References",
  awards: "Awards",
  volunteering: "Volunteering",
  certifications: "Certifications",
  projects: "Projects",
  publications: "Publications",
  strengths: "Strengths",
  industryExpertise: "Industry Expertise",
  philosophy: "Life Philosophy",
  books: "Books",
  socialLinks: "Find Me Online",
  custom: "Custom Sections",
};

export default function SectionOrderManager({
  sectionOrder,
  activeSections,
  onOrderChange,
}: SectionOrderManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const draggedIndexRef = useRef<number | null>(null);

  const visibleSections = sectionOrder.filter((s) => activeSections.includes(s));

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedIndexRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    const fromIndex = draggedIndexRef.current;
    const toIndex = dropTargetIndex;
    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      const newOrder = [...sectionOrder];
      const draggedSection = visibleSections[fromIndex];
      const targetSection = visibleSections[toIndex];
      const draggedFullIndex = newOrder.indexOf(draggedSection);
      const targetFullIndex = newOrder.indexOf(targetSection);
      newOrder.splice(draggedFullIndex, 1);
      newOrder.splice(targetFullIndex > draggedFullIndex ? targetFullIndex : targetFullIndex, 0, draggedSection);
      onOrderChange(newOrder);
    }
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndexRef.current !== null && draggedIndexRef.current !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndexRef.current !== null && draggedIndexRef.current !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const moveSection = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= visibleSections.length) return;
    const newOrder = [...sectionOrder];
    const fromSection = visibleSections[fromIndex];
    const toSection = visibleSections[toIndex];
    const fromFullIndex = newOrder.indexOf(fromSection);
    const toFullIndex = newOrder.indexOf(toSection);
    [newOrder[fromFullIndex], newOrder[toFullIndex]] = [newOrder[toFullIndex], newOrder[fromFullIndex]];
    onOrderChange(newOrder);
  };

  if (visibleSections.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Section Order
      </h3>
      <p className="text-xs text-gray-500 mb-3">Drag sections to reorder them in your resume</p>
      <div className="space-y-1">
        {visibleSections.map((section, index) => (
          <div
            key={section}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDrop={handleDrop}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all select-none ${
              draggedIndex === index ? "opacity-50 bg-blue-100 cursor-grabbing" : "bg-gray-50 hover:bg-gray-100 cursor-grab"
            } ${dropTargetIndex === index && draggedIndex !== index ? "ring-2 ring-blue-500 ring-offset-1 bg-blue-50 scale-[1.02]" : ""}`}
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            <span className="text-sm text-gray-700 flex-1 pointer-events-none">{sectionLabels[section]}</span>
            <button onClick={(e) => { e.stopPropagation(); moveSection(index, "up"); }} disabled={index === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" draggable={false}>
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); moveSection(index, "down"); }} disabled={index === visibleSections.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" draggable={false}>
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
