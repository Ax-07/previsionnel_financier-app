"use client";

import RapportEditor from "@/components/app/rapports/rapport-editor";

interface RapportsTabProps {
  dossierId: string;
}

export default function RapportsTab({ dossierId }: RapportsTabProps) {
  return <RapportEditor dossierId={dossierId} />;
}

