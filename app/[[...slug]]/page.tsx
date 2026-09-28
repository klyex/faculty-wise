"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const App = dynamic(() => import("@/components/App"), { ssr: false });

export default function CatchAllPage() {
  return <App />;
}
