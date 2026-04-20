"use client";

import * as React from "react";

export default function OldCreatePage() {
  React.useEffect(() => {
    window.location.href = "/exam-sessions/create";
  }, []);

  return null;
}
