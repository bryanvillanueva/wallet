export function LoadingBar() {
  return (
    <div className="w-full">
      {/* Container con glass effect */}
      <div className="glass-card-light dark:glass-card-dark rounded-full h-2 overflow-hidden">
        {/* Barra animada */}
        <div className="h-full bg-gradient-to-r from-[#22d3ee] via-[#06b6d4] to-[#22d3ee] dark:from-[#4da3ff] dark:via-[#3b82f6] dark:to-[#4da3ff] animate-loading-bar shadow-[0_0_20px_rgba(34,211,238,0.5)] dark:shadow-[0_0_20px_rgba(77,163,255,0.5)]" />
      </div>
    </div>
  )
}
