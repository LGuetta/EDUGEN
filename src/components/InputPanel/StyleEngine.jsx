import { FlaskConical, Landmark, Palette, Wrench } from "lucide-react";

const STYLE_OPTIONS = [
  {
    id: "acquarello",
    title: "Illustrato",
    icon: Landmark,
  },
  {
    id: "vettoriale",
    title: "Vettoriale",
    icon: FlaskConical,
  },
  {
    id: "fotorealistico",
    title: "Fotorealistico",
    icon: Palette,
  },
  {
    id: "custom",
    title: "Custom LoRA",
    icon: Wrench,
    disabled: true,
  },
];

export default function StyleEngine({ selected, onChange, disabled }) {
  return (
    <section className="panel mt-3 p-4">
      <p className="section-title mb-3">STILE VISIVO</p>

      <div className="space-y-2">
        {STYLE_OPTIONS.map((style) => {
          const Icon = style.icon;
          const checked = selected === style.id;
          const isDisabled = Boolean(style.disabled) || disabled;
          return (
            <label
              key={style.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${checked
                  ? "border-accentPrimary bg-accentPrimary/10"
                  : "border-borderPrimary bg-bgPrimary/35 hover:border-borderAccent"
                } ${isDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                className="h-4 w-4 accent-accentPrimary"
                name="style-engine"
                checked={checked}
                disabled={isDisabled}
                onChange={() => onChange(style.id)}
              />
              <div className="grid h-8 w-8 place-items-center rounded bg-bgTertiary text-accentInfo">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-textPrimary">{style.title}</p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
