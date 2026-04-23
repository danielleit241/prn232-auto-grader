"use client";

import * as React from "react";
import { useParams } from "next/navigation";

export default function TestCasePage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const questionId = params.qid as string;

  React.useEffect(() => {
    window.location.href = `/assignments/${assignmentId}/questions/${questionId}`;
  }, [assignmentId, questionId]);

  return null;
}
