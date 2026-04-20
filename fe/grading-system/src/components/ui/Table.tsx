"use client";

import * as React from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
}: TableProps<T>) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid #c5c0b1",
        borderRadius: "5px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "0.9375rem",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#fffdf9",
              borderBottom: "1px solid #c5c0b1",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "#36342e",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "48px 16px",
                  textAlign: "center",
                  color: "#939084",
                  fontFamily: "Inter, Arial, sans-serif",
                  fontSize: "0.9375rem",
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                style={{
                  borderBottom: "1px solid #eceae3",
                  backgroundColor:
                    index % 2 === 0 ? "#fffefb" : "#fffdf9",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color 0.1s ease",
                  ...(onRowClick
                    ? {
                        onMouseEnter: (e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "#eceae3";
                        },
                        onMouseLeave: (e: React.MouseEvent) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            index % 2 === 0 ? "#fffefb" : "#fffdf9";
                        },
                      }
                    : {}),
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "12px 16px",
                      color: "#36342e",
                      verticalAlign: "middle",
                    }}
                  >
                    {col.render
                      ? col.render(item, index)
                      : String(
                          (item as Record<string, unknown>)[col.key] ?? ""
                        )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
