"use client";

import * as React from "react";
import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Sessions", href: "/exam-sessions" },
    { label: "Submissions", href: "/submissions" },
    { label: "Exports", href: "/exports" },
  ],
  resources: [
    { label: "API Docs", href: "/api" },
    { label: "Support", href: "/support" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#201515",
        color: "#fffefb",
        paddingTop: "80px",
        paddingBottom: "48px",
        borderTop: "1px solid #36342e",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "48px",
            marginBottom: "64px",
          }}
          className="grid-footer"
        >
          <div>
            <h4
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                marginBottom: "16px",
              }}
            >
              Product
            </h4>
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "#c5c0b1",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = "#fffefb";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = "#c5c0b1";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                marginBottom: "16px",
              }}
            >
              Resources
            </h4>
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "Inter, Arial, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "#c5c0b1",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = "#fffefb";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = "#c5c0b1";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#fffefb",
                marginBottom: "16px",
              }}
            >
              PRN232
            </h4>
            <p
              style={{
                fontFamily: "Inter, Arial, sans-serif",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "#c5c0b1",
                lineHeight: 1.6,
              }}
            >
              Automated grading system for PRN232 programming assignments.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #36342e",
            paddingTop: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 400,
              color: "#c5c0b1",
            }}
          >
            &copy; {new Date().getFullYear()} PRN232 Auto Grader. All rights
            reserved.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-footer {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .grid-footer {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
