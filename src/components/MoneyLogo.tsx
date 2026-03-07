import logoIcon from "@/assets/logo-icon.png";

const MoneyLogo = ({ size = "md", hideText = false }: { size?: "sm" | "md" | "lg"; hideText?: boolean }) => {
  const sizes = { sm: "w-8 h-8", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-xl" };

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${sizes[size]} rounded-xl overflow-hidden shadow-lg`}>
        <img src={logoIcon} alt="Finanças PRO" className="w-full h-full object-cover" />
      </div>
      {!hideText && (
        <div className="flex flex-col leading-none">
          <span className={`font-display ${textSizes[size]} font-extrabold tracking-tight text-foreground`}>
            Finanças
          </span>
          <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-primary opacity-80">
            PRO
          </span>
        </div>
      )}
    </div>
  );
};

export default MoneyLogo;
