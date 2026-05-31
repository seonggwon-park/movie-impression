import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/movies", label: "영화 둘러보기" },
  { href: "/impressions/new", label: "감상 남기기" },
  { href: "/me", label: "나의 여운" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#fff7ea]/10 bg-[#12100f]/88 backdrop-blur">
      <div className="mx-auto flex w-full flex-col gap-4 px-6 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-20">
        <Link
          href="/"
          className="text-xl font-semibold tracking-[0.08em] text-[#fff7ea]"
        >
          여운
        </Link>
        <nav aria-label="주요 메뉴" className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#e7d4c0] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
