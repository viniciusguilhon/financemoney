const MoneyLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14" };
  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size]} rounded-xl gradient-primary flex items-center justify-center relative overflow-hidden`}>
        <svg viewBox="0 0 40 40" className="w-[70%] h-[70%]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 28L16 12H20L24 22L28 12H32"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 20L14 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <circle cx="32" cy="10" r="3" fill="white" opacity="0.8" />
        </svg>
      </div>
      <span className={`font-display ${textSizes[size]} font-bold text-sidebar-foreground`}>
        Money
      </span>
    </div>
  );
};

export default MoneyLogo;
