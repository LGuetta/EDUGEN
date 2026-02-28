import { motion } from "framer-motion";

const cardEntrance = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.35 },
  }),
};

export default function SceneCard({ scene, index, onClick, active }) {
  return (
    <motion.button
      custom={index}
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      type="button"
      onClick={() => onClick(scene.id)}
      className={`overflow-hidden rounded-lg border text-left transition ${
        active
          ? "border-accentPrimary/80 shadow-glow"
          : "border-borderPrimary hover:border-borderAccent hover:bg-bgHover/40"
      }`}
    >
      <img src={scene.imageUrl} alt={scene.title} className="h-24 w-full object-cover" />
      <div className="space-y-1 p-2">
        <p className="text-[11px] text-textMuted">Scene {scene.number}</p>
        <p className="truncate text-xs font-medium text-textPrimary">{scene.title}</p>
      </div>
    </motion.button>
  );
}
