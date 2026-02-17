"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { LanguageGrid } from "./LanguageDots";
import { formatDate } from "./utils";
import { ReactNode, useMemo } from "react";

export interface ThemeConfig {
  headingClass: string;
  textClass: string;
  subTextClass: string;
  accentColor: string;    // for dots, borders, etc.
  dotFilledClass: string;
  dotEmptyClass: string;
  tagClass: string;
  cardClass?: string;
  /** If true, experience items won't have break-inside:avoid, allowing page splits within experience */
  allowExperienceSplit?: boolean;
}

export const defaultTheme: ThemeConfig = {
  headingClass: "text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3",
  textClass: "text-sm text-gray-600",
  subTextClass: "text-xs text-gray-500",
  accentColor: "#3B82F6",
  dotFilledClass: "bg-blue-500",
  dotEmptyClass: "bg-gray-300",
  tagClass: "px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700",
  cardClass: "",
};

export function useOrderedSections(resume: Resume) {
  return useMemo(() => {
    return resume.sectionOrder || defaultSectionOrder;
  }, [resume.sectionOrder]);
}

export function renderSections(
  resume: Resume,
  orderedSections: SectionType[],
  theme: ThemeConfig = defaultTheme
): ReactNode[] {
  return orderedSections.map((sectionType) => renderSection(resume, sectionType, theme)).filter(Boolean) as ReactNode[];
}

function renderSection(resume: Resume, sectionType: SectionType, t: ThemeConfig): ReactNode {
  const { basics, work, education, skills, languages, courses, customSections, internships, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, socialLinks, industryExpertise } = resume;

  switch (sectionType) {
    case "summary":
      if (!basics?.summary) return null;
      return (
        <section key="summary" className="mb-6" data-section="summary">
          <h2 className={t.headingClass}>Summary</h2>
          <p className={`${t.textClass} leading-relaxed`}>{basics.summary}</p>
        </section>
      );

    case "experience":
      if (!work || work.length === 0) return null;
      return (
        <section key="experience" className="mb-6" data-section="experience" data-splittable={t.allowExperienceSplit ? "true" : undefined}>
          <h2 className={t.headingClass}>Experience</h2>
          <div className="space-y-4">
            {work.map((job, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={t.allowExperienceSplit ? {} : { breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.position}</h3>
                    <p className={t.textClass}>
                      {job.name}
                      {(job.city || job.country) && <span className={t.subTextClass}> · {[job.city, job.country].filter(Boolean).join(", ")}</span>}
                    </p>
                  </div>
                  <span className={`${t.subTextClass} whitespace-nowrap`}>
                    {formatDate(job.startDate)} — {formatDate(job.endDate) || "Present"}
                  </span>
                </div>
                {job.summary && <p className={`${t.textClass} mt-1`}>{job.summary}</p>}
                {job.highlights && job.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {job.highlights.map((h, idx) => (
                      <li key={idx} className={`${t.textClass} flex items-start`}>
                        <span className="mr-2 text-gray-400">•</span>{h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case "internships":
      if (!internships || internships.length === 0) return null;
      return (
        <section key="internships" className="mb-6" data-section="internships">
          <h2 className={t.headingClass}>Internships</h2>
          <div className="space-y-4">
            {internships.map((intern, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900">{intern.position}</h3>
                    <p className={t.textClass}>
                      {intern.company}
                      {(intern.city || intern.country) && <span className={t.subTextClass}> · {[intern.city, intern.country].filter(Boolean).join(", ")}</span>}
                    </p>
                  </div>
                  <span className={`${t.subTextClass} whitespace-nowrap`}>
                    {formatDate(intern.startDate)} — {formatDate(intern.endDate) || "Present"}
                  </span>
                </div>
                {intern.summary && <p className={`${t.textClass} mt-1`}>{intern.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "education":
      if (!education || education.length === 0) return null;
      return (
        <section key="education" className="mb-6" data-section="education">
          <h2 className={t.headingClass}>Education</h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.institution}</h3>
                    <p className={t.textClass}>
                      {edu.studyType && <span className="font-medium">{edu.studyType}</span>}
                      {edu.studyType && edu.area && " • "}
                      {edu.area}
                    </p>
                  </div>
                  <span className={`${t.subTextClass} whitespace-nowrap`}>
                    {formatDate(edu.startDate)} — {formatDate(edu.endDate) || "Present"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "awards":
      if (!awards || awards.length === 0) return null;
      return (
        <section key="awards" className="mb-6" data-section="awards">
          <h2 className={t.headingClass}>Awards</h2>
          <div className="space-y-3">
            {awards.map((award, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{award.title}</h3>
                    {award.awarder && <p className={t.textClass}>{award.awarder}</p>}
                    {award.summary && <p className={`${t.textClass} mt-1`}>{award.summary}</p>}
                  </div>
                  {award.date && <span className={`${t.subTextClass} whitespace-nowrap`}>{formatDate(award.date)}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "skills":
      if (!skills || skills.length === 0) return null;
      return (
        <section key="skills" className="mb-6" data-section="skills">
          <h2 className={t.headingClass}>Skills</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {skills.filter(skill => skill.name).map((skill, index) => {
              const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
              const filledDots = levelMap[skill.level || "Intermediate"] || 3;
              return (
                <div key={index} className="resume-item">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{skill.name}</span>
                    <span className={t.subTextClass}>{skill.level || "Intermediate"}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div key={dot} className={`w-2 h-2 rounded-full ${dot <= filledDots ? t.dotFilledClass : t.dotEmptyClass}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );

    case "languages":
      if (!languages || languages.length === 0) return null;
      return (
        <section key="languages" className="mb-6" data-section="languages">
          <h2 className={t.headingClass}>Languages</h2>
          <LanguageGrid languages={languages} dotColor={t.accentColor} />
        </section>
      );

    case "courses":
      if (!courses || courses.length === 0) return null;
      return (
        <section key="courses" className="mb-6" data-section="courses">
          <h2 className={t.headingClass}>Courses</h2>
          <div className="space-y-3">
            {courses.map((course, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    {course.institution && <p className={t.textClass}>{course.institution}</p>}
                  </div>
                  {(course.startDate || course.endDate) && (
                    <span className={`${t.subTextClass} whitespace-nowrap`}>
                      {formatDate(course.startDate)} — {formatDate(course.endDate) || "Present"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "hobbies":
      if (!hobbies || hobbies.length === 0) return null;
      return (
        <section key="hobbies" className="mb-6" data-section="hobbies">
          <h2 className={t.headingClass}>Hobbies & Interests</h2>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((hobby, index) => (
              <span key={index} className={`resume-item ${t.tagClass}`}>{hobby.name}</span>
            ))}
          </div>
        </section>
      );

    case "references":
      if (!references || references.length === 0) return null;
      return (
        <section key="references" className="mb-6" data-section="references">
          <h2 className={t.headingClass}>References</h2>
          <div className="grid grid-cols-2 gap-4">
            {references.map((ref, index) => (
              <div key={index} className="resume-item p-3 border border-gray-200 rounded-lg" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h3 className="font-semibold text-gray-900">{ref.name}</h3>
                {ref.role && <p className={t.textClass}>{ref.role}</p>}
                {ref.company && <p className={t.subTextClass}>{ref.company}</p>}
                {ref.email && <p className="text-xs text-blue-500">{ref.email}</p>}
                {ref.phone && <p className={t.subTextClass}>{ref.phone}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "publications":
      if (!publications || publications.length === 0) return null;
      return (
        <section key="publications" className="mb-6" data-section="publications">
          <h2 className={t.headingClass}>Publications</h2>
          <div className="space-y-3">
            {publications.map((pub, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h3 className="font-semibold text-gray-900 text-sm">{pub.name}</h3>
                {pub.publisher && <p className={t.textClass}>{pub.publisher}</p>}
                {pub.releaseDate && <p className={t.subTextClass}>{formatDate(pub.releaseDate)}</p>}
                {pub.summary && <p className={`${t.textClass} mt-1`}>{pub.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "projects":
      if (!projects || projects.length === 0 || !projects.some(p => p.name)) return null;
      return (
        <section key="projects" className="mb-6" data-section="projects">
          <h2 className={t.headingClass}>Projects</h2>
          <div className="space-y-3">
            {projects.filter(p => p.name).map((project, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                {(project.startDate || project.endDate) && (
                  <p className={`${t.subTextClass} mt-1`}>
                    {formatDate(project.startDate)} {project.endDate ? `— ${formatDate(project.endDate)}` : ""}
                  </p>
                )}
                {project.description && <p className={`${t.textClass} mt-1`}>{project.description}</p>}
                {project.url && <a href={project.url} className="text-xs text-blue-500 mt-1 block">{project.url}</a>}
              </div>
            ))}
          </div>
        </section>
      );

    case "certifications":
      if (!certificates || certificates.length === 0 || !certificates.some(c => c.name)) return null;
      return (
        <section key="certifications" className="mb-6" data-section="certifications">
          <h2 className={t.headingClass}>Certifications</h2>
          <div className="space-y-3">
            {certificates.filter(c => c.name).map((cert, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                {cert.issuer && <p className={t.textClass}>{cert.issuer}</p>}
                {(cert.date || cert.endDate) && (
                  <p className={`${t.subTextClass} mt-1`}>
                    {formatDate(cert.date)}{cert.endDate ? ` — ${formatDate(cert.endDate)}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      );

    case "volunteering":
      if (!volunteer || volunteer.length === 0 || !volunteer.some(v => v.organization)) return null;
      return (
        <section key="volunteering" className="mb-6" data-section="volunteering">
          <h2 className={t.headingClass}>Volunteering</h2>
          <div className="space-y-3">
            {volunteer.filter(v => v.organization).map((vol, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vol.organization}</h3>
                    {vol.position && <p className={t.textClass}>{vol.position}</p>}
                    {vol.summary && <p className={`${t.textClass} mt-1`}>{vol.summary}</p>}
                  </div>
                  {(vol.startDate || vol.endDate) && (
                    <span className={`${t.subTextClass} whitespace-nowrap`}>
                      {formatDate(vol.startDate)} — {formatDate(vol.endDate) || "Present"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "strengths":
      if (!strengths || strengths.length === 0 || !strengths.some(s => s.name)) return null;
      return (
        <section key="strengths" className="mb-6" data-section="strengths">
          <h2 className={t.headingClass}>Strengths</h2>
          <div className="grid grid-cols-2 gap-3">
            {strengths.filter(s => s.name).map((strength, index) => (
              <div key={index} className="resume-item p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 text-sm">{strength.name}</h3>
                {strength.description && <p className="text-xs text-gray-600 mt-1">{strength.description}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "industryExpertise":
      if (!industryExpertise || industryExpertise.length === 0 || !industryExpertise.some(e => e.name)) return null;
      return (
        <section key="industryExpertise" className="mb-6" data-section="industryExpertise">
          <h2 className={t.headingClass}>Industry Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {industryExpertise.filter(e => e.name).map((expertise, index) => (
              <span key={index} className={`resume-item ${t.tagClass}`}>
                {expertise.name}{expertise.level && ` (${expertise.level})`}
              </span>
            ))}
          </div>
        </section>
      );

    case "philosophy":
      if (!philosophy?.quote) return null;
      return (
        <section key="philosophy" className="mb-6" data-section="philosophy">
          <h2 className={t.headingClass}>Life Philosophy</h2>
          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
            &ldquo;{philosophy.quote}&rdquo;
            {philosophy.author && <cite className="block text-sm text-gray-500 mt-1 not-italic">— {philosophy.author}</cite>}
          </blockquote>
        </section>
      );

    case "books":
      if (!books || books.length === 0 || !books.some(b => b.title)) return null;
      return (
        <section key="books" className="mb-6" data-section="books">
          <h2 className={t.headingClass}>Books</h2>
          <div className="grid grid-cols-2 gap-3">
            {books.filter(b => b.title).map((book, index) => (
              <div key={index} className="resume-item flex gap-2">
                <span className="text-gray-400">📚</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{book.title}</p>
                  {book.author && <p className={t.subTextClass}>{book.author}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "socialLinks":
      if (!socialLinks || socialLinks.length === 0 || !socialLinks.some(l => l.network)) return null;
      return (
        <section key="socialLinks" className="mb-6" data-section="socialLinks">
          <h2 className={t.headingClass}>Find Me Online</h2>
          <div className="flex flex-wrap gap-3">
            {socialLinks.filter(l => l.network).map((link, index) => (
              <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                className={`resume-item flex items-center gap-2 ${t.tagClass} hover:opacity-80 transition-opacity`}>
                <span className="font-medium">{link.network}</span>
                {link.username && <span className="text-gray-500">@{link.username}</span>}
              </a>
            ))}
          </div>
        </section>
      );

    case "custom":
      if (!customSections || customSections.length === 0 || !customSections.some(s => s.title)) return null;
      return (
        <div key="custom">
          {customSections.filter(s => s.title).map((section, index) => (
            <section key={index} className="mb-6" data-section={`custom-${index}`}>
              <h2 className={t.headingClass}>{section.title}</h2>
              <div className={`${t.textClass} leading-relaxed`}>{section.content}</div>
            </section>
          ))}
        </div>
      );

    default:
      return null;
  }
}
