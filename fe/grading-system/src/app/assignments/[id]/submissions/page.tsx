"use client";

import * as React from "react";
import { useParams } from "next/navigation";

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  React.useEffect(() => {
    window.location.href = `/assignments/${assignmentId}?tab=submissions`;
  }, [assignmentId]);

  return null;
}
