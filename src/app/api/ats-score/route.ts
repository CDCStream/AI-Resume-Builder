import { NextRequest, NextResponse } from "next/server";
import { generateText, cleanJsonResponse } from "@/lib/ai-provider";

export interface ATSScoreRequest {
  jobDescription: string;
  resume: {
    basics?: {
      name?: string;
      label?: string;
      summary?: string;
    };
    work?: Array<{
      position?: string;
      name?: string;
      summary?: string;
    }>;
    education?: Array<{
      institution?: string;
      area?: string;
      studyType?: string;
      summary?: string;
    }>;
    skills?: Array<{
      name?: string;
      level?: string;
      keywords?: string[];
    }>;
    projects?: Array<{
      name?: string;
      description?: string;
    }>;
    certificates?: Array<{
      name?: string;
      issuer?: string;
    }>;
  };
}

export interface WeakArea {
  section: string;
  field: string;
  currentValue: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface ATSScoreResponse {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSkills: Array<{ name: string; importance: "required" | "preferred" | "nice-to-have" }>;
  weakAreas: WeakArea[];
  strengths: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  console.log("=== ATS Score API Called ===");
  try {
    const body: ATSScoreRequest = await request.json();
    const { jobDescription, resume } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    if (!resume) {
      return NextResponse.json(
        { error: "Resume data is required" },
        { status: 400 }
      );
    }

    const resumeText = formatResumeForAnalysis(resume);
    const prompt = getATSScorePrompt(jobDescription, resumeText, resume);

    const currentSkills = resume.skills?.map(s => s.name).filter(Boolean) || [];
    console.log("Analyzing with skills:", currentSkills.join(", ") || "None");
    console.log("Calling AI for ATS Score analysis...");

    const { text: responseText } = await generateText({ user: prompt, maxTokens: 8192 });
    console.log("AI response received");

    const cleanedResponse = cleanJsonResponse(responseText);

    let result: ATSScoreResponse;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error, attempting to fix truncated JSON...");
      console.error("Response length:", cleanedResponse.length);
      
      // Try to fix truncated JSON by closing open structures
      let fixedJson = cleanedResponse;
      
      // Count open brackets and braces
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/]/g) || []).length;
      
      // Remove incomplete last element if in array/object
      if (fixedJson.match(/,\s*$/)) {
        fixedJson = fixedJson.replace(/,\s*$/, '');
      }
      // Remove incomplete string
      if (fixedJson.match(/:\s*"[^"]*$/)) {
        fixedJson = fixedJson.replace(/:\s*"[^"]*$/, ': ""');
      }
      
      // Close arrays and objects
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      
      try {
        result = JSON.parse(fixedJson);
        console.log("Successfully fixed truncated JSON");
      } catch {
        // If still fails, return a minimal valid response
        console.error("Could not fix JSON, returning minimal response");
        result = {
          score: 50,
          summary: "Analysis was interrupted. Please try again with a shorter job description.",
          matchedKeywords: [],
          missingKeywords: [],
          missingSkills: [],
          weakAreas: [],
          strengths: [],
          recommendations: ["Please try the analysis again."]
        };
      }
    }

    // Post-process: Filter out any missingSkills that are actually in the resume
    // Using advanced skill matching with synonyms and variations
    const existingSkillNames = (resume.skills || [])
      .map(s => (s.name || "").toLowerCase().trim())
      .filter(Boolean);
    
    console.log("Existing skills for filtering:", existingSkillNames.join(", "));
    
    // Skill synonym and variation mapping
    const skillSynonyms: Record<string, string[]> = {
      // Python ecosystem
      "python": ["python3", "python 3", "py"],
      "scikit-learn": ["sklearn", "scikit learn", "sk-learn", "scikitlearn"],
      "pandas": ["pd", "pandas dataframe"],
      "numpy": ["np", "numerical python"],
      "matplotlib": ["plt", "mpl"],
      "seaborn": ["sns"],
      "tensorflow": ["tf", "tensor flow", "tensorflow 2"],
      "pytorch": ["torch", "py torch"],
      "keras": ["tf.keras", "tensorflow keras"],
      
      // Data Science & ML
      "machine learning": ["ml", "machine-learning", "machinelearning"],
      "deep learning": ["dl", "deep-learning", "deeplearning", "neural networks"],
      "natural language processing": ["nlp", "natural-language-processing", "text analytics"],
      "computer vision": ["cv", "image processing", "image recognition"],
      "xgboost": ["xgb", "extreme gradient boosting"],
      "lightgbm": ["lgbm", "light gbm", "lgb"],
      "catboost": ["cat boost"],
      "random forest": ["rf", "randomforest"],
      "decision tree": ["dt", "decision trees"],
      "gradient boosting": ["gbm", "gradient-boosting", "boosting"],
      "regression": ["linear regression", "logistic regression"],
      "classification": ["classifier", "classifiers"],
      "clustering": ["cluster analysis", "k-means", "kmeans"],
      "feature engineering": ["feature extraction", "feature selection"],
      "hyperparameter tuning": ["hyperparameter optimization", "grid search", "gridsearch"],
      "cross validation": ["cross-validation", "cv", "k-fold"],
      "a/b testing": ["ab testing", "a-b testing", "split testing", "ab test"],
      "statistical analysis": ["statistics", "statistical modeling", "stats"],
      
      // Big Data & Data Engineering
      "apache spark": ["spark", "pyspark", "spark sql"],
      "apache kafka": ["kafka", "kafka streams"],
      "apache airflow": ["airflow", "airflow dag"],
      "apache hadoop": ["hadoop", "hdfs", "mapreduce"],
      "apache hive": ["hive", "hiveql"],
      "databricks": ["databricks workspace", "dbx"],
      "snowflake": ["snowflake db", "snowflake data warehouse"],
      "dbt": ["dbt core", "data build tool", "dbt cloud"],
      "etl": ["extract transform load", "data pipeline", "data pipelines"],
      "data warehouse": ["dwh", "data warehousing", "olap"],
      "data lake": ["datalake", "data lakehouse"],
      
      // Databases
      "sql": ["structured query language", "sql server", "t-sql", "pl/sql", "plsql"],
      "postgresql": ["postgres", "psql", "pg"],
      "mysql": ["my sql", "mariadb"],
      "mongodb": ["mongo", "mongo db"],
      "redis": ["redis cache", "redis db"],
      "elasticsearch": ["elastic search", "es", "elk"],
      "cassandra": ["apache cassandra"],
      "neo4j": ["neo 4j", "graph database"],
      
      // Cloud Platforms
      "amazon web services": ["aws", "amazon aws"],
      "aws sagemaker": ["sagemaker", "sage maker"],
      "aws s3": ["s3", "simple storage service"],
      "aws ec2": ["ec2", "elastic compute"],
      "aws lambda": ["lambda", "serverless"],
      "aws redshift": ["redshift", "amazon redshift"],
      "aws glue": ["glue", "aws glue etl"],
      "google cloud platform": ["gcp", "google cloud"],
      "google bigquery": ["bigquery", "bq"],
      "google cloud storage": ["gcs", "cloud storage"],
      "microsoft azure": ["azure", "azure cloud"],
      "azure ml": ["azure machine learning", "azureml"],
      
      // DevOps & Tools
      "docker": ["docker container", "containerization", "containers"],
      "kubernetes": ["k8s", "kube", "container orchestration"],
      "git": ["git version control", "version control"],
      "github": ["github actions", "gh", "github ci/cd"],
      "gitlab": ["gitlab ci", "gitlab ci/cd"],
      "jenkins": ["jenkins ci", "jenkins pipeline"],
      "ci/cd": ["cicd", "ci cd", "continuous integration", "continuous deployment"],
      "mlops": ["ml ops", "machine learning operations"],
      "linux": ["unix", "bash", "shell scripting", "ubuntu", "centos"],
      "terraform": ["tf", "infrastructure as code", "iac"],
      "ansible": ["ansible automation"],
      
      // BI & Visualization
      "tableau": ["tableau desktop", "tableau server"],
      "power bi": ["powerbi", "power-bi", "microsoft power bi"],
      "looker": ["looker studio", "google looker"],
      "metabase": ["meta base"],
      "data visualization": ["data viz", "dataviz", "visualization"],
      
      // Programming Languages
      "javascript": ["js", "es6", "ecmascript"],
      "typescript": ["ts"],
      "java": ["java 8", "java 11", "java 17", "jvm"],
      "scala": ["scala lang"],
      "r": ["r programming", "r language", "rstats"],
      "golang": ["go", "go lang"],
      "rust": ["rust lang"],
      "c++": ["cpp", "c plus plus"],
      "c#": ["csharp", "c sharp", "dotnet", ".net"],
      
      // APIs & Web
      "rest api": ["restful", "rest", "restful api", "api"],
      "graphql": ["graph ql"],
      "fastapi": ["fast api"],
      "flask": ["flask api"],
      "django": ["django rest framework", "drf"],
      
      // Testing
      "pytest": ["py test", "python testing"],
      "unit testing": ["unit tests", "unittest"],
      "test automation": ["automated testing", "test automation framework"],
      
      // Soft Skills
      "communication": ["communication skills", "written communication", "verbal communication"],
      "problem solving": ["problem-solving", "analytical thinking"],
      "teamwork": ["team collaboration", "collaboration", "team player"],
      "leadership": ["team leadership", "team lead", "leading teams"],
      "project management": ["pm", "project planning"],
      "agile": ["agile methodology", "scrum", "kanban", "agile/scrum"],
    };
    
    // Build reverse mapping (synonym -> canonical name)
    const synonymToCanonical: Map<string, string> = new Map();
    for (const [canonical, synonyms] of Object.entries(skillSynonyms)) {
      synonymToCanonical.set(canonical, canonical);
      for (const syn of synonyms) {
        synonymToCanonical.set(syn, canonical);
      }
    }
    
    // Normalize skill name to canonical form
    const normalizeSkill = (skill: string): string[] => {
      const lower = skill.toLowerCase().trim();
      const results: string[] = [lower];
      
      // Check if it's a known synonym
      if (synonymToCanonical.has(lower)) {
        results.push(synonymToCanonical.get(lower)!);
      }
      
      // Also check each word
      const words = lower.split(/[\s\/\-\(\),\.]+/).filter(w => w.length > 1);
      for (const word of words) {
        if (synonymToCanonical.has(word)) {
          results.push(synonymToCanonical.get(word)!);
        }
        results.push(word);
      }
      
      // Normalized version without special chars
      results.push(lower.replace(/[^a-z0-9]/g, ''));
      
      return [...new Set(results)];
    };
    
    // Build set of all existing skill variations
    const existingSkillSet = new Set<string>();
    for (const skill of existingSkillNames) {
      for (const variation of normalizeSkill(skill)) {
        existingSkillSet.add(variation);
      }
    }
    
    console.log("Normalized existing skills:", Array.from(existingSkillSet).slice(0, 30).join(", "), "...");
    
    // Check if a skill matches any existing skill
    const skillExists = (skillName: string): boolean => {
      const variations = normalizeSkill(skillName);
      
      // Check direct match with any variation
      for (const v of variations) {
        if (existingSkillSet.has(v)) {
          return true;
        }
      }
      
      // Check substring match for longer terms
      const skillNorm = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const existing of existingSkillSet) {
        const existingNorm = existing.replace(/[^a-z0-9]/g, '');
        
        // Substring match (both directions)
        if (existingNorm.length > 4 && skillNorm.length > 4) {
          if (skillNorm.includes(existingNorm) || existingNorm.includes(skillNorm)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    if (result.missingSkills && result.missingSkills.length > 0) {
      const originalCount = result.missingSkills.length;
      
      // Step 1: Static filtering with synonym database
      result.missingSkills = result.missingSkills.filter(skill => {
        const skillName = skill.name || "";
        
        if (skillExists(skillName)) {
          console.log(`Filtering "${skillName}" - matched with existing skill (static)`);
          return false;
        }
        
        return true;
      });
      
      console.log(`After static filtering: ${originalCount} -> ${result.missingSkills.length}`);
      
      // Step 2: AI-powered semantic skill matching for remaining skills
      if (result.missingSkills.length > 0 && existingSkillNames.length > 0) {
        console.log("Running AI skill matching verification...");
        
        const aiFilteredSkills = await verifyMissingSkillsWithAI(
          result.missingSkills.map(s => s.name),
          existingSkillNames
        );
        
        if (aiFilteredSkills) {
          const beforeAI = result.missingSkills.length;
          result.missingSkills = result.missingSkills.filter(skill => 
            aiFilteredSkills.trulyMissing.includes(skill.name)
          );
          console.log(`After AI filtering: ${beforeAI} -> ${result.missingSkills.length}`);
          console.log("AI matched skills:", aiFilteredSkills.matched.join(", ") || "None");
        }
      }
      
      console.log("Final missingSkills:", result.missingSkills.map(s => s.name).join(", ") || "None");
      
      // Recalculate score based on total filtered skills
      const filteredCount = originalCount - result.missingSkills.length;
      if (filteredCount > 0 && result.score < 90) {
        const boost = Math.min(filteredCount * 4, 25);
        result.score = Math.min(result.score + boost, 98);
        console.log(`Score boosted by ${boost} points. New score: ${result.score}`);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ATS Score error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate ATS score" },
      { status: 500 }
    );
  }
}

// AI-powered skill matching verification
async function verifyMissingSkillsWithAI(
  missingSkills: string[],
  existingSkills: string[]
): Promise<{ trulyMissing: string[]; matched: string[] } | null> {
  if (missingSkills.length === 0) return { trulyMissing: [], matched: [] };
  
  const prompt = `You are a technical skill matching expert. Determine if "missing skills" are actually covered by "existing skills" through:
- Synonyms (sklearn = scikit-learn)
- Abbreviations (k8s = Kubernetes, ML = Machine Learning)
- Parent/child relationships (Python covers pandas, numpy)
- Variations (XGBoost = xgboost = XGB)
- Overlapping concepts (Statistical Analysis covers hypothesis testing)

EXISTING SKILLS in resume:
${existingSkills.join(", ")}

MISSING SKILLS to verify:
${missingSkills.join(", ")}

For each missing skill, determine if it's TRULY MISSING or ALREADY COVERED by existing skills.

Return ONLY this JSON (no markdown):
{
  "trulyMissing": ["skill1", "skill2"],
  "matched": ["skill3", "skill4"],
  "matchReasons": {
    "skill3": "covered by existing_skill_name",
    "skill4": "synonym of existing_skill_name"
  }
}

Rules:
- Be GENEROUS with matching - if there's reasonable overlap, consider it matched
- "Python" covers basic Python libraries unless very specific ones are needed
- "Machine Learning" or "ML" covers general ML concepts
- "Data Analysis" covers basic statistical analysis
- Cloud platform experience (AWS) often transfers to similar services
- If someone has "Apache Spark", they likely know "PySpark" too`;

  try {
    const { text: responseText } = await generateText({ user: prompt, maxTokens: 1024 });
    const cleaned = cleanJsonResponse(responseText);
    const result = JSON.parse(cleaned);
    
    // Log match reasons
    if (result.matchReasons) {
      for (const [skill, reason] of Object.entries(result.matchReasons)) {
        console.log(`AI Match: "${skill}" - ${reason}`);
      }
    }
    
    return {
      trulyMissing: result.trulyMissing || [],
      matched: result.matched || []
    };
  } catch (error) {
    console.error("AI skill matching error:", error);
    return null; // Fall back to static filtering only
  }
}

function formatResumeForAnalysis(resume: ATSScoreRequest["resume"]): string {
  const parts: string[] = [];

  if (resume.basics) {
    if (resume.basics.name) parts.push(`Name: ${resume.basics.name}`);
    if (resume.basics.label) parts.push(`Title: ${resume.basics.label}`);
    if (resume.basics.summary) parts.push(`Summary: ${resume.basics.summary}`);
  }

  if (resume.work && resume.work.length > 0) {
    parts.push("\nWork Experience:");
    resume.work.forEach((job, i) => {
      parts.push(`  ${i + 1}. ${job.position || "Unknown Position"} at ${job.name || "Unknown Company"}`);
      if (job.summary) parts.push(`     ${job.summary}`);
    });
  }

  if (resume.education && resume.education.length > 0) {
    parts.push("\nEducation:");
    resume.education.forEach((edu, i) => {
      parts.push(`  ${i + 1}. ${edu.studyType || ""} in ${edu.area || ""} at ${edu.institution || "Unknown Institution"}`);
      if (edu.summary) parts.push(`     ${edu.summary}`);
    });
  }

  if (resume.skills && resume.skills.length > 0) {
    parts.push("\nSkills:");
    const skillNames = resume.skills.map(s => s.name).filter(Boolean);
    parts.push(`  ${skillNames.join(", ")}`);
  }

  if (resume.projects && resume.projects.length > 0) {
    parts.push("\nProjects:");
    resume.projects.forEach((proj, i) => {
      parts.push(`  ${i + 1}. ${proj.name || "Unknown Project"}`);
      if (proj.description) parts.push(`     ${proj.description}`);
    });
  }

  if (resume.certificates && resume.certificates.length > 0) {
    parts.push("\nCertifications:");
    resume.certificates.forEach((cert, i) => {
      parts.push(`  ${i + 1}. ${cert.name || "Unknown Certificate"} (${cert.issuer || "Unknown Issuer"})`);
    });
  }

  return parts.join("\n");
}

function getATSScorePrompt(jobDescription: string, resumeText: string, resume: ATSScoreRequest["resume"]): string {
  return `You are an ATS analyst. Analyze resume-job match and return JSON.

**LANGUAGE:** Match the resume content language (English/Turkish/German). Do NOT infer the user's native language from their name — only match the resume text.

**CRITICAL: Keep responses CONCISE to avoid truncation:**
- matchedKeywords: max 10 items
- missingKeywords: max 10 items  
- missingSkills: LIST ALL MISSING SKILLS IN ONE RESPONSE (max 15 items). Use SHORT SPECIFIC NAMES.
- weakAreas: max 5 items (most important only)
- strengths: max 5 items
- recommendations: max 5 items
- Keep all text fields SHORT (1-2 sentences max)

**SKILL NAMING RULE:** For missingSkills, use SPECIFIC tool/technology names only.
WRONG: "Cloud ML platforms (AWS SageMaker etc.)", "CI/CD tools", "Container orchestration", "dbt Core (production)"
CORRECT: "AWS SageMaker", "Jenkins", "Kubernetes", "Docker", "TensorFlow", "dbt", "Pytest", "GitHub Actions"

**=== CRITICAL - EXISTING SKILLS CHECK ===**
CANDIDATE'S CURRENT SKILLS: ${resume.skills?.map(s => s.name).filter(Boolean).join(", ") || "None"}

ABSOLUTE RULES FOR missingSkills (MUST FOLLOW):
1. NEVER include any skill already in the list above - check EVERY skill before adding
2. If "XGBoost/LightGBM" exists → "XGBoost" and "LightGBM" are NOT missing
3. If "dbt" exists → "dbt Core", "dbt (production)" are NOT missing  
4. If "Git/Github" exists → "Git", "GitHub", "GitHub Actions" are NOT missing
5. If "A/B Testing Framework" exists → "A/B Testing", "Pytest" are NOT missing
6. Partial matches count: "Docker" in skills means Docker is NOT missing
7. The score should INCREASE if all required skills are present

**CONSISTENCY RULE:** List ALL missing skills in the FIRST analysis. Do NOT add new missing skills in subsequent analyses if the resume hasn't changed significantly.

JOB:
${jobDescription.slice(0, 3000)}

RESUME:
${resumeText.slice(0, 2000)}

EXISTING SKILLS (DO NOT LIST AS MISSING): ${resume.skills?.map(s => s.name).filter(Boolean).join(", ") || "None"}

Return ONLY this JSON (no markdown):
{
  "score": <0-100>,
  "summary": "<2 sentences max>",
  "matchedKeywords": ["..."],
  "missingKeywords": ["..."],
  "missingSkills": [{"name": "...", "importance": "required|preferred|nice-to-have"}],
  "weakAreas": [{"section": "professionalTitle|professionalSummary|workExperience|education|skills|projects", "field": "...", "currentValue": "...", "issue": "...", "suggestion": "...", "priority": "high|medium|low"}],
  "strengths": ["..."],
  "recommendations": ["..."]
}

Score Guidelines:
- If ALL required skills are present in resume → score should be 85-95
- If MOST required skills present, some preferred missing → score 70-84
- If SOME required skills missing → score 50-69
- If MANY required skills missing → score <50

IMPORTANT: Give higher scores when skills match well. Don't penalize for minor keyword differences.`;
}
