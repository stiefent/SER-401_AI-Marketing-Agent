import { Suspense } from "react";
import AnalyzeView from "./AnalyzeView";

// AnalyzeView reads the ?v= query parameter, so Next.js requires it
// to be wrapped in <Suspense>.
export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeView />
    </Suspense>
  );
}
