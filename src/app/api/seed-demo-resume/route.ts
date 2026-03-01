import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "fuatsezer22@gmail.com";

const joeDoeResume = {
  basics: {
    name: "Joe Doe",
    label: "Senior Data Scientist",
    image: "/joe-doe-avatar.png",
    imagePosition: { x: 0, y: 0, scale: 1 },
    email: "joe.doe@gmail.com",
    phone: "+1 (415) 829-4371",
    url: "https://joedoe.dev",
    summary:
      "Senior Data Scientist with 6+ years of experience building production ML systems at scale. Specialized in NLP, deep learning, and real-time recommendation engines. Led cross-functional teams to deliver AI-powered products that drove $40M+ in incremental revenue. Published researcher with 4 papers in top-tier conferences (NeurIPS, ICML). Passionate about turning complex data into actionable business insights.",
    location: {
      city: "San Francisco",
      region: "CA",
      countryCode: "US",
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "joedoe-ds",
        url: "https://linkedin.com/in/joedoe-ds",
      },
      {
        network: "GitHub",
        username: "joedoe-ml",
        url: "https://github.com/joedoe-ml",
      },
    ],
  },
  work: [
    {
      name: "Google",
      position: "Senior Data Scientist",
      url: "https://google.com",
      startDate: "2022-03",
      endDate: "Present",
      summary: "Search & AI division — ranking and personalization team",
      highlights: [
        "Designed and deployed a transformer-based query understanding model that improved search relevance by 12%, impacting 2B+ daily queries",
        "Built an end-to-end MLOps pipeline using Vertex AI, reducing model deployment time from 2 weeks to 4 hours",
        "Led a team of 4 data scientists to develop a real-time user intent prediction system, increasing ad click-through rate by 8.5%",
        "Collaborated with product and engineering teams to A/B test 15+ ML features, driving $28M in annual incremental revenue",
      ],
      city: "Mountain View",
      country: "US",
    },
    {
      name: "Spotify",
      position: "Data Scientist",
      url: "https://spotify.com",
      startDate: "2020-01",
      endDate: "2022-02",
      summary: "Personalization & recommendations team",
      highlights: [
        "Developed a collaborative filtering model for podcast recommendations, increasing user engagement by 23% across 400M+ users",
        "Implemented a real-time feature engineering pipeline using Apache Kafka and Spark, processing 50M+ events per hour",
        "Created an NLP-based content moderation system that reduced manual review workload by 60%",
        "Mentored 3 junior data scientists and established best practices for experiment design and causal inference",
      ],
      city: "New York",
      country: "US",
    },
    {
      name: "DataRobot",
      position: "Machine Learning Engineer",
      url: "https://datarobot.com",
      startDate: "2018-06",
      endDate: "2019-12",
      summary: "AutoML platform — model optimization team",
      highlights: [
        "Built automated feature selection algorithms that improved model accuracy by 15% on average across 200+ customer datasets",
        "Developed a time-series forecasting module supporting ARIMA, Prophet, and LSTM architectures",
        "Reduced model training time by 40% through distributed computing optimizations with Dask and Ray",
      ],
      city: "Boston",
      country: "US",
    },
  ],
  education: [
    {
      institution: "Massachusetts Institute of Technology (MIT)",
      url: "https://mit.edu",
      area: "Computer Science — Machine Learning",
      studyType: "Master of Science",
      startDate: "2016-09",
      endDate: "2018-05",
      score: "4.0 GPA",
      courses: [
        "Advanced Machine Learning",
        "Deep Learning for NLP",
        "Statistical Learning Theory",
        "Bayesian Inference",
      ],
    },
    {
      institution: "University of California, Berkeley",
      url: "https://berkeley.edu",
      area: "Statistics & Data Science",
      studyType: "Bachelor of Science",
      startDate: "2012-09",
      endDate: "2016-05",
      score: "3.92 GPA — Summa Cum Laude",
    },
  ],
  skills: [
    {
      name: "Machine Learning",
      keywords: [
        "PyTorch",
        "TensorFlow",
        "scikit-learn",
        "XGBoost",
        "Hugging Face",
        "LangChain",
      ],
    },
    {
      name: "Programming",
      keywords: ["Python", "SQL", "R", "Scala", "Bash"],
    },
    {
      name: "Data Engineering",
      keywords: [
        "Apache Spark",
        "Kafka",
        "Airflow",
        "dbt",
        "BigQuery",
        "Snowflake",
      ],
    },
    {
      name: "MLOps & Cloud",
      keywords: [
        "AWS SageMaker",
        "GCP Vertex AI",
        "MLflow",
        "Docker",
        "Kubernetes",
        "CI/CD",
      ],
    },
    {
      name: "Analytics",
      keywords: [
        "A/B Testing",
        "Causal Inference",
        "Tableau",
        "Looker",
        "Pandas",
        "NumPy",
      ],
    },
  ],
  certificates: [
    {
      name: "AWS Certified Machine Learning — Specialty",
      issuer: "Amazon Web Services",
      date: "2023-04",
      url: "https://aws.amazon.com/certification/certified-machine-learning-specialty/",
    },
    {
      name: "Google Professional Machine Learning Engineer",
      issuer: "Google Cloud",
      date: "2022-11",
      url: "https://cloud.google.com/certification/machine-learning-engineer",
    },
    {
      name: "Deep Learning Specialization",
      issuer: "Coursera — Andrew Ng",
      date: "2020-03",
      url: "https://www.coursera.org/specializations/deep-learning",
    },
  ],
  projects: [
    {
      name: "Real-Time Fraud Detection Engine",
      description:
        "Built a gradient-boosted ensemble model processing 10K+ transactions per second with 99.7% accuracy and <50ms latency, preventing $12M in annual fraud losses.",
      keywords: ["XGBoost", "Kafka", "Redis", "Python"],
      startDate: "2023-01",
      endDate: "2023-06",
    },
    {
      name: "LLM-Powered Document Intelligence",
      description:
        "Developed a RAG pipeline using GPT-4 and vector embeddings to automate contract analysis, reducing legal review time by 75% for enterprise clients.",
      keywords: ["LangChain", "Pinecone", "GPT-4", "FastAPI"],
      startDate: "2023-08",
      endDate: "2024-01",
    },
    {
      name: "Customer Churn Prediction Platform",
      description:
        "Designed an end-to-end ML platform predicting subscriber churn with 91% recall, enabling targeted retention campaigns that reduced churn by 18%.",
      keywords: ["scikit-learn", "Airflow", "Streamlit", "PostgreSQL"],
      startDate: "2021-05",
      endDate: "2021-11",
    },
  ],
  publications: [
    {
      name: "Efficient Attention Mechanisms for Long-Document Understanding",
      publisher: "NeurIPS 2023",
      releaseDate: "2023-12",
      summary:
        "Proposed a sparse attention variant achieving 95% of full attention performance with 60% less compute.",
    },
    {
      name: "Causal Inference in Large-Scale Recommendation Systems",
      publisher: "ICML 2022",
      releaseDate: "2022-07",
      summary:
        "Introduced a debiasing framework for recommendation models, improving fairness metrics by 30%.",
    },
  ],
  languages: [
    { language: "English", fluency: "Native" },
    { language: "French", fluency: "Professional Working" },
    { language: "Mandarin", fluency: "Elementary" },
  ],
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "publications",
    "languages",
  ],
};

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

    // Find user by email via auth admin API (bypasses RLS)
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

    const { data, error } = await supabaseAdmin
      .from("resumes")
      .insert({
        user_id: targetUser.id,
        name: "Joe Doe's Resume",
        resume_data: joeDoeResume,
        template_id: "professional-navy",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resumeId: data.id,
      userId: targetUser.id,
      message: `Demo resume created for ${DEMO_EMAIL}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed" },
      { status: 500 }
    );
  }
}
