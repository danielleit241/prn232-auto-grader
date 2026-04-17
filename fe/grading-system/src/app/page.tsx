"use client";

import Link from "next/link";

const features = [
  {
    title: "Automated Test Execution",
    description:
      "Run comprehensive test suites against student submissions automatically. Support for multiple test frameworks and custom test scenarios.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    title: "Instant Feedback",
    description:
      "Students receive immediate results with detailed feedback. Understand exactly what passed, what failed, and how to improve.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Comprehensive Reports",
    description:
      "Generate detailed grading reports with statistics, trends, and insights. Track student performance over time with visual dashboards.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: "Code Quality Analysis",
    description:
      "Evaluate code quality beyond passing tests. Check style adherence, complexity metrics, and best practice compliance.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: "Assignment Management",
    description:
      "Create, organize, and distribute assignments easily. Set deadlines, define test criteria, and manage multiple courses.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Plagiarism Detection",
    description:
      "Identify potential code similarities across submissions. Protect academic integrity with automated comparison tools.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const stats = [
  { number: "10,000+", label: "Submissions Processed" },
  { number: "500+", label: "Active Assignments" },
  { number: "95%", label: "Time Saved" },
  { number: "50+", label: "Institutions" },
];

export default function Home() {
  return (
    <>
      {/* ========================================
          HERO SECTION
          ======================================== */}
      <section
        style={{
          backgroundColor: "#fffefb",
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        <div className="container-custom">
          <div
            style={{
              maxWidth: "800px",
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
            }}
          >
            {/* Section Label */}
            <p
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#939084",
                marginBottom: "16px",
              }}
            >
              01 / Auto Grading System
            </p>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                fontWeight: 500,
                lineHeight: 0.9,
                color: "#201515",
                marginBottom: "24px",
              }}
            >
              Grading programming assignments has never been easier
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: "-0.2px",
                color: "#36342e",
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: "40px",
              }}
            >
              Automate your grading workflow. Run tests, provide instant feedback, and spend less time on repetitive tasks.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 24px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#fffefb",
                  backgroundColor: "#ff4f00",
                  border: "1px solid #ff4f00",
                  borderRadius: "4px",
                  textDecoration: "none",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e64600";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ff4f00";
                }}
              >
                Start free with email
              </Link>
              <Link
                href="/features"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px 24px",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#36342e",
                  backgroundColor: "#eceae3",
                  border: "1px solid #c5c0b1",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.backgroundColor = "#c5c0b1";
                  el.style.color = "#201515";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.backgroundColor = "#eceae3";
                  el.style.color = "#36342e";
                }}
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          STATS SECTION
          ======================================== */}
      <section
        style={{
          borderTop: "1px solid #c5c0b1",
          borderBottom: "1px solid #c5c0b1",
          padding: "48px 0",
          backgroundColor: "#fffdf9",
        }}
      >
        <div className="container-custom">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
              textAlign: "center",
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "3rem",
                    fontWeight: 500,
                    lineHeight: 1,
                    color: "#201515",
                    marginBottom: "8px",
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#939084",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          FEATURES SECTION
          ======================================== */}
      <section style={{ padding: "80px 0", backgroundColor: "#fffefb" }}>
        <div className="container-custom">
          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#939084",
                marginBottom: "12px",
              }}
            >
              02 / Features
            </p>
            <h2
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 500,
                lineHeight: 1.04,
                color: "#201515",
              }}
            >
              Everything you need to grade efficiently
            </h2>
          </div>

          {/* Features Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card"
                style={{
                  backgroundColor: "#fffefb",
                  border: "1px solid #c5c0b1",
                  borderRadius: "5px",
                  padding: "24px",
                }}
              >
                <div style={{ marginBottom: "16px" }}>{feature.icon}</div>
                <h3
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    letterSpacing: "-0.48px",
                    color: "#201515",
                    marginBottom: "8px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    color: "#36342e",
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          HOW IT WORKS SECTION
          ======================================== */}
      <section
        style={{
          padding: "80px 0",
          backgroundColor: "#fffdf9",
          borderTop: "1px solid #c5c0b1",
        }}
      >
        <div className="container-custom">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <p
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#939084",
                marginBottom: "12px",
              }}
            >
              03 / How It Works
            </p>
            <h2
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 500,
                lineHeight: 1.04,
                color: "#201515",
              }}
            >
              Three simple steps to automated grading
            </h2>
          </div>

          {/* Steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
            }}
          >
            {[
              {
                step: "01",
                title: "Upload Assignment",
                description:
                  "Create your assignment with test cases, expected outputs, and grading criteria. Set deadlines and instructions.",
              },
              {
                step: "02",
                title: "Students Submit Code",
                description:
                  "Students upload their solutions through the platform. Each submission is automatically queued for processing.",
              },
              {
                step: "03",
                title: "Get Instant Results",
                description:
                  "Tests run automatically. Students see their scores and detailed feedback immediately. You review and export.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "3rem",
                    fontWeight: 600,
                    color: "#c5c0b1",
                    marginBottom: "16px",
                    lineHeight: 1,
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#201515",
                    marginBottom: "8px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    color: "#36342e",
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CTA SECTION
          ======================================== */}
      <section
        style={{
          padding: "80px 0",
          backgroundColor: "#fffefb",
          borderTop: "1px solid #c5c0b1",
        }}
      >
        <div className="container-custom" style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 500,
              lineHeight: 1.04,
              color: "#201515",
              marginBottom: "16px",
            }}
          >
            Ready to streamline your grading?
          </h2>
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "1.25rem",
              fontWeight: 400,
              color: "#36342e",
              marginBottom: "40px",
              maxWidth: "500px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Join hundreds of educators who save hours every week with automated grading.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                backgroundColor: "#ff4f00",
                border: "1px solid #ff4f00",
                borderRadius: "4px",
                textDecoration: "none",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e64600";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ff4f00";
              }}
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 24px",
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#36342e",
                backgroundColor: "#eceae3",
                border: "1px solid #c5c0b1",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = "#c5c0b1";
                el.style.color = "#201515";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = "#eceae3";
                el.style.color = "#36342e";
              }}
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}