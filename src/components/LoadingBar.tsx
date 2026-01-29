export function LoadingBar() {
  return (
    <div className="w-full">
      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#d821f9] via-[#a018c0] to-[#d821f9] animate-loading-bar shadow-[0_0_20px_rgba(216,33,249,0.4)]" />
      </div>
    </div>
  )
}
