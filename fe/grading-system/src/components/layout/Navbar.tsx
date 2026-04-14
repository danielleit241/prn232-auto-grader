"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Assignments", href: "/assignments" },
  { label: "Submissions", href: "/submissions" },
  { label: "Grading", href: "/grading" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backgroundColor: "#fffefb",
        borderBottom: "1px solid #c5c0b1",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#ff4f00",
              fontFamily: "Inter, Helvetica, Arial, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            PRN
          </span>
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#201515",
              fontFamily: "Inter, Helvetica, Arial, sans-serif",
            }}
          >
            Auto Grader
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          className="hidden md:flex"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  fontFamily: "Inter, Helvetica, Arial, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#201515",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  boxShadow: isActive
                    ? "rgb(255, 79, 0) 0px -4px 0px 0px inset"
                    : "transparent 0px -4px 0px 0px inset",
                  transition: "box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.boxShadow =
                      "rgb(197, 192, 177) 0px -4px 0px 0px inset";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.boxShadow =
                      "transparent 0px -4px 0px 0px inset";
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side - Login CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "6px 12px",
              fontFamily: "Inter, Helvetica, Arial, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fffefb",
              backgroundColor: "#ff4f00",
              border: "1px solid #ff4f00",
              borderRadius: "4px",
              cursor: "pointer",
              textDecoration: "none",
              transition: "background-color 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e64600";
              e.currentTarget.style.borderColor = "#e64600";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff4f00";
              e.currentTarget.style.borderColor = "#ff4f00";
            }}
          >
            Login
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            style={{
              background: "transparent",
              border: "1px solid #c5c0b1",
              borderRadius: "5px",
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#201515",
              transition: "border-color 0.15s ease",
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            borderTop: "1px solid #c5c0b1",
            padding: "16px 24px",
            backgroundColor: "#fffefb",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    fontFamily: "Inter, Helvetica, Arial, sans-serif",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "#201515",
                    textDecoration: "none",
                    textAlign: "left",
                    borderRadius: "8px",
                    boxShadow: isActive
                      ? "rgb(255, 79, 0) 0px -4px 0px 0px inset"
                      : "transparent 0px -4px 0px 0px inset",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #c5c0b1",
              }}
            >
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "center",
                  padding: "8px 16px",
                  fontFamily: "Inter, Helvetica, Arial, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#fffefb",
                  backgroundColor: "#ff4f00",
                  border: "1px solid #ff4f00",
                  borderRadius: "4px",
                  textDecoration: "none",
                  transition: "background-color 0.15s ease",
                }}
              >
                Login
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}