"use client";

import { Resume } from "@/lib/types/resume";
import { LanguageDots } from "./LanguageDots";
import { formatDate } from "./utils";

interface TemplateProps {
  resume: Resume;
}

export default function CreativeGradient({ resume }: TemplateProps) {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise } = resume;

  return (
    <div className="resume-page w-[210mm] min-h-[297mm] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg print:shadow-none overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>

      <div className="relative p-10">
        {/* Header */}
        <header className="text-center mb-10">
          {basics?.image && (
            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-cyan-400/50">
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
          {(basics?.profiles?.find(p => p.network === "LinkedIn")?.url || basics?.profiles?.find(p => p.network === "GitHub")?.url) && (
            <div className="flex justify-center gap-6 text-sm mt-2">
              {basics?.profiles?.find(p => p.network === "LinkedIn")?.url && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  {basics.profiles.find(p => p.network === "LinkedIn")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              )}
              {basics?.profiles?.find(p => p.network === "GitHub")?.url && (
                <span className="flex items-center gap-1 text-slate-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  {basics.profiles.find(p => p.network === "GitHub")?.url?.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              )}
            </div>
          )}
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
                          <p className="text-cyan-400">{job.name}{(job.city || job.country) && <span className="text-cyan-300"> · {[job.city, job.country].filter(Boolean).join(", ")}</span>}</p>
                        </div>
                        <span className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                          {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                        </span>
                      </div>
                      {job.summary && (
                        <p className="text-sm text-slate-300 mb-2">{job.summary}</p>
                      )}
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

            {/* Internships */}
            {internships && internships.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded"></span>
                  Internships
                </h2>
                <div className="space-y-4">
                  {internships.map((intern, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white">{intern.position}</h3>
                          <p className="text-cyan-400">{intern.company}{(intern.city || intern.country) && <span className="text-cyan-300"> · {[intern.city, intern.country].filter(Boolean).join(", ")}</span>}</p>
                        </div>
                        <span className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                          {formatDate(intern.startDate)} — {formatDate(intern.endDate) || "Present"}
                        </span>
                      </div>
                      {intern.summary && (
                        <p className="text-sm text-slate-300">{intern.summary}</p>
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
                      <p className="text-sm text-slate-300">{edu.studyType}{edu.studyType && edu.area && " • "}{edu.area}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Awards */}
            {awards && awards.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded"></span>
                  Awards
                </h2>
                <div className="space-y-3">
                  {awards.map((award, index) => (
                    <div key={index} className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-bl-full transition-all group-hover:scale-110"></div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white">{award.title}</h3>
                          {award.awarder && <p className="text-amber-400 text-sm">{award.awarder}</p>}
                        </div>
                        {award.date && (
                          <span className="text-xs text-slate-400 bg-white/10 px-2 py-1 rounded-full">
                            {formatDate(award.date)}
                          </span>
                        )}
                      </div>
                      {award.summary && (
                        <p className="text-sm text-slate-300 italic">{award.summary}</p>
                      )}
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
                <div className="space-y-2">
                  {skills.filter(skill => skill.name).map((skill, index) => {
                    const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                    const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white">{skill.name}</span>
                          <span className="text-[10px] text-slate-400">{skill.level || "Intermediate"}</span>
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= filledDots ? "bg-cyan-400" : "bg-white/20"}`} />
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

            {/* Courses */}
            {courses && courses.length > 0 && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">📚 Courses</h2>
                <div className="space-y-2">
                  {courses.map((course, index) => (
                    <div key={index}>
                      <p className="font-medium text-white">{course.name}</p>
                      {course.institution && <p className="text-sm text-purple-300">{course.institution}</p>}
                      {(course.startDate || course.endDate) && (
                        <p className="text-xs text-slate-400">{formatDate(course.startDate)} — {formatDate(course.endDate)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hobbies */}
            {hobbies && hobbies.length > 0 && hobbies.some(h => h.name) && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">Hobbies & Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {hobbies.filter(h => h.name).map((hobby, index) => (
                    <span key={index} className="text-sm bg-white/10 text-cyan-300 px-3 py-1 rounded-full">{hobby.name}</span>
                  ))}
                </div>
              </section>
            )}

            {/* References */}
            {references && references.length > 0 && references.some(r => r.name) && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">References</h2>
                <div className="space-y-3">
                  {references.filter(r => r.name).map((ref, index) => (
                    <div key={index}>
                      <h3 className="font-bold text-white">{ref.name}</h3>
                      {(ref.role || ref.company) && (
                        <p className="text-sm text-slate-300">
                          {[ref.role, ref.company].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {(ref.email || ref.phone) && (
                        <p className="text-xs text-slate-400 mt-1">
                          {[ref.email, ref.phone].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {ref.reference && <p className="text-sm text-slate-300 mt-1">{ref.reference}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Publications */}
            {publications && publications.length > 0 && publications.some(p => p.name) && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">📖 Publications</h2>
                <div className="space-y-3">
                  {publications.filter(p => p.name).map((pub, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-white text-sm">{pub.name}</h3>
                      {pub.publisher && <p className="text-xs text-slate-300">{pub.publisher}</p>}
                      {pub.releaseDate && <p className="text-xs text-slate-400 mt-1">{formatDate(pub.releaseDate)}</p>}
                      {pub.summary && <p className="text-sm text-slate-300 mt-1">{pub.summary}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && projects.some(p => p.name) && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">💻 Projects</h2>
                <div className="space-y-3">
                  {projects.filter(p => p.name).map((project, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-white text-sm">{project.name}</h3>
                      {(project.startDate || project.endDate) && <p className="text-xs text-slate-400 mt-1">{formatDate(project.startDate)} {project.endDate ? `— ${formatDate(project.endDate)}` : ""}</p>}
                      {project.description && <p className="text-sm text-slate-300 mt-1">{project.description}</p>}
                      {project.url && <a href={project.url} className="text-xs text-cyan-400 mt-1 block">{project.url}</a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {certificates && certificates.length > 0 && certificates.some(c => c.name) && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">🏅 Certifications</h2>
                <div className="space-y-3">
                  {certificates.filter(c => c.name).map((cert, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-white text-sm">{cert.name}</h3>
                      {cert.issuer && <p className="text-xs text-slate-300">{cert.issuer}</p>}
                      {(cert.date || cert.endDate) && (
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(cert.date)}{cert.endDate ? ` — ${formatDate(cert.endDate)}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Volunteering */}
            {volunteer && volunteer.length > 0 && volunteer.some(v => v.organization) && (
              <section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                <h2 className="text-sm font-bold mb-3 text-cyan-400">🤝 Volunteering</h2>
                <div className="space-y-3">
                  {volunteer.filter(v => v.organization).map((vol, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-white text-sm">{vol.organization}</h3>
                      {vol.position && <p className="text-xs text-slate-300">{vol.position}</p>}
                      {(vol.startDate || vol.endDate) && (
                        <p className="text-xs text-slate-400 mt-1">
                          {[vol.startDate, vol.endDate].filter(Boolean).join(" - ")}
                        </p>
                      )}
                      {vol.summary && <p className="text-sm text-slate-300 mt-1">{vol.summary}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {strengths && strengths.length > 0 && strengths.some(s => s.name) && (<section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10"><h2 className="text-sm font-bold mb-3 text-cyan-400">💪 Strengths</h2><div className="space-y-3">{strengths.filter(s => s.name).map((s, i) => (<div key={i}><h3 className="font-semibold text-white text-sm">{s.name}</h3>{s.description && <p className="text-sm text-slate-300 mt-1">{s.description}</p>}</div>))}</div></section>)}
            {industryExpertise && industryExpertise.length > 0 && industryExpertise.some(e => e.name) && (<section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10"><h2 className="text-sm font-bold mb-3 text-cyan-400">🎯 Industry Expertise</h2><div className="space-y-2">{industryExpertise.filter(e => e.name).map((e, i) => (<div key={i}><div className="flex justify-between text-sm"><span className="font-medium text-white">{e.name}</span><span className="text-slate-400">{e.level}</span></div><div className="w-full bg-white/10 rounded-full h-1.5 mt-1"><div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: e.level === 'Expert' ? '100%' : e.level === 'Advanced' ? '75%' : e.level === 'Intermediate' ? '50%' : '25%' }}></div></div></div>))}</div></section>)}
            {philosophy && philosophy.quote && (<section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10"><h2 className="text-sm font-bold mb-3 text-cyan-400">💭 My Life Philosophy</h2><blockquote className="italic text-slate-300 border-l-2 border-cyan-400/30 pl-3">&ldquo;{philosophy.quote}&rdquo;</blockquote>{philosophy.author && <p className="text-sm text-slate-400 mt-2 text-right">— {philosophy.author}</p>}</section>)}
            {books && books.length > 0 && books.some(b => b.title) && (<section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10"><h2 className="text-sm font-bold mb-3 text-cyan-400">📚 Books</h2><div className="space-y-2">{books.filter(b => b.title).map((b, i) => (<div key={i}><h3 className="font-semibold text-white text-sm">{b.title}</h3>{b.author && <p className="text-xs text-slate-400">{b.author}</p>}</div>))}</div></section>)}
            {socialLinks && socialLinks.length > 0 && socialLinks.some(l => l.network) && (<section className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10"><h2 className="text-sm font-bold mb-3 text-cyan-400">🌐 Find Me Online</h2><div className="space-y-2">{socialLinks.filter(l => l.network).map((l, i) => (<div key={i} className="flex items-center gap-2"><span className="font-semibold text-white text-sm">{l.network}</span>{l.username && <span className="text-sm text-slate-400">{l.username}</span>}</div>))}</div></section>)}

            {/* Custom Sections */}
            {customSections && customSections.length > 0 && customSections.map((section, index) => (
              section.title && (
                <section key={index} className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
                  <h2 className="text-sm font-bold mb-3 text-cyan-400">✨ {section.title}</h2>
                  {section.content && (
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{section.content}</p>
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

