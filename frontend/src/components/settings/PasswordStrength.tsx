const COMMON = ["password", "12345678", "qwerty", "letmein", "welcome", "estateflow", "admin123"];

export function scorePassword(pw: string, email = ""): { score: number; hints: string[] } {
  const hints: string[] = [];
  if (pw.length < 10) hints.push("Use at least 10 characters");
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) hints.push("Mix upper and lower case");
  if (!/\d/.test(pw)) hints.push("Add a number");
  if (!/[^A-Za-z0-9]/.test(pw)) hints.push("Add a symbol");
  const lower = pw.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase();
  if (COMMON.some((c) => lower.includes(c)) || (local && local.length > 3 && lower.includes(local))) {
    hints.push("Avoid common words or your email");
  }
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (hints.includes("Avoid common words or your email")) score = Math.min(score, 1);
  return { score: Math.min(score, 4), hints };
}

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-teal-500", "bg-teal-600"];

export default function PasswordStrength({ password, email }: { password: string; email?: string }) {
  if (!password) return null;
  const { score, hints } = scorePassword(password, email);
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? COLORS[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs mt-1.5 text-slate-600">
        <span className="font-semibold">{LABELS[score]}</span>
        {hints.length > 0 && <span className="text-slate-400"> · {hints[0]}</span>}
      </p>
    </div>
  );
}
