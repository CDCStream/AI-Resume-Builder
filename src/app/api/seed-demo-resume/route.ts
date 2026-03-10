import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "fuatsezer22@gmail.com";

const sampleResumes = [
  {
    templateId: "professional-white",
    name: "Grace Hall — Marketing Manager",
    data: {
      basics: {
        name: "Grace Hall",
        label: "Marketing Manager",
        image: "/avatars/avatar-grace-hall.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "grace.hall@email.com",
        phone: "+1 (312) 555-0142",
        summary: "Results-driven Marketing Manager with 7+ years of experience leading omnichannel campaigns that drove $15M+ in pipeline growth. Expert in brand strategy, demand generation, and data-driven decision-making across B2B SaaS and e-commerce verticals.",
        location: { city: "Chicago", region: "IL", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "gracehall", url: "https://linkedin.com/in/gracehall" },
        ],
      },
      work: [
        {
          name: "HubSpot",
          position: "Senior Marketing Manager",
          startDate: "2022-01",
          endDate: "Present",
          highlights: [
            "Led a team of 8 to launch integrated campaigns generating 12K+ MQLs per quarter, exceeding targets by 35%",
            "Redesigned the content marketing strategy, increasing organic traffic by 65% and reducing CAC by 22%",
            "Managed $2.4M annual budget across paid media, events, and ABM programs",
          ],
          city: "Boston",
          country: "US",
        },
        {
          name: "Mailchimp",
          position: "Marketing Manager",
          startDate: "2019-03",
          endDate: "2021-12",
          highlights: [
            "Spearheaded product launch campaigns for 3 major feature releases, driving 40K+ sign-ups in first month",
            "Built and optimized email nurture sequences achieving 28% open rate and 4.2% CTR",
            "Partnered with sales to develop ABM playbooks targeting enterprise accounts, closing $3.2M in deals",
          ],
          city: "Atlanta",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Northwestern University",
          area: "Marketing & Communications",
          studyType: "Bachelor of Science",
          startDate: "2013-09",
          endDate: "2017-05",
          score: "3.85 GPA — Dean's List",
        },
      ],
      skills: [
        { name: "Marketing Strategy", keywords: ["Brand Strategy", "Demand Generation", "ABM", "Go-to-Market"] },
        { name: "Digital Marketing", keywords: ["Google Ads", "Meta Ads", "SEO/SEM", "Email Marketing"] },
        { name: "Analytics & Tools", keywords: ["HubSpot", "Google Analytics", "Salesforce", "Tableau"] },
        { name: "Leadership", keywords: ["Team Management", "Cross-functional Collaboration", "Budget Planning"] },
      ],
      certificates: [
        { name: "Google Analytics Certification", issuer: "Google", date: "2023-06" },
        { name: "HubSpot Inbound Marketing", issuer: "HubSpot Academy", date: "2022-01" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Spanish", fluency: "Conversational" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "modern-sidebar",
    name: "Aiden Williams — Full Stack Developer",
    data: {
      basics: {
        name: "Aiden Williams",
        label: "Full Stack Developer",
        image: "/avatars/avatar-aiden-williams.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "aiden.williams@email.com",
        phone: "+1 (646) 555-0198",
        summary: "Full Stack Developer with 5+ years of experience building scalable web applications using React, Node.js, and cloud-native architectures. Delivered high-traffic platforms serving 2M+ users with 99.9% uptime.",
        location: { city: "New York", region: "NY", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "aidenwilliams", url: "https://linkedin.com/in/aidenwilliams" },
          { network: "GitHub", username: "aiden-dev", url: "https://github.com/aiden-dev" },
        ],
      },
      work: [
        {
          name: "Stripe",
          position: "Senior Software Engineer",
          startDate: "2022-06",
          endDate: "Present",
          highlights: [
            "Architected a real-time payment processing dashboard serving 500K+ merchants with sub-200ms load times",
            "Led migration from monolithic architecture to microservices, reducing deployment failures by 70%",
            "Mentored 4 junior engineers and established code review standards adopted across the team",
          ],
          city: "San Francisco",
          country: "US",
        },
        {
          name: "Shopify",
          position: "Software Engineer",
          startDate: "2019-08",
          endDate: "2022-05",
          highlights: [
            "Built React-based storefront components used by 1.7M+ online stores globally",
            "Optimized GraphQL API layer, reducing average response time from 450ms to 120ms",
            "Implemented CI/CD pipelines with automated testing, achieving 95% code coverage",
          ],
          city: "Ottawa",
          country: "CA",
        },
      ],
      education: [
        {
          institution: "Georgia Institute of Technology",
          area: "Computer Science",
          studyType: "Bachelor of Science",
          startDate: "2015-08",
          endDate: "2019-05",
          score: "3.9 GPA — Honors",
        },
      ],
      skills: [
        { name: "Frontend", keywords: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux"] },
        { name: "Backend", keywords: ["Node.js", "Python", "PostgreSQL", "Redis", "GraphQL"] },
        { name: "DevOps & Cloud", keywords: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"] },
        { name: "Tools", keywords: ["Git", "Jira", "Figma", "Datadog", "Sentry"] },
      ],
      certificates: [
        { name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", date: "2023-02" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "French", fluency: "Elementary" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "creative-timeline",
    name: "Maeve Delaney — UX/UI Designer",
    data: {
      basics: {
        name: "Maeve Delaney",
        label: "Senior UX/UI Designer",
        image: "/avatars/avatar-maeve-delaney.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "maeve.delaney@email.com",
        phone: "+353 87 555 0127",
        summary: "Award-winning UX/UI Designer with 6+ years crafting intuitive digital experiences for fintech, healthcare, and SaaS products. Passionate about user research, design systems, and accessibility-first design.",
        location: { city: "Dublin", countryCode: "IE" },
        profiles: [
          { network: "LinkedIn", username: "maevedelaney", url: "https://linkedin.com/in/maevedelaney" },
        ],
      },
      work: [
        {
          name: "Figma",
          position: "Senior Product Designer",
          startDate: "2022-04",
          endDate: "Present",
          highlights: [
            "Designed the collaborative whiteboard feature (FigJam) used by 4M+ teams, increasing DAU by 32%",
            "Led user research studies with 200+ participants, translating insights into 15 high-impact design iterations",
            "Created and maintained a component library of 300+ reusable design tokens and patterns",
          ],
          city: "San Francisco",
          country: "US",
        },
        {
          name: "Intercom",
          position: "UX Designer",
          startDate: "2019-06",
          endDate: "2022-03",
          highlights: [
            "Redesigned the customer messaging platform, improving task completion rate by 45%",
            "Established accessibility standards (WCAG 2.1 AA) across all product interfaces",
            "Facilitated 50+ design sprints and workshops with cross-functional teams",
          ],
          city: "Dublin",
          country: "IE",
        },
      ],
      education: [
        {
          institution: "Royal College of Art",
          area: "Information Experience Design",
          studyType: "Master of Arts",
          startDate: "2017-09",
          endDate: "2019-06",
        },
        {
          institution: "Trinity College Dublin",
          area: "Interactive Media",
          studyType: "Bachelor of Arts",
          startDate: "2013-09",
          endDate: "2017-06",
        },
      ],
      skills: [
        { name: "Design Tools", keywords: ["Figma", "Sketch", "Adobe XD", "Framer", "Principle"] },
        { name: "UX Research", keywords: ["User Interviews", "Usability Testing", "A/B Testing", "Heuristic Evaluation"] },
        { name: "Prototyping", keywords: ["Interactive Prototypes", "Design Systems", "Wireframing", "Storyboarding"] },
        { name: "Development", keywords: ["HTML/CSS", "React Basics", "Tailwind", "Accessibility (WCAG)"] },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Irish", fluency: "Conversational" },
        { language: "French", fluency: "Professional" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    },
  },
  {
    templateId: "executive-dark",
    name: "Marcus Chen — Chief Financial Officer",
    data: {
      basics: {
        name: "Marcus Chen",
        label: "Chief Financial Officer",
        image: "/avatars/avatar-marcus-chen.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "marcus.chen@email.com",
        phone: "+1 (415) 555-0163",
        summary: "C-suite financial leader with 18+ years driving fiscal strategy for Fortune 500 companies and high-growth startups. Expertise in M&A, capital markets, and operational efficiency. Led financial operations through two successful IPOs totaling $4.2B in combined market cap.",
        location: { city: "San Francisco", region: "CA", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "marcuschen-cfo", url: "https://linkedin.com/in/marcuschen-cfo" },
        ],
      },
      work: [
        {
          name: "Cloudflare",
          position: "Chief Financial Officer",
          startDate: "2021-01",
          endDate: "Present",
          highlights: [
            "Orchestrated financial strategy through $1.8B revenue milestone, achieving 42% YoY growth",
            "Led $750M secondary offering and managed investor relations with 200+ institutional investors",
            "Implemented zero-based budgeting framework, reducing operational costs by $45M annually",
          ],
          city: "San Francisco",
          country: "US",
        },
        {
          name: "Twilio",
          position: "VP of Finance",
          startDate: "2016-03",
          endDate: "2020-12",
          highlights: [
            "Played a key role in the IPO process, contributing to a $2.4B initial valuation",
            "Managed a finance team of 35, overseeing FP&A, treasury, tax, and accounting functions",
            "Executed 3 strategic acquisitions totaling $680M, integrating financial operations within 90 days",
          ],
          city: "San Francisco",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Wharton School, University of Pennsylvania",
          area: "Finance",
          studyType: "Master of Business Administration",
          startDate: "2004-09",
          endDate: "2006-05",
        },
        {
          institution: "UC Berkeley",
          area: "Economics & Mathematics",
          studyType: "Bachelor of Arts",
          startDate: "2000-09",
          endDate: "2004-05",
          score: "Summa Cum Laude",
        },
      ],
      skills: [
        { name: "Financial Leadership", keywords: ["IPO Preparation", "M&A", "Capital Markets", "Investor Relations"] },
        { name: "Strategy", keywords: ["FP&A", "Revenue Operations", "Risk Management", "Board Reporting"] },
        { name: "Technology", keywords: ["SAP", "Oracle Financials", "Adaptive Insights", "Tableau"] },
      ],
      certificates: [
        { name: "Certified Public Accountant (CPA)", issuer: "AICPA", date: "2008-01" },
        { name: "Chartered Financial Analyst (CFA)", issuer: "CFA Institute", date: "2010-06" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Mandarin", fluency: "Native" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "professional-teal",
    name: "Sarah Nakamura — Data Scientist",
    data: {
      basics: {
        name: "Sarah Nakamura",
        label: "Senior Data Scientist",
        image: "/avatars/avatar-sarah-nakamura.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "sarah.nakamura@email.com",
        phone: "+1 (206) 555-0134",
        summary: "Data Scientist with 5+ years building production ML models at scale. Specialized in NLP and recommendation systems. Published researcher with expertise in turning complex data into products that drive measurable business outcomes.",
        location: { city: "Seattle", region: "WA", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "sarahnakamura", url: "https://linkedin.com/in/sarahnakamura" },
          { network: "GitHub", username: "snakamura-ml", url: "https://github.com/snakamura-ml" },
        ],
      },
      work: [
        {
          name: "Amazon",
          position: "Senior Data Scientist",
          startDate: "2022-03",
          endDate: "Present",
          highlights: [
            "Built a transformer-based product recommendation engine increasing purchase conversion by 18% across 300M+ products",
            "Developed an automated anomaly detection system reducing supply chain disruptions by 25%",
            "Led a team of 3 data scientists to ship models to production serving 200M+ daily requests",
          ],
          city: "Seattle",
          country: "US",
        },
        {
          name: "Netflix",
          position: "Data Scientist",
          startDate: "2019-07",
          endDate: "2022-02",
          highlights: [
            "Improved content recommendation algorithms, increasing user engagement by 14% across 230M subscribers",
            "Designed A/B testing framework for ML model evaluation, running 20+ experiments per quarter",
            "Created NLP pipeline for analyzing viewer reviews, informing content acquisition decisions worth $50M+",
          ],
          city: "Los Gatos",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Stanford University",
          area: "Statistics — Machine Learning Track",
          studyType: "Master of Science",
          startDate: "2017-09",
          endDate: "2019-06",
        },
        {
          institution: "University of Washington",
          area: "Applied Mathematics",
          studyType: "Bachelor of Science",
          startDate: "2013-09",
          endDate: "2017-06",
          score: "3.92 GPA",
        },
      ],
      skills: [
        { name: "Machine Learning", keywords: ["PyTorch", "TensorFlow", "scikit-learn", "XGBoost", "Hugging Face"] },
        { name: "Programming", keywords: ["Python", "SQL", "R", "Scala"] },
        { name: "Data Engineering", keywords: ["Spark", "Airflow", "Kafka", "BigQuery"] },
        { name: "MLOps", keywords: ["SageMaker", "MLflow", "Docker", "Kubernetes"] },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Japanese", fluency: "Professional Working" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    },
  },
  {
    templateId: "modern-grid",
    name: "James O'Brien — Product Manager",
    data: {
      basics: {
        name: "James O'Brien",
        label: "Senior Product Manager",
        image: "/avatars/avatar-james-obrien.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "james.obrien@email.com",
        phone: "+1 (512) 555-0178",
        summary: "Product Manager with 6+ years driving product strategy at high-growth B2B SaaS companies. Track record of launching 0-to-1 products and scaling them to $20M+ ARR. Expert in user-centric product development and data-driven prioritization.",
        location: { city: "Austin", region: "TX", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "jamesobrien-pm", url: "https://linkedin.com/in/jamesobrien-pm" },
        ],
      },
      work: [
        {
          name: "Notion",
          position: "Senior Product Manager",
          startDate: "2022-08",
          endDate: "Present",
          highlights: [
            "Led the Notion AI product launch, driving 2M+ activations in the first quarter",
            "Defined product roadmap for enterprise features, contributing to 65% growth in enterprise ARR",
            "Ran 30+ user research sessions and translated insights into features used by 35M+ users",
          ],
          city: "San Francisco",
          country: "US",
        },
        {
          name: "Atlassian",
          position: "Product Manager",
          startDate: "2019-05",
          endDate: "2022-07",
          highlights: [
            "Managed Jira's workflow automation features used by 10M+ teams globally",
            "Increased feature adoption by 40% through onboarding redesign and in-app guidance",
            "Coordinated with 4 engineering teams across 3 time zones to deliver quarterly releases on schedule",
          ],
          city: "Austin",
          country: "US",
        },
      ],
      education: [
        {
          institution: "University of Texas at Austin",
          area: "Business Administration — Technology Management",
          studyType: "Master of Business Administration",
          startDate: "2017-08",
          endDate: "2019-05",
        },
        {
          institution: "University of Michigan",
          area: "Computer Science",
          studyType: "Bachelor of Science",
          startDate: "2013-09",
          endDate: "2017-05",
        },
      ],
      skills: [
        { name: "Product Strategy", keywords: ["Roadmap Planning", "OKRs", "Go-to-Market", "Competitive Analysis"] },
        { name: "User Research", keywords: ["User Interviews", "Survey Design", "Usability Testing", "A/B Testing"] },
        { name: "Analytics", keywords: ["Amplitude", "Mixpanel", "SQL", "Looker"] },
        { name: "Tools", keywords: ["Jira", "Confluence", "Figma", "Notion", "Linear"] },
      ],
      certificates: [
        { name: "Pragmatic Institute Certified (PMC III)", issuer: "Pragmatic Institute", date: "2021-09" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "classic-traditional",
    name: "Ellen Johnson — HR Director",
    data: {
      basics: {
        name: "Ellen Johnson",
        label: "Director of Human Resources",
        image: "/avatars/avatar-ellen-johnson.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "ellen.johnson@email.com",
        phone: "+1 (202) 555-0156",
        summary: "Strategic HR leader with 14+ years of experience in talent acquisition, organizational development, and employee engagement. Scaled HR operations from 200 to 2,500+ employees across global teams while maintaining top-quartile retention rates.",
        location: { city: "Washington", region: "DC", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "ellenjohnson-hr", url: "https://linkedin.com/in/ellenjohnson-hr" },
        ],
      },
      work: [
        {
          name: "Salesforce",
          position: "Director of Human Resources",
          startDate: "2020-02",
          endDate: "Present",
          highlights: [
            "Built and led a 20-person HR team supporting 3,000+ employees across North America and EMEA",
            "Reduced time-to-hire by 35% through ATS optimization and structured interview implementation",
            "Designed DEI programs that increased underrepresented leadership representation by 28%",
          ],
          city: "Washington",
          country: "US",
        },
        {
          name: "Deloitte",
          position: "Senior HR Business Partner",
          startDate: "2015-01",
          endDate: "2020-01",
          highlights: [
            "Partnered with senior leadership to develop succession plans for 150+ critical roles",
            "Implemented a performance management system reducing annual review cycle time by 50%",
            "Led organizational restructuring initiatives impacting 1,200 employees with 95% retention",
          ],
          city: "Washington",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Cornell University",
          area: "Industrial and Labor Relations",
          studyType: "Master of Science",
          startDate: "2008-09",
          endDate: "2010-05",
        },
        {
          institution: "University of Virginia",
          area: "Psychology",
          studyType: "Bachelor of Arts",
          startDate: "2004-09",
          endDate: "2008-05",
        },
      ],
      skills: [
        { name: "HR Strategy", keywords: ["Talent Acquisition", "Organizational Design", "Change Management", "Succession Planning"] },
        { name: "Employee Relations", keywords: ["DEI Programs", "Employee Engagement", "Conflict Resolution", "Compensation & Benefits"] },
        { name: "Compliance", keywords: ["Employment Law", "FMLA/ADA", "EEOC", "GDPR"] },
        { name: "Technology", keywords: ["Workday", "SAP SuccessFactors", "Greenhouse", "BambooHR"] },
      ],
      certificates: [
        { name: "SHRM Senior Certified Professional (SHRM-SCP)", issuer: "SHRM", date: "2016-03" },
        { name: "Senior Professional in Human Resources (SPHR)", issuer: "HRCI", date: "2015-08" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "minimalist-clean",
    name: "Grace Jackson — Content Strategist",
    data: {
      basics: {
        name: "Grace Jackson",
        label: "Content Strategist",
        image: "/avatars/avatar-grace-jackson.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "grace.jackson@email.com",
        phone: "+1 (323) 555-0189",
        summary: "Content Strategist with 5+ years shaping brand narratives for leading tech companies. Expert in SEO-driven content creation, editorial planning, and audience growth. Grew organic traffic by 300%+ for multiple B2B SaaS brands.",
        location: { city: "Los Angeles", region: "CA", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "gracejackson", url: "https://linkedin.com/in/gracejackson" },
        ],
      },
      work: [
        {
          name: "Canva",
          position: "Senior Content Strategist",
          startDate: "2022-05",
          endDate: "Present",
          highlights: [
            "Developed content strategy driving 8M+ monthly organic sessions, a 120% increase YoY",
            "Led a team of 5 writers and 2 editors to produce 60+ high-quality articles per month",
            "Built a content hub framework that improved average time on page by 45% and reduced bounce rate by 20%",
          ],
          city: "Los Angeles",
          country: "US",
        },
        {
          name: "Buffer",
          position: "Content Marketing Manager",
          startDate: "2019-09",
          endDate: "2022-04",
          highlights: [
            "Managed editorial calendar producing 40+ blog posts, 12 ebooks, and 8 webinars per quarter",
            "Increased blog traffic from 500K to 2M monthly visitors through SEO optimization and content upgrades",
            "Launched a newsletter growing to 85K subscribers with 42% open rate",
          ],
          city: "Remote",
          country: "US",
        },
      ],
      education: [
        {
          institution: "UCLA",
          area: "English — Creative Writing",
          studyType: "Bachelor of Arts",
          startDate: "2015-09",
          endDate: "2019-06",
          score: "3.8 GPA",
        },
      ],
      skills: [
        { name: "Content Strategy", keywords: ["Editorial Planning", "Brand Voice", "Content Audits", "Audience Research"] },
        { name: "SEO & Analytics", keywords: ["Ahrefs", "SEMrush", "Google Analytics", "Search Console"] },
        { name: "Writing & Editing", keywords: ["Copywriting", "Long-form Content", "Email Marketing", "Social Media"] },
        { name: "Tools", keywords: ["WordPress", "Notion", "Asana", "Grammarly", "Clearscope"] },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Portuguese", fluency: "Conversational" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    },
  },
  {
    templateId: "professional-navy",
    name: "David Kim — Cloud Architect",
    data: {
      basics: {
        name: "David Kim",
        label: "Cloud Solutions Architect",
        image: "/avatars/avatar-david-kim.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "david.kim@email.com",
        phone: "+1 (425) 555-0172",
        summary: "Cloud Solutions Architect with 8+ years designing and deploying enterprise-scale cloud infrastructure. Certified across AWS, Azure, and GCP. Led cloud migration programs saving organizations $10M+ in annual infrastructure costs.",
        location: { city: "Seattle", region: "WA", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "davidkim-cloud", url: "https://linkedin.com/in/davidkim-cloud" },
          { network: "GitHub", username: "dkim-infra", url: "https://github.com/dkim-infra" },
        ],
      },
      work: [
        {
          name: "Microsoft",
          position: "Senior Cloud Solutions Architect",
          startDate: "2021-06",
          endDate: "Present",
          highlights: [
            "Designed multi-region Azure architectures for 25+ enterprise clients generating $40M+ in cloud revenue",
            "Led migration of a Fortune 100 client's on-premise infrastructure (500+ servers) to Azure, reducing costs by 38%",
            "Built reference architectures and best practices adopted by 150+ solution architects globally",
          ],
          city: "Redmond",
          country: "US",
        },
        {
          name: "AWS",
          position: "Cloud Architect",
          startDate: "2018-01",
          endDate: "2021-05",
          highlights: [
            "Architected serverless platforms processing 50M+ events daily for financial services clients",
            "Conducted 100+ Well-Architected Reviews, identifying $8M in potential cost optimizations",
            "Created Terraform modules and CloudFormation templates used by 200+ teams for IaC deployments",
          ],
          city: "Seattle",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Carnegie Mellon University",
          area: "Information Systems",
          studyType: "Master of Science",
          startDate: "2016-08",
          endDate: "2018-05",
        },
        {
          institution: "Korea University",
          area: "Computer Engineering",
          studyType: "Bachelor of Engineering",
          startDate: "2011-03",
          endDate: "2015-02",
        },
      ],
      skills: [
        { name: "Cloud Platforms", keywords: ["AWS", "Azure", "GCP", "Multi-Cloud"] },
        { name: "Infrastructure", keywords: ["Terraform", "Kubernetes", "Docker", "Ansible", "CloudFormation"] },
        { name: "Architecture", keywords: ["Microservices", "Serverless", "Event-Driven", "API Gateway"] },
        { name: "Security", keywords: ["IAM", "Zero Trust", "Compliance (SOC2, HIPAA)", "Encryption"] },
      ],
      certificates: [
        { name: "AWS Solutions Architect Professional", issuer: "Amazon Web Services", date: "2022-03" },
        { name: "Azure Solutions Architect Expert", issuer: "Microsoft", date: "2023-01" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Korean", fluency: "Native" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "modern-accent",
    name: "Priya Sharma — Business Analyst",
    data: {
      basics: {
        name: "Priya Sharma",
        label: "Senior Business Analyst",
        image: "/avatars/avatar-priya-sharma.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "priya.sharma@email.com",
        phone: "+1 (617) 555-0145",
        summary: "Business Analyst with 6+ years translating complex business requirements into actionable insights and technical solutions. Expert in process optimization, stakeholder management, and data-driven decision-making across healthcare and fintech verticals.",
        location: { city: "Boston", region: "MA", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "priyasharma-ba", url: "https://linkedin.com/in/priyasharma-ba" },
        ],
      },
      work: [
        {
          name: "McKinsey & Company",
          position: "Senior Business Analyst",
          startDate: "2021-09",
          endDate: "Present",
          highlights: [
            "Led 8 client engagements across healthcare and financial services, delivering $120M+ in identified savings",
            "Developed financial models and business cases for digital transformation initiatives valued at $50M+",
            "Created executive dashboards synthesizing data from 15+ sources for C-suite decision-making",
          ],
          city: "Boston",
          country: "US",
        },
        {
          name: "Accenture",
          position: "Business Analyst",
          startDate: "2018-06",
          endDate: "2021-08",
          highlights: [
            "Mapped and optimized 25+ business processes, reducing operational cycle times by an average of 30%",
            "Facilitated requirements gathering workshops with 50+ stakeholders across 3 continents",
            "Implemented Agile practices for a $15M ERP migration project, delivering 2 weeks ahead of schedule",
          ],
          city: "New York",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Boston University",
          area: "Business Analytics",
          studyType: "Master of Science",
          startDate: "2016-09",
          endDate: "2018-05",
        },
        {
          institution: "University of Mumbai",
          area: "Commerce — Business Administration",
          studyType: "Bachelor of Commerce",
          startDate: "2012-07",
          endDate: "2015-05",
          score: "First Class with Distinction",
        },
      ],
      skills: [
        { name: "Analysis", keywords: ["Requirements Engineering", "Process Mapping", "Gap Analysis", "SWOT"] },
        { name: "Data & Analytics", keywords: ["SQL", "Python", "Tableau", "Power BI", "Excel/VBA"] },
        { name: "Project Management", keywords: ["Agile/Scrum", "JIRA", "Confluence", "Stakeholder Management"] },
        { name: "Tools", keywords: ["Visio", "Lucidchart", "SAP", "Salesforce"] },
      ],
      certificates: [
        { name: "Certified Business Analysis Professional (CBAP)", issuer: "IIBA", date: "2020-11" },
        { name: "PMI Professional in Business Analysis (PMI-PBA)", issuer: "PMI", date: "2021-06" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Hindi", fluency: "Native" },
        { language: "Marathi", fluency: "Conversational" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "creative-gradient",
    name: "Leo Torres — Brand Designer",
    data: {
      basics: {
        name: "Leo Torres",
        label: "Brand Designer & Creative Director",
        image: "/avatars/avatar-leo-torres.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "leo.torres@email.com",
        phone: "+1 (305) 555-0137",
        summary: "Brand Designer and Creative Director with 7+ years crafting visual identities for global brands. Portfolio includes work for Nike, Spotify, and 20+ startups. Passionate about storytelling through design, motion, and interactive media.",
        location: { city: "Miami", region: "FL", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "leotorres-design", url: "https://linkedin.com/in/leotorres-design" },
        ],
      },
      work: [
        {
          name: "Pentagram",
          position: "Senior Brand Designer",
          startDate: "2021-03",
          endDate: "Present",
          highlights: [
            "Led brand identity projects for 12+ clients including a $2B fintech unicorn and a national museum",
            "Designed visual systems spanning logo, typography, color, illustration, and motion for global rollouts",
            "Won 3 industry awards including a D&AD Pencil and Communication Arts Award of Excellence",
          ],
          city: "New York",
          country: "US",
        },
        {
          name: "Spotify",
          position: "Brand Designer",
          startDate: "2018-06",
          endDate: "2021-02",
          highlights: [
            "Co-created the visual identity for Spotify Wrapped 2020, reaching 120M+ social shares globally",
            "Designed campaign assets for 15+ artist partnerships including Billie Eilish and Bad Bunny launches",
            "Developed motion design guidelines adopted by the 40-person creative team worldwide",
          ],
          city: "New York",
          country: "US",
        },
      ],
      education: [
        {
          institution: "Parsons School of Design",
          area: "Communication Design",
          studyType: "Bachelor of Fine Arts",
          startDate: "2014-09",
          endDate: "2018-05",
          score: "Dean's List — All Semesters",
        },
      ],
      skills: [
        { name: "Design", keywords: ["Brand Identity", "Typography", "Illustration", "Art Direction"] },
        { name: "Tools", keywords: ["Adobe Creative Suite", "Figma", "Cinema 4D", "After Effects"] },
        { name: "Motion & 3D", keywords: ["Motion Graphics", "3D Rendering", "Animation", "Lottie"] },
        { name: "Strategy", keywords: ["Brand Strategy", "Creative Direction", "Storytelling", "Client Presentations"] },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Spanish", fluency: "Native" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "languages"],
    },
  },
  {
    templateId: "creative-bold",
    name: "Zara Mitchell — Digital Marketing Lead",
    data: {
      basics: {
        name: "Zara Mitchell",
        label: "Digital Marketing Lead",
        image: "/avatars/avatar-zara-mitchell.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "zara.mitchell@email.com",
        phone: "+44 7911 555 023",
        summary: "Digital Marketing Lead with 5+ years orchestrating high-impact paid and organic campaigns for global e-commerce and SaaS brands. Managed $5M+ in annual ad spend while maintaining 4.5x ROAS. Skilled in performance marketing, CRO, and marketing automation.",
        location: { city: "London", countryCode: "GB" },
        profiles: [
          { network: "LinkedIn", username: "zaramitchell-mktg", url: "https://linkedin.com/in/zaramitchell-mktg" },
        ],
      },
      work: [
        {
          name: "Revolut",
          position: "Digital Marketing Lead",
          startDate: "2022-07",
          endDate: "Present",
          highlights: [
            "Managed $3.5M annual paid media budget across Google, Meta, TikTok, and programmatic channels",
            "Launched performance campaigns driving 500K+ app installs per quarter at $1.20 CPI, 40% below target",
            "Built A/B testing framework for landing pages, improving conversion rates by 55%",
          ],
          city: "London",
          country: "GB",
        },
        {
          name: "ASOS",
          position: "Senior Digital Marketing Specialist",
          startDate: "2020-01",
          endDate: "2022-06",
          highlights: [
            "Optimized Google Shopping campaigns generating £12M+ in monthly revenue with 5.2x ROAS",
            "Implemented cross-channel attribution model providing 360-degree view of customer journey",
            "Grew social media following by 200K+ through influencer partnerships and viral content strategies",
          ],
          city: "London",
          country: "GB",
        },
      ],
      education: [
        {
          institution: "King's College London",
          area: "Digital Marketing & Analytics",
          studyType: "Master of Science",
          startDate: "2018-09",
          endDate: "2019-09",
        },
        {
          institution: "University of Manchester",
          area: "Business Management",
          studyType: "Bachelor of Arts",
          startDate: "2015-09",
          endDate: "2018-06",
          score: "First Class Honours",
        },
      ],
      skills: [
        { name: "Paid Media", keywords: ["Google Ads", "Meta Ads", "TikTok Ads", "Programmatic", "Apple Search Ads"] },
        { name: "Analytics", keywords: ["Google Analytics 4", "Amplitude", "Data Studio", "SQL"] },
        { name: "CRO & Automation", keywords: ["Optimizely", "VWO", "HubSpot", "Braze", "Iterable"] },
        { name: "SEO & Content", keywords: ["Technical SEO", "Content Marketing", "Link Building", "Ahrefs"] },
      ],
      certificates: [
        { name: "Google Ads Professional", issuer: "Google", date: "2023-02" },
        { name: "Meta Certified Marketing Science Professional", issuer: "Meta", date: "2022-10" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "French", fluency: "Professional" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "minimalist-line",
    name: "Thomas Berg — Financial Analyst",
    data: {
      basics: {
        name: "Thomas Berg",
        label: "Senior Financial Analyst",
        image: "/avatars/avatar-thomas-berg.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "thomas.berg@email.com",
        phone: "+46 70 555 0149",
        summary: "Financial Analyst with 5+ years of experience in investment analysis, financial modeling, and portfolio management. CFA charterholder with expertise in equity research and risk assessment. Analyzed $2B+ in assets across technology and healthcare sectors.",
        location: { city: "Stockholm", countryCode: "SE" },
        profiles: [
          { network: "LinkedIn", username: "thomasberg-fin", url: "https://linkedin.com/in/thomasberg-fin" },
        ],
      },
      work: [
        {
          name: "Goldman Sachs",
          position: "Senior Financial Analyst",
          startDate: "2022-01",
          endDate: "Present",
          highlights: [
            "Conducted equity research and valuation for 15+ technology companies with combined market cap of $800B",
            "Built DCF and LBO models for M&A advisory engagements totaling $1.5B in deal value",
            "Authored investment memos and presented buy/sell recommendations to portfolio managers overseeing $5B AUM",
          ],
          city: "London",
          country: "GB",
        },
        {
          name: "SEB (Skandinaviska Enskilda Banken)",
          position: "Financial Analyst",
          startDate: "2019-07",
          endDate: "2021-12",
          highlights: [
            "Performed due diligence on 10+ Nordic tech companies for private equity investment opportunities",
            "Developed automated financial reporting dashboards reducing monthly close time by 40%",
            "Managed risk analysis for a SEK 25B fixed-income portfolio, optimizing Sharpe ratio by 15%",
          ],
          city: "Stockholm",
          country: "SE",
        },
      ],
      education: [
        {
          institution: "Stockholm School of Economics",
          area: "Finance",
          studyType: "Master of Science",
          startDate: "2017-09",
          endDate: "2019-06",
        },
        {
          institution: "Lund University",
          area: "Economics & Business Administration",
          studyType: "Bachelor of Science",
          startDate: "2014-09",
          endDate: "2017-06",
        },
      ],
      skills: [
        { name: "Financial Analysis", keywords: ["Equity Research", "Financial Modeling", "Valuation (DCF/LBO)", "Due Diligence"] },
        { name: "Tools", keywords: ["Bloomberg Terminal", "Capital IQ", "FactSet", "Excel/VBA"] },
        { name: "Programming", keywords: ["Python", "SQL", "R", "Power BI"] },
        { name: "Risk & Compliance", keywords: ["Risk Management", "Portfolio Analytics", "MiFID II", "Basel III"] },
      ],
      certificates: [
        { name: "Chartered Financial Analyst (CFA)", issuer: "CFA Institute", date: "2021-09" },
        { name: "Financial Risk Manager (FRM)", issuer: "GARP", date: "2020-11" },
      ],
      languages: [
        { language: "Swedish", fluency: "Native" },
        { language: "English", fluency: "Native" },
        { language: "German", fluency: "Conversational" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
  {
    templateId: "minimalist-elegant",
    name: "Olivia Chen — Project Manager",
    data: {
      basics: {
        name: "Olivia Chen",
        label: "Senior Project Manager",
        image: "/avatars/avatar-olivia-chen.png",
        imagePosition: { x: 0, y: 0, scale: 1 },
        email: "olivia.chen@email.com",
        phone: "+1 (628) 555-0191",
        summary: "PMP-certified Project Manager with 7+ years delivering complex technology projects on time and within budget. Managed cross-functional teams of up to 40 people and portfolios worth $30M+. Expert in Agile, Waterfall, and hybrid methodologies.",
        location: { city: "San Francisco", region: "CA", countryCode: "US" },
        profiles: [
          { network: "LinkedIn", username: "oliviachen-pm", url: "https://linkedin.com/in/oliviachen-pm" },
        ],
      },
      work: [
        {
          name: "Google",
          position: "Senior Technical Program Manager",
          startDate: "2021-08",
          endDate: "Present",
          highlights: [
            "Led a $25M cloud infrastructure migration program involving 8 engineering teams and 120+ microservices",
            "Delivered 15+ product launches on schedule with zero critical post-launch incidents",
            "Established project governance framework adopted by 200+ PMs across the Cloud division",
          ],
          city: "San Francisco",
          country: "US",
        },
        {
          name: "Uber",
          position: "Project Manager",
          startDate: "2018-03",
          endDate: "2021-07",
          highlights: [
            "Managed the rollout of Uber Eats features across 25 countries, coordinating 6 cross-functional teams",
            "Reduced project delivery cycle time by 30% through process automation and sprint optimization",
            "Built risk management framework that decreased project overruns by 45%",
          ],
          city: "San Francisco",
          country: "US",
        },
      ],
      education: [
        {
          institution: "UC Berkeley",
          area: "Industrial Engineering & Operations Research",
          studyType: "Master of Science",
          startDate: "2016-08",
          endDate: "2018-05",
        },
        {
          institution: "Peking University",
          area: "Management Information Systems",
          studyType: "Bachelor of Science",
          startDate: "2012-09",
          endDate: "2016-06",
        },
      ],
      skills: [
        { name: "Project Management", keywords: ["Agile/Scrum", "Waterfall", "Kanban", "SAFe", "Risk Management"] },
        { name: "Tools", keywords: ["Jira", "Asana", "MS Project", "Smartsheet", "Confluence"] },
        { name: "Technical", keywords: ["SQL", "Python Basics", "Data Analysis", "API Integration"] },
        { name: "Leadership", keywords: ["Stakeholder Management", "Team Building", "Vendor Management", "Budget Control"] },
      ],
      certificates: [
        { name: "Project Management Professional (PMP)", issuer: "PMI", date: "2019-06" },
        { name: "Certified Scrum Master (CSM)", issuer: "Scrum Alliance", date: "2018-10" },
        { name: "SAFe Agilist", issuer: "Scaled Agile", date: "2022-04" },
      ],
      languages: [
        { language: "English", fluency: "Native" },
        { language: "Mandarin", fluency: "Native" },
      ],
      sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    if (secret !== "seed-demo-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userList, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const targetUser = userList.users.find((u) => u.email === DEMO_EMAIL);
    if (!targetUser) {
      return NextResponse.json(
        { error: `User ${DEMO_EMAIL} not found` },
        { status: 404 }
      );
    }

    const results = [];

    for (const resume of sampleResumes) {
      const { data, error } = await supabaseAdmin
        .from("resumes")
        .insert({
          user_id: targetUser.id,
          name: resume.name,
          resume_data: resume.data,
          template_id: resume.templateId,
        })
        .select()
        .single();

      if (error) {
        results.push({ name: resume.name, error: error.message });
      } else {
        results.push({ name: resume.name, id: data.id, template: resume.templateId });
      }
    }

    return NextResponse.json({
      success: true,
      userId: targetUser.id,
      count: results.filter((r) => !("error" in r)).length,
      results,
      message: `${results.filter((r) => !("error" in r)).length} demo resumes created for ${DEMO_EMAIL}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed" },
      { status: 500 }
    );
  }
}
