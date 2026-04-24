"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Menu, X } from "lucide-react";

const navItems = siteConfig.navItems;

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

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          className="hidden md:flex"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

        <div style={{ display: "flex", alignItems: "center" }} />
      </div>


    </header>
  );
}
