import { Clapperboard, Film, PlaySquare, ScrollText } from "lucide-react";

const VIDEO_OPTIONS = [
  {
    id: "didattico",
    title: "Didattico",
    description: "Alternanza narrazione e dati tecnici",
    icon: Clapperboard,
  },
  {
    id: "narrativo",
    title: "Narrativo",
    description: "Storytelling fluido, tono poetico",
    icon: ScrollText,
  },
  {
    id: "documentario",
    title: "Documentario",
    description: "Voice over continuo, ritmo lento",
    icon: Film,
  },
  {
    id: "flash",
    title: "Flash",
    description: "Breve e dinamico, social-friendly",
    icon: PlaySquare,
  },
];

export default function VideoStructure({ selected, onChange, disabled }) {
  return (
    <section className="panel mt-3 p-4">
      <p className="section-title mb-1">STRUTTURA VIDEO</p>
      <p className="mb-3 text-xs text-textMuted">Preset narrativo</p>

      <div className="space-y-2">
        {VIDEO_OPTIONS.map((option) => {
          const Icon = option.icon;
          const checked = selected === option.id;
          return (
            <label
              key={option.id}
              title={option.description}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                checked
                  ? "border-accentPrimary bg-accentPrimary/10"
                  : "border-borderPrimary bg-bgPrimary/35 hover:border-borderAccent"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                className="h-4 w-4 accent-accentPrimary"
                name="video-structure"
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.id)}
              />
              <div className="grid h-8 w-8 place-items-center rounded bg-bgTertiary text-accentInfo">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-textPrimary">{option.title}</p>
                <p className="truncate text-xs text-textMuted">{option.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
