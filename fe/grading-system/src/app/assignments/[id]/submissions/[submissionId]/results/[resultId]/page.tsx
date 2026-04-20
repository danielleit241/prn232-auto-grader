"use client";

import * as React from "react";
import { useParams } from "next/navigation";

export default function ResultPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;

  React.useEffect(() => {
    window.location.href = `/submissions/${submissionId}`;
  }, [submissionId]);

  return null;
}
