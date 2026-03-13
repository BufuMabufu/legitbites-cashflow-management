import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-[80vh] w-full flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      <p className="text-muted-foreground animate-pulse text-lg font-medium">Memuat data...</p>
    </div>
  );
}
