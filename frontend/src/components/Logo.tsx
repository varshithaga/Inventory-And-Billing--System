interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textMap = {
    sm: { title: "text-xs font-black", sub: "text-[9px]" },
    md: { title: "text-sm font-black", sub: "text-[10px]" },
    lg: { title: "text-base font-black", sub: "text-[10px]" },
    xl: { title: "text-2xl font-black", sub: "text-xs" },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeMap[size]} rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-400 p-2 shadow-lg shadow-purple-600/40 text-white flex items-center justify-center shrink-0 border border-violet-400/30 relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <svg className="w-full h-full relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 35h50v45a8 8 0 01-8 8H33a8 8 0 01-8-8V35z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="4"/>
          <path d="M38 35V24a12 12 0 0124 0v11" stroke="white" strokeWidth="6" strokeLinecap="round"/>
          <path d="M55 42L42 60h12l-4 18 16-22H54l4-14z" fill="#38bdf8" stroke="#ffffff" strokeWidth="2"/>
        </svg>
      </div>

      {showText && (
        <div className="leading-tight">
          <h1 className={`${textMap[size].title} tracking-tight bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent`}>
            Inventory & POS
          </h1>
          <p className={`${textMap[size].sub} font-bold tracking-widest uppercase text-violet-300`}>
            Enterprise Suite
          </p>
        </div>
      )}
    </div>
  );
}
