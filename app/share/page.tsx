import { computeGarden } from "@/lib/plant";
import ShareCard from "@/components/ShareCard";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const garden = await computeGarden();
  return (
    <div className="min-h-screen bg-grid grid place-items-center p-4">
      <ShareCard garden={garden} />
    </div>
  );
}