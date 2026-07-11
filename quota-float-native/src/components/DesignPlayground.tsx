import { useMemo, useState, type CSSProperties } from "react";
import type { ProviderSnapshot, WidgetPreferences } from "../types";
import { QuotaCard, QuotaOrb } from "./QuotaCard";

const preview: ProviderSnapshot = {
  provider: "codex",
  displayName: "CODEX",
  plan: "PRO",
  shortWindow: { remainingPercent: 74, resetsAt: new Date(Date.now() + 78 * 60_000).toISOString(), windowSeconds: 18_000 },
  weeklyWindow: { remainingPercent: 42, resetsAt: new Date(Date.now() + 3.2 * 86_400_000).toISOString(), windowSeconds: 604_800 },
  resetCredits: 1,
  resetCreditExpiresAt: [new Date(Date.now() + 9 * 86_400_000).toISOString()],
  updatedAt: new Date().toISOString(),
  status: "ok",
  message: null,
};
const preferences: WidgetPreferences = { locked: false, alwaysOnTop: true, pinnedProvider: "codex", autoRotateSeconds: 12, language: "zh-CN" };

interface Values {
  radius: number;
  numberSize: number;
  progressHeight: number;
}

type PreviewMode = 74 | 35 | 8 | "unavailable" | "stale" | "signed_out" | "orb";

const previewModes: Array<{ value: PreviewMode; label: string }> = [
  { value: 74, label: "74% 充足" },
  { value: 35, label: "35% 提醒" },
  { value: 8, label: "8% 紧张" },
  { value: "unavailable", label: "暂时不可用" },
  { value: "stale", label: "数据过期" },
  { value: "signed_out", label: "未登录" },
  { value: "orb", label: "收起态" },
];

const defaults: Values = { radius: 28, numberSize: 42, progressHeight: 5 };

function initialPreviewMode(): PreviewMode {
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "healthy") return 74;
  if (mode === "caution") return 35;
  if (mode === "critical") return 8;
  if (mode === "unavailable" || mode === "stale" || mode === "signed_out" || mode === "orb") return mode;
  return 74;
}

export function DesignPlayground() {
  const [values, setValues] = useState(defaults);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(() => initialPreviewMode());
  const params = new URLSearchParams(window.location.search);
  const screenshotMode = params.has("shot");
  const shotKind = params.get("shot");
  const showCreditTip = params.has("creditTip");
  const style = useMemo(() => ({
    "--card-radius": `${values.radius}px`,
    "--number-size": `${values.numberSize}px`,
    "--progress-height": `${values.progressHeight}px`,
  }) as CSSProperties, [values]);

  const makePreview = (mode: PreviewMode): ProviderSnapshot => {
    if (mode === "orb") return preview;
    if (typeof mode === "number") {
      return { ...preview, shortWindow: preview.shortWindow ? { ...preview.shortWindow, remainingPercent: mode } : null };
    }
    if (mode === "stale") {
      return { ...preview, status: "stale", updatedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(), message: "额度刷新失败，请稍后重试。" };
    }
    return {
      ...preview,
      status: mode,
      shortWindow: null,
      weeklyWindow: null,
      resetCredits: null,
      message: mode === "signed_out" ? "Codex 登录已失效，请重新登录。" : "额度暂时不可用，将自动重试。",
    };
  };

  const activePreview = useMemo<ProviderSnapshot>(() => makePreview(previewMode), [previewMode]);

  const update = <K extends keyof Values>(key: K, value: Values[K]) => setValues((current) => ({ ...current, [key]: value }));

  if (screenshotMode) {
    if (shotKind === "states") {
      return (
        <div className="screenshot-stage screenshot-stage--states" style={style}>
          {[74, 35, 8].map((mode) => (
            <div className="design-card-frame" key={mode}>
              <QuotaCard snapshot={makePreview(mode as PreviewMode)} preferences={preferences} providerCount={1} onPrevious={() => {}} onNext={() => {}} onTogglePin={() => {}} onLock={() => {}} onDrag={() => {}} onHover={() => {}} isConsuming={mode === 35} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="screenshot-stage" style={style}>
        <div className={previewMode === "orb" ? "design-orb-frame" : "design-card-frame"}>
          {previewMode === "orb"
            ? <QuotaOrb snapshot={activePreview} onDrag={() => {}} onHover={() => {}} />
            : <QuotaCard snapshot={activePreview} preferences={preferences} providerCount={1} onPrevious={() => {}} onNext={() => {}} onTogglePin={() => {}} onLock={() => {}} onDrag={() => {}} onHover={() => {}} initialShowCreditTip={showCreditTip} />}
        </div>
      </div>
    );
  }

  return (
    <div className="design-workbench">
      <section className="design-stage" style={style}>
        <div className="design-preview-switch" aria-label="额度状态预览">
          {previewModes.map((mode) => (
            <button key={mode.value} className={previewMode === mode.value ? "is-active" : ""} onClick={() => setPreviewMode(mode.value)}>{mode.label}</button>
          ))}
        </div>
        <div className={previewMode === "orb" ? "design-orb-frame" : "design-card-frame"}>
          {previewMode === "orb"
            ? <QuotaOrb snapshot={activePreview} onDrag={() => {}} onHover={() => {}} />
            : <QuotaCard snapshot={activePreview} preferences={preferences} providerCount={1} onPrevious={() => {}} onNext={() => {}} onTogglePin={() => {}} onLock={() => {}} onDrag={() => {}} onHover={() => {}} />}
        </div>
      </section>
      <aside className="design-controls">
        <div>
          <p className="design-kicker">QUOTA FLOAT</p>
          <h1>视觉调试</h1>
          <p className="design-description">实时检查不同额度状态下的悬浮窗布局。</p>
        </div>
        <Range label="圆角" value={values.radius} min={20} max={40} unit="px" onChange={(v) => update("radius", v)} />
        <Range label="主数字" value={values.numberSize} min={32} max={52} unit="px" onChange={(v) => update("numberSize", v)} />
        <Range label="进度条" value={values.progressHeight} min={3} max={8} unit="px" onChange={(v) => update("progressHeight", v)} />
        <button className="reset-design" onClick={() => setValues(defaults)}>恢复默认值</button>
      </aside>
    </div>
  );
}

function Range({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <label className="range-control"><span>{label}<output>{value}{unit}</output></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
