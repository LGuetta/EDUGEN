import { useEffect, useMemo, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import ExportOptions from "./ExportOptions";
import Storyboard from "./Storyboard";

export default function OutputPanel({ scenes, audioUrl, loading }) {
  const hasOutput = scenes.length > 0 || Boolean(audioUrl);
  const [selectedSceneId, setSelectedSceneId] = useState(null);

  useEffect(() => {
    if (!scenes.length) {
      setSelectedSceneId(null);
      return;
    }
    if (!selectedSceneId || !scenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const selectedSceneIndex = useMemo(() => {
    if (!selectedSceneId) return 0;
    const index = scenes.findIndex((scene) => scene.id === selectedSceneId);
    return index < 0 ? 0 : index;
  }, [scenes, selectedSceneId]);

  const handleSelectSceneIndex = (index) => {
    if (!scenes[index]) return;
    setSelectedSceneId(scenes[index].id);
  };

  return (
    <aside className="scroll-thin h-full overflow-y-auto pr-1">
      <Storyboard
        scenes={scenes}
        isLoading={loading}
        selectedSceneId={selectedSceneId}
        onSelectScene={setSelectedSceneId}
      />
      <AudioPlayer
        scenes={scenes}
        selectedSceneIndex={selectedSceneIndex}
        onSelectSceneIndex={handleSelectSceneIndex}
        fallbackAudioUrl={audioUrl}
      />
      <ExportOptions enabled={hasOutput} />
    </aside>
  );
}
