const MoneyLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "w-8 h-8", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-xl" };

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${sizes[size]} rounded-xl gradient-primary flex items-center justify-center relative overflow-hidden shadow-lg`}>
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 60%)" }} />
        <svg viewBox="0 0 40 40" className="w-[65%] h-[65%] relative z-[1]" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dollar sign stylized */}
          <path
            d="M20 6V34"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M14 14C14 11.2 16.7 9 20 9C23.3 9 26 11.2 26 14C26 17.5 20 18.5 20 20"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 20C20 21.5 14 22.5 14 26C14 28.8 16.7 31 20 31C23.3 31 26 28.8 26 26"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Accent sparkle */}
          <circle cx="30" cy="10" r="2" fill="white" opacity="0.7" />
          <circle cx="28" cy="8" r="1" fill="white" opacity="0.4" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-display ${textSizes[size]} font-extrabold tracking-tight text-foreground`}>
          Money
        </span>
        <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-primary opacity-80">
          Finance
        </span>
      </div>
    </div>
  );
};

export default MoneyLogo;
