"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageGrid } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function ClassicTraditional({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-white p-10 shadow-lg print:shadow-none font-['Times_New_Roman',serif]">
      {/* Header - Traditional centered */}
      <header className="text-center mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {basics?.name?.toUpperCase() || "YOUR NAME"}
        </h1>
        <p className="text-gray-600 text-lg mb-2">{basics?.label || "Professional Title"}</p>
        <div className="flex justify-center gap-4 text-sm text-gray-600">
          {basics?.email && <span>{basics.email}</span>}
          {basics?.phone && <span>| {basics.phone}</span>}
          {basics?.location?.city && (
            <span>| {basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {basics?.summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed text-justify">{basics.summary}</p>
        </section>
      )}

      {/* Experience */}
      {work && work.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 pb-1 mb-3">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {work.map((job, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900">{job.position}</h3>
                  <span className="text-sm text-gray-600">{job.startDate} — {job.endDate || "Present"}</span>
                </div>
                <p className="text-gray-700 italic mb-1">{job.name}</p>
                {job.highlights && (
                  <ul className="list-disc list-inside space-y-0.5">
                    {job.highlights.map((h, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 pb-1 mb-3">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-gray-900">{edu.institution}</span>
                  <span className="text-gray-700"> — {edu.studyType} in {edu.area}</span>
                </div>
                <span className="text-sm text-gray-600">{edu.startDate} — {edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 pb-1 mb-2">
            Technical Skills
          </h2>
          <div className="text-sm text-gray-700">
            {skills.map((skill, index) => (
              <p key={index}>
                <span className="font-semibold">{skill.name}:</span> {skill.keywords?.join(", ")}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-400 pb-1 mb-3">
            Languages
          </h2>
          <LanguageGrid
            languages={languages}
            dotColor="#374151"
            textColor="text-gray-900"
            subTextColor="text-gray-500"
            emptyDotColor="#D1D5DB"
            columns={2}
          />
        </section>
      )}
    </div>
  );
}

