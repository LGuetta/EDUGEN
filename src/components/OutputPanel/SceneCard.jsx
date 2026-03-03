import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const cardEntrance = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.35 },
  }),
};

export default function SceneCard({ scene, index, onClick, active }) {
  const [imageIndex, setImageIndex] = useState(0);
  const sourceKey = useMemo(() => {
    const sources = scene.imageSources?.length
      ? scene.imageSources
      : [scene.imageUrl, scene.fallbackImageUrl].filter(Boolean);
    return sources.join("|");
  }, [scene.fallbackImageUrl, scene.imageSources, scene.imageUrl]);

  useEffect(() => {
    setImageIndex(0);
  }, [sourceKey]);

  const resolvedImage = useMemo(() => {
    const sources = scene.imageSources?.length
      ? scene.imageSources
      : [scene.imageUrl, scene.fallbackImageUrl].filter(Boolean);
    return sources[imageIndex] || scene.fallbackImageUrl || scene.imageUrl;
  }, [imageIndex, scene.fallbackImageUrl, scene.imageSources, scene.imageUrl]);

  const handleImageError = () => {
    const sources = scene.imageSources?.length
      ? scene.imageSources
      : [scene.imageUrl, scene.fallbackImageUrl].filter(Boolean);
    if (imageIndex < sources.length - 1) {
      setImageIndex((current) => current + 1);
    }
  };

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
      <img
        src={resolvedImage}
        alt={scene.title}
        className="h-24 w-full object-cover"
        onError={handleImageError}
      />
      <div className="space-y-1 p-2">
        <p className="text-[11px] text-textMuted">Scene {scene.number}</p>
        <p className="truncate text-xs font-medium text-textPrimary">{scene.title}</p>
      </div>
    </motion.button>
  );
}
