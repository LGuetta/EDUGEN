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
  onStyleChange,
  onVideoPresetChange,
  onFilePicked,
  onUseDemoPdf,
  onRemoveFile,
  onGenerate,
  pipelineStatus,
  progress,
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
      <Metadata pdf={pdf} analysis={analysis} />
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
      <GenerateButton
        canGenerate={Boolean(pdf.file)}
        status={pipelineStatus}
        progress={progress}
        onClick={onGenerate}
      />
    </aside>
  );
}
