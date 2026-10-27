import { DetailSkeleton } from "@/components/app/page-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6">
      <DetailSkeleton />
    </div>
  );
}
