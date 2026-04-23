"use client";

import * as React from "react";
import { useParams } from "next/navigation";

export default function AssignmentQuestionsPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  React.useEffect(() => {
    window.location.href = `/assignments/${assignmentId}?tab=questions`;
  }, [assignmentId]);

  return null;
}
