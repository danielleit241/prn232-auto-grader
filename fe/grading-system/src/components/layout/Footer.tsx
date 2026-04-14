"use client";

import * as React from "react";
import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Assignments", href: "/assignments" },
    { label: "Submissions", href: "/submissions" },
    { label: "Grading", href: "/grading" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/api" },
    { label: "Support", href: "/support" },
    { label: "Status", href: "/status" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
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
        {/* Footer Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "48px",
            marginBottom: "64px",
          }}
          className="grid-footer"
        >
          {/* Product Links */}
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
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", margin: 0, padding: 0 }}>
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

          {/* Resources Links */}
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
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", margin: 0, padding: 0 }}>
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

          {/* Company Links */}
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
              Company
            </h4>
            <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", margin: 0, padding: 0 }}>
              {footerLinks.company.map((link) => (
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
        </div>

        {/* Bottom Divider */}
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
          {/* Copyright */}
          <p
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 400,
              color: "#c5c0b1",
            }}
          >
            &copy; {new Date().getFullYear()} PRN232 Auto Grader. All rights reserved.
          </p>

          {/* Social Icons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                border: "1px solid #c5c0b1",
                background: "transparent",
                color: "#fffefb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "rgba(197, 192, 177, 0.15)";
                el.style.borderColor = "#fffefb";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "transparent";
                el.style.borderColor = "#c5c0b1";
              }}
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
            <button
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                border: "1px solid #c5c0b1",
                background: "transparent",
                color: "#fffefb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "rgba(197, 192, 177, 0.15)";
                el.style.borderColor = "#fffefb";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "transparent";
                el.style.borderColor = "#c5c0b1";
              }}
              aria-label="Twitter"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.907z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive styles via style tag */}
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