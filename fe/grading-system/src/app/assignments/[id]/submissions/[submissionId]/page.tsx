"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function OldSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;

  React.useEffect(() => {
    router.replace(`/submissions/${submissionId}`);
  }, [submissionId, router]);

  return null;
}
