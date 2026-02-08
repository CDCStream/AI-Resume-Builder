"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function ExecutiveDark({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-zinc-900 text-zinc-100 shadow-lg print:shadow-none">
      {/* Header */}
      <header className="p-10 border-b border-zinc-700">
        <div className="flex items-start gap-6">
          {basics?.image && (
            <img
              src={basics.image}
              alt={basics?.name || "Profile"}
              className="w-24 h-24 rounded-full object-cover border-2 border-amber-500"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {basics?.name || "Your Name"}
            </h1>
            <p className="text-xl text-amber-500 font-light mb-4">
              {basics?.label || "Professional Title"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
          {basics?.email && (
            <span className="flex items-center gap-2">
              <span className="text-amber-500">▪</span> {basics.email}
            </span>
          )}
          {basics?.phone && (
            <span className="flex items-center gap-2">
              <span className="text-amber-500">▪</span> {basics.phone}
            </span>
          )}
          {basics?.location?.city && (
            <span className="flex items-center gap-2">
              <span className="text-amber-500">▪</span>
              {basics.location.city}{basics.location.region && `, ${basics.location.region}`}
            </span>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Main content */}
        <main className="flex-1 p-10">
          {/* Summary */}
          {basics?.summary && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-3">
                Executive Summary
              </h2>
              <p className="text-zinc-300 leading-relaxed">
                {basics.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {work && work.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4">
                Professional Experience
              </h2>
              <div className="space-y-6">
                {work.map((job, index) => (
                  <div key={index} className="border-l-2 border-zinc-700 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job.position}</h3>
                        <p className="text-amber-500">{job.name}</p>
                      </div>
                      <span className="text-sm text-zinc-500 whitespace-nowrap">
                        {job.startDate} — {job.endDate || "Present"}
                      </span>
                    </div>
                    {job.highlights && (
                      <ul className="mt-3 space-y-2">
                        {job.highlights.map((h, idx) => (
                          <li key={idx} className="text-sm text-zinc-400 flex items-start">
                            <span className="mr-3 text-amber-500">◆</span>{h}
                          </li>
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
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-zinc-700 pl-4">
                    <h3 className="font-semibold text-white">{edu.institution}</h3>
                    <p className="text-sm text-zinc-400">{edu.studyType} in {edu.area}</p>
                    <p className="text-xs text-zinc-500">{edu.startDate} — {edu.endDate}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-64 bg-zinc-800/50 p-8">
          {/* Skills */}
          {skills && skills.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4">
                Expertise
              </h2>
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <h3 className="text-sm font-medium text-white mb-2">{skill.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {skill.keywords?.map((kw, idx) => (
                        <span key={idx} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4">
                Languages
              </h2>
              <div className="space-y-2">
                {languages.map((lang, index) => (
                  <LanguageDots
                    key={index}
                    language={lang.language || ""}
                    fluency={lang.fluency}
                    dotColor="#F59E0B"
                    textColor="text-zinc-300"
                    subTextColor="text-zinc-500"
                    emptyDotColor="#3F3F46"
                  />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

