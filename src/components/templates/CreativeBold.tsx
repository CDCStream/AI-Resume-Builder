"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function CreativeBold({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-amber-50 shadow-lg print:shadow-none">
      {/* Header */}
      <header className="bg-orange-600 text-white p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-700 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative flex items-start gap-6">
          {basics?.image && (
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/40">
              <img
                src={basics.image}
                alt={basics.name || "Profile"}
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${basics.imagePosition?.x || 0}%, ${basics.imagePosition?.y || 0}%) scale(${basics.imagePosition?.scale || 1})`,
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-black tracking-tight mb-1">
              {basics?.name?.toUpperCase() || "YOUR NAME"}
            </h1>
            <p className="text-orange-200 text-xl font-medium mb-4">{basics?.label || "Professional Title"}</p>
            <div className="flex flex-wrap gap-4 text-sm text-orange-100">
              {basics?.email && <span>✉ {basics.email}</span>}
              {basics?.phone && <span>☎ {basics.phone}</span>}
              {basics?.location?.city && (
                <span>📍 {basics.location.city}{basics.location.region && `, ${basics.location.region}`}</span>
              )}
            </div>
            {(basics?.profiles?.find(p => p.network === "LinkedIn")?.url || basics?.profiles?.find(p => p.network === "GitHub")?.url) && (
              <div className="flex flex-wrap gap-4 text-sm mt-2">
                {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
                  <span className="flex items-center gap-1 text-white">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                )}
                {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
                  <span className="flex items-center gap-1 text-orange-100">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Summary */}
        {basics?.summary && (
          <section className="mb-8 -mt-6 relative z-10">
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-600">
              <p className="text-gray-700 leading-relaxed">{basics.summary}</p>
            </div>
          </section>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Experience */}
            {work && work.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-orange-600 mb-4">EXPERIENCE</h2>
                <div className="space-y-4">
                  {work.map((job, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{job.position}</h3>
                          <p className="text-orange-600 font-medium">{job.name}{(job.city || job.country) && <span className="text-orange-400"> · {[job.city, job.country].filter(Boolean).join(", ")}</span>}</p>
                        </div>
                        <span className="text-sm text-white bg-orange-600 px-3 py-1 rounded-full">
                          {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                        </span>
                      </div>
                      {job.summary && (
                        <p className="text-sm text-gray-600 mb-2">{job.summary}</p>
                      )}
                      {job.highlights && (
                        <ul className="mt-3 space-y-1">
                          {job.highlights.map((h, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2 text-orange-500 font-bold">→</span>{h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Internships */}
            {internships && internships.length > 0 && (
              <section className="mb-6">
                <h2 className="text-2xl font-black text-orange-600 mb-4">INTERNSHIPS</h2>
                <div className="space-y-4">
                  {internships.map((intern, index) => (
                    <div key={index} className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{intern.position}</h3>
                          <p className="text-orange-600 font-medium">{intern.company}{(intern.city || intern.country) && <span className="text-orange-400"> · {[intern.city, intern.country].filter(Boolean).join(", ")}</span>}</p>
                        </div>
                        <span className="text-sm text-white bg-orange-600 px-3 py-1 rounded-full">
                          {formatDate(intern.startDate)} — {formatDate(intern.endDate) || "Present"}
                        </span>
                      </div>
                      {intern.summary && (
                        <p className="text-sm text-gray-600">{intern.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-orange-600 mb-4">EDUCATION</h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                      <p className="text-gray-600">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                      <p className="text-sm text-orange-500 mt-1">{formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Awards */}
            {awards && awards.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-orange-600 mb-4">AWARDS</h2>
                <div className="space-y-3">
                  {awards.map((award, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-r-4 border-orange-500 text-right">
                      <h3 className="font-bold text-gray-900 text-lg">{award.title}</h3>
                      {award.awarder && <p className="text-orange-600 font-medium">{award.awarder}</p>}
                      {award.date && <p className="text-sm text-orange-400 mt-1">{formatDate(award.date)}</p>}
                      {award.summary && <p className="text-sm text-gray-600 mt-2 italic">{award.summary}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {skills && skills.length > 0 && (
              <section className="bg-orange-600 text-white p-4 rounded-xl">
                <h2 className="text-lg font-black mb-3">SKILLS</h2>
                <div className="space-y-2">
                  {skills.filter(skill => skill.name).map((skill, index) => {
                    const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                    const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white">{skill.name}</span>
                          <span className="text-xs text-orange-100">{skill.level || "Intermediate"}</span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <div key={dot} className={`w-2 h-2 rounded-full ${dot <= filledDots ? "bg-white" : "bg-white/30"}`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <section className="bg-white p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-black text-orange-600 mb-3">LANGUAGES</h2>
                <div className="space-y-2">
                  {languages.map((lang, index) => (
                    <LanguageDots
                      key={index}
                      language={lang.language || ""}
                      fluency={lang.fluency}
                      dotColor="#F97316"
                      textColor="text-gray-700"
                      subTextColor="text-gray-500"
                      emptyDotColor="#E5E7EB"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Courses */}
            {courses && courses.length > 0 && (
              <section className="bg-white p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-black text-orange-600 mb-3">COURSES</h2>
                <div className="space-y-2">
                  {courses.map((course, index) => (
                    <div key={index}>
                      <p className="font-bold text-gray-800">{course.name}</p>
                      {course.institution && <p className="text-sm text-gray-600">{course.institution}</p>}
                      {(course.startDate || course.endDate) && (
                        <p className="text-xs text-gray-500">{formatDate(course.startDate)} — {formatDate(course.endDate)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hobbies */}
            {hobbies && hobbies.length > 0 && hobbies.some(h => h.name) && (
              <section className="bg-white p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-black text-orange-600 mb-3">HOBBIES & INTERESTS</h2>
                <div className="flex flex-wrap gap-2">
                  {hobbies.filter(h => h.name).map((hobby, index) => (
                    <span key={index} className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">{hobby.name}</span>
                  ))}
                </div>
              </section>
            )}

            {/* References */}
            {references && references.length > 0 && references.some(r => r.name) && (
              <section className="bg-white p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-black text-orange-600 mb-3">REFERENCES</h2>
                <div className="space-y-3">
                  {references.filter(r => r.name).map((ref, index) => (
                    <div key={index} className="border-l-2 border-orange-400 pl-3">
                      <h3 className="font-bold text-gray-900">{ref.name}</h3>
                      {(ref.role || ref.company) && (
                        <p className="text-sm text-gray-700">
                          {[ref.role, ref.company].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {(ref.email || ref.phone) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {[ref.email, ref.phone].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {ref.reference && <p className="text-sm text-gray-600 mt-1">{ref.reference}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Custom Sections */}
            {customSections && customSections.length > 0 && customSections.map((section, index) => (
              section.title && (
                <section key={index} className="bg-white p-4 rounded-xl shadow-sm">
                  <h2 className="text-lg font-black text-orange-600 mb-3">{section.title.toUpperCase()}</h2>
                  {section.content && (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
                  )}
                </section>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

