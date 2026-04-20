"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AssignmentExportPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  React.useEffect(() => {
    router.replace(`/assignments/${assignmentId}?tab=export`);
  }, [assignmentId, router]);

  return (
    <div style={{ padding: "80px 24px" }}>
      <LoadingSpinner label="Redirecting..." />
    </div>
  );
}
