export default function Loading() {
  return (
    <div className="container-page pt-6">
      <div className="skeleton h-[50vh] w-full rounded-2xl" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[2/3] rounded-xl" />
            <div className="skeleton mt-2.5 h-4 w-3/4 rounded" />
            <div className="skeleton mt-1.5 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
