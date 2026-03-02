import CustomPrompt from "./CustomPrompt";
import GenerateButton from "./GenerateButton";
import Metadata from "./Metadata";
import PDFUploader from "./PDFUploader";
import StyleEngine from "./StyleEngine";
import VideoStructure from "./VideoStructure";

export default function InputPanel({
  pdf,
  analysis,
  selectedStyle,
  selectedVideoPreset,
  customPrompt,
  archiveInsights,
  onStyleChange,
  onVideoPresetChange,
  onCustomPromptChange,
  onFilePicked,
  onUseDemoPdf,
  onRemoveFile,
  onGenerate,
  pipelineStatus,
  progress,
  demoMode = false,
}) {
  return (
    <aside className="scroll-thin h-full overflow-y-auto pr-1">
      <PDFUploader
        pdf={pdf}
        onFilePicked={onFilePicked}
        onUseDemoPdf={onUseDemoPdf}
        onRemove={onRemoveFile}
        disabled={pipelineStatus === "processing"}
      />
      <StyleEngine
        selected={selectedStyle}
        onChange={onStyleChange}
        disabled={pipelineStatus === "processing"}
      />
      <VideoStructure
        selected={selectedVideoPreset}
        onChange={onVideoPresetChange}
        disabled={pipelineStatus === "processing"}
      />
      <CustomPrompt
        value={customPrompt}
        onChange={onCustomPromptChange}
        disabled={pipelineStatus === "processing"}
      />
      <Metadata pdf={pdf} analysis={analysis} archiveInsights={archiveInsights} />
      <GenerateButton
        canGenerate={Boolean(pdf.file)}
        status={pipelineStatus}
        progress={progress}
        demoMode={demoMode}
        onClick={onGenerate}
      />
    </aside>
  );
}
