import FlowGraph from "./FlowGraph";

export default function PipelineVisualizer({ steps, currentStep, progress }) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="section-title">PIPELINE VISUALIZER</p>
          <p className="mt-1 text-sm text-textSecondary">{currentStep}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-textMuted">Progress</p>
          <p className="text-sm font-semibold text-accentInfo">{progress}%</p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <FlowGraph steps={steps} />
      </div>
    </section>
  );
}
