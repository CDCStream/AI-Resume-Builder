"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";

interface TemplateProps {
  resume: Resume;
}

export default function CreativeGradient({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg print:shadow-none overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>

      <div className="relative p-10">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {basics?.name || "Your Name"}
          </h1>
          <p className="text-xl text-cyan-300 mb-4">{basics?.label || "Professional Title"}</p>
          <div className="flex justify-center gap-6 text-sm text-slate-300">
            {basics?.email && <span>{basics.email}</span>}
            {basics?.phone && <span>{basics.phone}</span>}
            {basics?.location?.city && (
              <span>{basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
            )}
          </div>
        </header>

        {/* Summary */}
        {basics?.summary && (
          <section className="mb-8 text-center max-w-2xl mx-auto">
            <p className="text-slate-300 leading-relaxed italic">"{basics.summary}"</p>
          </section>
        )}

        <div className="grid grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="col-span-3 space-y-8">
            {/* Experience */}
            {work && work.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded"></span>
                  Experience
                </h2>
                <div className="space-y-5">
                  {work.map((job, index) => (
                    <div key={index} className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white">{job.position}</h3>
                          <p className="text-cyan-400">{job.name}</p>
                        </div>
                        <span className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                          {job.startDate} — {job.endDate || "Present"}
                        </span>
                      </div>
                      {job.highlights && (
                        <ul className="mt-3 space-y-1">
                          {job.highlights.map((h, idx) => (
                            <li key={idx} className="text-sm text-slate-300 flex items-start">
                              <span className="mr-2 text-cyan-400">◆</span>{h}
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
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded"></span>
                  Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index} className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                      <h3 className="font-bold text-white">{edu.institution}</h3>
                      <p className="text-sm text-slate-300">{edu.studyType} in {edu.area}</p>
                      <p className="text-xs text-slate-400 mt-1">{edu.startDate} — {edu.endDate}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-2 space-y-6">
            {/* Skills */}
            {skills && skills.length > 0 && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">⚡ Skills</h2>
                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index}>
                      <p className="text-xs font-medium text-white mb-1">{skill.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.keywords?.map((kw, idx) => (
                          <span key={idx} className="text-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
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
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-purple-400">🌍 Languages</h2>
                <div className="space-y-2">
                  {languages.map((lang, index) => (
                    <LanguageDots
                      key={index}
                      language={lang.language || ""}
                      fluency={lang.fluency}
                      dotColor="#A78BFA"
                      textColor="text-white"
                      subTextColor="text-purple-300"
                      emptyDotColor="#4C1D95"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

