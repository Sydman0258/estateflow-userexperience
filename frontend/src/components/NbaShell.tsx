import Navbar from "@/components/Navbar";
import SubNav from "@/components/SubNav";

export default function NbaShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>
        <div className="forecast-wrap">
          <SubNav />
          <h2>{title}</h2>
          {lede && <p className="lede">{lede}</p>}
          {children}
        </div>
      </main>
    </>
  );
}
