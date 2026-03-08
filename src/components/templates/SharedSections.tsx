"use client";

import { Resume, SectionType, defaultSectionOrder } from "@/lib/types/resume";
import { LanguageGrid } from "./LanguageDots";
import { formatDate } from "./utils";
import { ReactNode, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface ThemeConfig {
  headingClass: string;
  textClass: string;
  subTextClass: string;
  accentColor: string;    // for dots, borders, etc.
  dotFilledClass: string;
  dotEmptyClass: string;
  tagClass: string;
  cardClass?: string;
  titleClass?: string;    // for item titles (job position, school name, etc.)
  /** If true, experience items won't have break-inside:avoid, allowing page splits within experience */
  allowExperienceSplit?: boolean;
}

export const defaultTheme: ThemeConfig = {
  headingClass: "text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3",
  textClass: "text-sm text-gray-600",
  subTextClass: "text-xs text-gray-500",
  titleClass: "font-semibold text-gray-900",
  accentColor: "#3B82F6",
  dotFilledClass: "bg-blue-500",
  dotEmptyClass: "bg-gray-300",
  tagClass: "px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700",
  cardClass: "",
  allowExperienceSplit: true,
};

export function useOrderedSections(resume: Resume) {
  return useMemo(() => {
    const order = resume.sectionOrder || defaultSectionOrder;
    const missing = defaultSectionOrder.filter((s) => !order.includes(s));
    return missing.length > 0 ? [...order, ...missing] : order;
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
  const { basics, work, education, skills, languages, courses, customSections, internships, activities, hobbies, references, awards, volunteer, certificates, projects, publications, strengths, philosophy, books, digitalPortfolio, socialLinks, industryExpertise } = resume;

  const tc = t.titleClass || "font-semibold text-gray-900";

  switch (sectionType) {
    case "summary":
      if (!basics?.summary) return null;
      return (
        <section key="summary" className="mb-6" data-section="summary" data-splittable="true">
          <h2 className={t.headingClass}>Summary</h2>
          <p className={`${t.textClass} leading-relaxed`}>{basics.summary}</p>
        </section>
      );

    case "experience":
      if (!work || work.length === 0) return null;
      return (
        <section key="experience" className="mb-6" data-section="experience" data-splittable={t.allowExperienceSplit !== false ? "true" : undefined}>
          <h2 className={t.headingClass}>Experience</h2>
          <div className="space-y-4">
            {work.map((job, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className={tc}>{job.position}</h3>
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
                        <span className="mr-2" style={{ color: t.accentColor }}>•</span>{h}
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
        <section key="internships" className="mb-6" data-section="internships" data-splittable="true">
          <h2 className={t.headingClass}>Internships</h2>
          <div className="space-y-4">
            {internships.map((intern, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className={tc}>{intern.position}</h3>
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

    case "activities":
      if (!activities || activities.length === 0) return null;
      return (
        <section key="activities" className="mb-6" data-section="activities" data-splittable="true">
          <h2 className={t.headingClass}>Extra-curricular Activities</h2>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={tc}>{activity.name}</h3>
                    {activity.role && <p className={t.textClass}>{activity.role}</p>}
                    {activity.description && <p className={`${t.textClass} mt-1`}>{activity.description}</p>}
                  </div>
                  {(activity.startDate || activity.endDate) && (
                    <span className={`${t.subTextClass} whitespace-nowrap`}>
                      {formatDate(activity.startDate)} — {formatDate(activity.endDate) || "Present"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "education":
      if (!education || education.length === 0) return null;
      return (
        <section key="education" className="mb-6" data-section="education" data-splittable="true">
          <h2 className={t.headingClass}>Education</h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={tc}>{edu.institution}</h3>
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
        <section key="awards" className="mb-6" data-section="awards" data-splittable="true">
          <h2 className={t.headingClass}>Awards</h2>
          <div className="space-y-3">
            {awards.map((award, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={tc}>{award.title}</h3>
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
      const filteredSkills = skills.filter(skill => skill.name);
      const skillRows: typeof filteredSkills[] = [];
      for (let i = 0; i < filteredSkills.length; i += 2) {
        skillRows.push(filteredSkills.slice(i, i + 2));
      }
      return (
        <section key="skills" className="mb-6" data-section="skills" data-splittable="true">
          <h2 className={t.headingClass}>Skills</h2>
          <div className="space-y-3">
            {skillRows.map((row, rowIndex) => (
              <div key={rowIndex} className="resume-item grid grid-cols-2 gap-x-8" data-skill-row={rowIndex} >
                {row.map((skill, colIndex) => {
                  const levelMap: Record<string, number> = { "Expert": 5, "Advanced": 4, "Intermediate": 3, "Beginner": 2, "Basic": 1 };
                  const filledDots = levelMap[skill.level || "Intermediate"] || 3;
                  return (
                    <div key={colIndex} className="pb-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${tc}`}>{skill.name}</span>
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
            ))}
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
        <section key="courses" className="mb-6" data-section="courses" data-splittable="true">
          <h2 className={t.headingClass}>Courses</h2>
          <div className="space-y-3">
            {courses.map((course, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={tc}>{course.name}</h3>
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
        <section key="references" className="mb-6" data-section="references" data-splittable="true">
          <h2 className={t.headingClass}>References</h2>
          <div className="grid grid-cols-2 gap-4">
            {references.map((ref, index) => (
              <div key={index} className={`resume-item p-3 rounded-lg ${t.cardClass || "border border-gray-200"}`} >
                <h3 className={tc}>{ref.name}</h3>
                {ref.role && <p className={t.textClass}>{ref.role}</p>}
                {ref.company && <p className={t.subTextClass}>{ref.company}</p>}
                {ref.email && <p className="text-xs" style={{ color: t.accentColor }}>{ref.email}</p>}
                {ref.phone && <p className={t.subTextClass}>{ref.phone}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "publications":
      if (!publications || publications.length === 0) return null;
      return (
        <section key="publications" className="mb-6" data-section="publications" data-splittable="true">
          <h2 className={t.headingClass}>Publications</h2>
          <div className="space-y-3">
            {publications.map((pub, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <h3 className={`${tc} text-sm`}>{pub.name}</h3>
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
        <section key="projects" className="mb-6" data-section="projects" data-splittable="true">
          <h2 className={t.headingClass}>Projects</h2>
          <div className="space-y-3">
            {projects.filter(p => p.name).map((project, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <h3 className={`${tc} text-sm`}>{project.name}</h3>
                {(project.startDate || project.endDate) && (
                  <p className={`${t.subTextClass} mt-1`}>
                    {formatDate(project.startDate)} {project.endDate ? `— ${formatDate(project.endDate)}` : ""}
                  </p>
                )}
                {project.description && <p className={`${t.textClass} mt-1`}>{project.description}</p>}
                {project.url && <a href={project.url} className="text-xs mt-1 block" style={{ color: t.accentColor }}>{project.url}</a>}
              </div>
            ))}
          </div>
        </section>
      );

    case "certifications":
      if (!certificates || certificates.length === 0 || !certificates.some(c => c.name)) return null;
      return (
        <section key="certifications" className="mb-6" data-section="certifications" data-splittable="true">
          <h2 className={t.headingClass}>Certifications</h2>
          <div className="space-y-3">
            {certificates.filter(c => c.name).map((cert, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <h3 className={`${tc} text-sm`}>{cert.name}</h3>
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
        <section key="volunteering" className="mb-6" data-section="volunteering" data-splittable="true">
          <h2 className={t.headingClass}>Volunteering</h2>
          <div className="space-y-3">
            {volunteer.filter(v => v.organization).map((vol, index) => (
              <div key={index} className={`resume-item ${t.cardClass || ""}`} >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={tc}>{vol.organization}</h3>
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
              <div key={index} className={`resume-item p-3 rounded-lg ${t.cardClass || "bg-gray-50"}`} >
                <h3 className={`${tc} text-sm`}>{strength.name}</h3>
                {strength.description && <p className={`${t.subTextClass} mt-1`}>{strength.description}</p>}
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
          <blockquote className="border-l-4 pl-4 italic" style={{ borderColor: t.accentColor }}>
            <span className={t.textClass}>&ldquo;{philosophy.quote}&rdquo;</span>
            {philosophy.author && <cite className={`block text-sm mt-1 not-italic ${t.subTextClass}`}>— {philosophy.author}</cite>}
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
              <div key={index} className="resume-item flex gap-2" >
                <span>📚</span>
                <div>
                  <p className={`text-sm font-medium ${tc}`}>{book.title}</p>
                  {book.author && <p className={t.subTextClass}>{book.author}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "digitalPortfolio":
      if (!digitalPortfolio || digitalPortfolio.length === 0 || !digitalPortfolio.some(d => d.url || d.platform)) return null;
      return (
        <section key="digitalPortfolio" className="mb-6" data-section="digitalPortfolio">
          <h2 className={t.headingClass}>Digital Portfolio</h2>
          <div className="space-y-2">
            {digitalPortfolio.filter(d => d.url || d.platform).map((item, index) => (
              <div key={index}>
              <div className={`resume-item flex items-center gap-3 ${t.cardClass || ""}`}>
                <span className="shrink-0 w-5 h-5 text-gray-500">
                  {item.platform === "GitHub" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  ) : item.platform === "Behance" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/></svg>
                  ) : item.platform === "Medium" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>
                  ) : item.platform === "Dribbble" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.81zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zm7.275-7.534c.282.386 2.145 2.916 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-2.4-2.135-5.568-3.43-9.01-3.43-.063 0-.124.002-.186.005l.001.127z"/></svg>
                  ) : item.platform === "Kaggle" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.233-.035.257l-6.555 6.344 6.836 8.507c.095.104.117.208.074.312z"/></svg>
                  ) : item.platform === "StackOverflow" ? (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 21H3v-8.7h1.5v7.2h9V12.3H15V21zm3.6-14.19l-1.09 1.32 5.3 4.37 1.09-1.32-5.3-4.37zm2.26 6.72l-.6 1.58 6.02 2.3.6-1.58-6.02-2.3zM18.15 2.69l-1.38.93 3.72 5.5 1.38-.93-3.72-5.5zm-1.66 13.83l.09 1.7 6.14-.33-.09-1.7-6.14.33zM5 17.6h8V16H5v1.6z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-700 hover:underline truncate">
                        {item.label || item.platform || item.url}
                      </a>
                    ) : (
                      <span className={`text-sm font-medium ${t.textClass}`}>{item.label || item.platform}</span>
                    )}
                    {item.trustScore !== undefined && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        item.trustScore >= 70 ? "bg-green-100 text-green-700" :
                        item.trustScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {item.trustLevel || `${item.trustScore}/100`}
                      </span>
                    )}
                  </div>
                  {item.stats && (
                    <p className={`${t.subTextClass} text-[11px] mt-0.5`}>
                      {item.stats.repos} repos · <svg className="w-3 h-3 inline-block align-text-bottom text-amber-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg> {item.stats.stars?.toLocaleString()} · {item.stats.followers} followers
                    </p>
                  )}
                </div>
                {item.url && (
                  <div className="shrink-0 ml-2">
                    <QRCodeSVG value={item.url} size={36} level="L" />
                  </div>
                )}
              </div>
              {item.stats?.topRepos && item.stats.topRepos.length > 0 && (
                <div className="mt-1.5 ml-8 space-y-1">
                  {item.stats.topRepos.map((repo, ri) => (
                    <div key={ri} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-semibold ${t.textClass} truncate`}>{repo.name}</span>
                        {repo.language && (
                          <span className={`${t.subTextClass} shrink-0`}>{repo.language}</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-3 shrink-0 ${t.subTextClass}`}>
                        <span className="flex items-center gap-0.5"><svg className="w-3 h-3 text-amber-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>{repo.stars?.toLocaleString()}</span>
                        <span className="flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 10 0-1.5.75.75 0 000 1.5zM8 12.75a.75.75 0 10 0-1.5.75.75 0 000 1.5z"/></svg>{repo.forks?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
