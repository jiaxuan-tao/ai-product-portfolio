import {
  ArrowLeft,
  ArrowsOutSimple,
  BracketsCurly,
  Briefcase,
  CaretDown,
  ChartBar,
  Check,
  ChatCircleDots,
  ClockCounterClockwise,
  Code,
  Copy,
  DownloadSimple,
  FilePlus,
  FloppyDisk,
  FolderOpen,
  GearSix,
  ListBullets,
  MagnifyingGlass,
  Moon,
  Note,
  PenNib,
  PencilSimple,
  Plus,
  Sparkle,
  SquaresFour,
  Star,
  Sun,
  Tag,
  Target,
  Trash,
  UploadSimple,
  User,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useLiveQuery } from "dexie-react-hooks";
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createBackup, db, deletePrompt, deleteScene, importBackup, seedDatabase } from "./db";
import type { ImportMode, PromptBackup, PromptItem, PromptVersion, Scene, SceneIcon } from "./types";
import { formatDate, newId, nextVersion, normalizeBackup, textSnippet } from "./utils";

const iconMap = {
  briefcase: Briefcase,
  code: Code,
  pen: PenNib,
  chart: ChartBar,
  sparkle: Sparkle,
  target: Target,
};

const colorChoices = ["#6d5dfc", "#16a7a1", "#e765a3", "#f29b45", "#4d82e8", "#df5d67"];

type ModalState =
  | { type: "scene"; scene?: Scene }
  | { type: "prompt" }
  | { type: "version" }
  | { type: "import"; backup: PromptBackup }
  | { type: "delete-scene"; scene: Scene }
  | { type: "delete-prompt"; prompt: PromptItem }
  | null;

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function SceneGlyph({ scene, size = 19 }: { scene: Scene; size?: number }) {
  const Glyph = iconMap[scene.icon] ?? Briefcase;
  return <Glyph size={size} weight="duotone" />;
}

function Toast({ message }: { message: string }) {
  return (
    <div className="toast" role="status">
      <Check size={18} weight="bold" />
      {message}
    </div>
  );
}

export function App() {
  const scenes = useLiveQuery(() => db.scenes.orderBy("createdAt").toArray(), [], []);
  const prompts = useLiveQuery(() => db.prompts.orderBy("updatedAt").reverse().toArray(), [], []);
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const versions = useLiveQuery(
    () => (selectedPromptId ? db.versions.where("promptId").equals(selectedPromptId).sortBy("createdAt") : []),
    [selectedPromptId],
    [],
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("prompt-manager-theme") === "dark" ? "dark" : "light",
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void seedDatabase();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("prompt-manager-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!selectedSceneId && scenes.length) setSelectedSceneId(scenes[0].id);
    if (selectedSceneId && scenes.length && !scenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedPromptId);

  useEffect(() => {
    if (selectedPrompt) setEditorContent(selectedPrompt.content);
    setPreviewVersionId(null);
  }, [selectedPrompt?.id]);

  useEffect(() => {
    if (!selectedPrompt || previewVersionId || editorContent === selectedPrompt.content) return;
    const timer = window.setTimeout(() => {
      void db.prompts.update(selectedPrompt.id, { content: editorContent, updatedAt: new Date().toISOString() });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [editorContent, previewVersionId, selectedPrompt]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && selectedPromptId) {
        event.preventDefault();
        setModal({ type: "version" });
      }
      if (event.key === "Escape" && editorFullscreen) setEditorFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editorFullscreen, selectedPromptId]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const sceneCount = useMemo(() => {
    const counts = new Map<string, number>();
    prompts.forEach((prompt) => counts.set(prompt.sceneId, (counts.get(prompt.sceneId) ?? 0) + 1));
    return counts;
  }, [prompts]);

  const visiblePrompts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-CN");
    if (needle) {
      return prompts.filter((prompt) => {
        const scene = scenes.find((item) => item.id === prompt.sceneId);
        return [prompt.title, prompt.summary, prompt.content, prompt.tags.join(" "), scene?.name ?? ""]
          .join(" ")
          .toLocaleLowerCase("zh-CN")
          .includes(needle);
      });
    }
    return prompts.filter((prompt) => prompt.sceneId === selectedSceneId);
  }, [prompts, query, scenes, selectedSceneId]);

  const openPrompt = (prompt: PromptItem) => {
    setSelectedPromptId(prompt.id);
    setSelectedSceneId(prompt.sceneId);
    setQuery("");
  };

  const copyPrompt = async (prompt: PromptItem) => {
    await navigator.clipboard.writeText(prompt.content);
    notify("提示词已复制");
  };

  const exportData = async () => {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `prompt-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("完整数据已导出");
  };

  const readImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const backup = normalizeBackup(JSON.parse(await file.text()));
      setModal({ type: "import", backup });
    } catch (error) {
      notify(error instanceof Error ? error.message : "导入文件无法读取");
    }
  };

  if (!scenes.length) {
    return (
      <main className="loading-screen">
        <div className="brand-mark"><BracketsCurly size={25} weight="bold" /></div>
        <p>正在打开你的提示词库…</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSelectedPromptId(null)}>
          <span className="brand-mark"><BracketsCurly size={24} weight="bold" /></span>
          <span>Prompt Manager</span>
        </button>
        <label className="search-box">
          <MagnifyingGlass size={21} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value) setSelectedPromptId(null);
            }}
            placeholder="搜索场景、提示词或标签…"
          />
          <kbd>⌘ K</kbd>
        </label>
        <nav className="top-actions" aria-label="全局操作">
          <button onClick={() => void exportData()}><DownloadSimple size={19} />导出</button>
          <button onClick={() => importInputRef.current?.click()}><UploadSimple size={19} />导入</button>
          <input ref={importInputRef} type="file" accept="application/json" hidden onChange={(event) => void readImport(event)} />
          <a href="https://github.com/jiaxuan-tao/prompt-manager/issues" target="_blank" rel="noreferrer">
            <ChatCircleDots size={19} />意见反馈
          </a>
          <span className="author"><User size={18} />Jiaxuan Tao</span>
          <button className="theme-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="切换主题">
            {theme === "light" ? <Moon size={21} /> : <Sun size={21} />}
          </button>
        </nav>
      </header>

      {selectedPrompt ? (
        <PromptDetail
          prompt={selectedPrompt}
          scene={scenes.find((scene) => scene.id === selectedPrompt.sceneId)!}
          versions={versions}
          editorContent={editorContent}
          previewVersionId={previewVersionId}
          fullscreen={editorFullscreen}
          onBack={() => setSelectedPromptId(null)}
          onContentChange={setEditorContent}
          onPreview={(version) => {
            setPreviewVersionId(version.id);
            setEditorContent(version.content);
          }}
          onCancelPreview={() => {
            setPreviewVersionId(null);
            setEditorContent(selectedPrompt.content);
          }}
          onRestore={async (version) => {
            const number = nextVersion(selectedPrompt.currentVersion);
            const now = new Date().toISOString();
            await db.transaction("rw", db.prompts, db.versions, async () => {
              await db.versions.add({
                id: newId("version"),
                promptId: selectedPrompt.id,
                number,
                content: version.content,
                note: `恢复自 ${version.number}`,
                createdAt: now,
              });
              await db.prompts.update(selectedPrompt.id, { content: version.content, currentVersion: number, updatedAt: now });
            });
            setPreviewVersionId(null);
            setEditorContent(version.content);
            notify(`已生成 ${number}`);
          }}
          onSaveVersion={() => setModal({ type: "version" })}
          onToggleFavorite={() => void db.prompts.update(selectedPrompt.id, { isFavorite: !selectedPrompt.isFavorite })}
          onCopy={() => void copyPrompt(selectedPrompt)}
          onDelete={() => setModal({ type: "delete-prompt", prompt: selectedPrompt })}
          onFullscreen={() => setEditorFullscreen(!editorFullscreen)}
          onTagsChange={(tags) => void db.prompts.update(selectedPrompt.id, { tags })}
          onNoteChange={(noteText) => void db.prompts.update(selectedPrompt.id, { note: noteText, updatedAt: new Date().toISOString() })}
          onTitleChange={(title) => void db.prompts.update(selectedPrompt.id, { title, updatedAt: new Date().toISOString() })}
        />
      ) : (
        <div className="library-layout">
          <aside className="scene-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">知识资产</p>
                <h1>场景管理</h1>
              </div>
              <button className="primary-button compact" onClick={() => setModal({ type: "scene" })}>
                <Plus size={18} weight="bold" />新建
              </button>
            </div>
            <div className="scene-list">
              {scenes.map((scene) => (
                <article
                  className={`scene-card ${scene.id === selectedSceneId && !query ? "selected" : ""}`}
                  key={scene.id}
                  tabIndex={0}
                  onClick={() => {
                    setSelectedSceneId(scene.id);
                    setQuery("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setSelectedSceneId(scene.id);
                      setQuery("");
                    }
                  }}
                >
                  <span className="scene-stripe" style={{ backgroundColor: scene.color }} />
                  <div className="scene-icon" style={{ color: scene.color, backgroundColor: `${scene.color}16` }}>
                    <SceneGlyph scene={scene} />
                  </div>
                  <div className="scene-copy">
                    <div className="scene-title-row">
                      <h2>{scene.name}</h2>
                      <span>{sceneCount.get(scene.id) ?? 0} 个提示词</span>
                    </div>
                    <p>{scene.description}</p>
                  </div>
                  <div className="scene-card-actions">
                    <button aria-label="编辑场景" onClick={(event) => { event.stopPropagation(); setModal({ type: "scene", scene }); }}><PencilSimple size={17} /></button>
                    <button aria-label="删除场景" onClick={(event) => { event.stopPropagation(); setModal({ type: "delete-scene", scene }); }}><Trash size={17} /></button>
                  </div>
                </article>
              ))}
            </div>
            <div className="privacy-note">
              <span><FolderOpen size={19} weight="duotone" /></span>
              <div><strong>本地优先</strong><p>所有内容仅保存在当前浏览器</p></div>
            </div>
          </aside>

          <main className="prompt-panel">
            <div className="prompt-heading">
              <div>
                <p className="eyebrow">{query ? "全文检索" : "当前场景"}</p>
                <h1>{query ? `“${query}” 的搜索结果` : selectedScene?.name}</h1>
                <p>{visiblePrompts.length} 个提示词{!query && selectedScene ? ` · ${selectedScene.description}` : ""}</p>
              </div>
              <div className="prompt-heading-actions">
                {!query && <button className="primary-button" onClick={() => setModal({ type: "prompt" })}><FilePlus size={19} />新建提示词</button>}
                <div className="view-switcher" aria-label="视图切换">
                  <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="卡片视图"><SquaresFour size={19} /></button>
                  <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="列表视图"><ListBullets size={19} /></button>
                </div>
              </div>
            </div>
            {visiblePrompts.length ? (
              <div className={`prompt-grid ${view === "list" ? "list-view" : ""}`}>
                {visiblePrompts.map((prompt) => {
                  const scene = scenes.find((item) => item.id === prompt.sceneId)!;
                  return (
                    <article className="prompt-card" key={prompt.id} tabIndex={0} onClick={() => openPrompt(prompt)} onKeyDown={(event) => { if (event.key === "Enter") openPrompt(prompt); }}>
                      <div className="card-topline">
                        <span className="card-scene"><SceneGlyph scene={scene} size={16} />{scene.name}</span>
                        <button
                          className={`favorite-button ${prompt.isFavorite ? "active" : ""}`}
                          aria-label={prompt.isFavorite ? "取消收藏" : "收藏"}
                          onClick={(event) => {
                            event.stopPropagation();
                            void db.prompts.update(prompt.id, { isFavorite: !prompt.isFavorite });
                          }}
                        ><Star size={19} weight={prompt.isFavorite ? "fill" : "regular"} /></button>
                      </div>
                      <h2>{prompt.title}</h2>
                      <p className="prompt-summary">{prompt.summary || textSnippet(prompt.content)}</p>
                      <div className="tag-row">
                        {prompt.tags.slice(0, 3).map((tagText) => <span key={tagText}>{tagText}</span>)}
                      </div>
                      <footer>
                        <span># {prompt.currentVersion}</span>
                        <span><ClockCounterClockwise size={15} />{formatDate(prompt.updatedAt)}</span>
                        <button onClick={(event) => { event.stopPropagation(); void copyPrompt(prompt); }}><Copy size={17} />复制</button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <span><MagnifyingGlass size={32} /></span>
                <h2>{query ? "没有匹配的提示词" : "这个场景还是空的"}</h2>
                <p>{query ? "试试标题、正文、标签或场景名称" : "创建第一条提示词，开始沉淀可复用的工作方法。"}</p>
                {!query && <button className="primary-button" onClick={() => setModal({ type: "prompt" })}><Plus size={18} />新建提示词</button>}
              </div>
            )}
          </main>
        </div>
      )}

      {modal?.type === "scene" && (
        <SceneForm scene={modal.scene} onClose={() => setModal(null)} onSaved={(sceneId) => { setSelectedSceneId(sceneId); setModal(null); notify(modal.scene ? "场景已更新" : "场景已创建"); }} />
      )}
      {modal?.type === "prompt" && selectedScene && (
        <PromptForm scene={selectedScene} onClose={() => setModal(null)} onSaved={(promptId) => { setSelectedPromptId(promptId); setModal(null); notify("提示词已创建"); }} />
      )}
      {modal?.type === "version" && selectedPrompt && (
        <VersionForm
          prompt={selectedPrompt}
          content={editorContent}
          onClose={() => setModal(null)}
          onSaved={(number) => { setModal(null); setPreviewVersionId(null); notify(`已保存 ${number}`); }}
        />
      )}
      {modal?.type === "import" && (
        <ImportPreview backup={modal.backup} onClose={() => setModal(null)} onImported={() => { setModal(null); setSelectedPromptId(null); notify("数据导入完成"); }} />
      )}
      {modal?.type === "delete-scene" && (
        <ConfirmDelete
          title="删除场景？"
          description={`“${modal.scene.name}”及其中的 ${sceneCount.get(modal.scene.id) ?? 0} 条提示词和全部版本都会被永久删除。`}
          onClose={() => setModal(null)}
          onConfirm={async () => { await deleteScene(modal.scene.id); setModal(null); notify("场景已删除"); }}
        />
      )}
      {modal?.type === "delete-prompt" && (
        <ConfirmDelete
          title="删除提示词？"
          description={`“${modal.prompt.title}”及其全部历史版本都会被永久删除。`}
          onClose={() => setModal(null)}
          onConfirm={async () => { await deletePrompt(modal.prompt.id); setSelectedPromptId(null); setModal(null); notify("提示词已删除"); }}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}

function PromptDetail({
  prompt,
  scene,
  versions,
  editorContent,
  previewVersionId,
  fullscreen,
  onBack,
  onContentChange,
  onPreview,
  onCancelPreview,
  onRestore,
  onSaveVersion,
  onToggleFavorite,
  onCopy,
  onDelete,
  onFullscreen,
  onTagsChange,
  onNoteChange,
  onTitleChange,
}: {
  prompt: PromptItem;
  scene: Scene;
  versions: PromptVersion[];
  editorContent: string;
  previewVersionId: string | null;
  fullscreen: boolean;
  onBack: () => void;
  onContentChange: (value: string) => void;
  onPreview: (version: PromptVersion) => void;
  onCancelPreview: () => void;
  onRestore: (version: PromptVersion) => Promise<void>;
  onSaveVersion: () => void;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onFullscreen: () => void;
  onTagsChange: (tags: string[]) => void;
  onNoteChange: (noteText: string) => void;
  onTitleChange: (title: string) => void;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState(prompt.note);
  const previewVersion = versions.find((version) => version.id === previewVersionId);
  const lineCount = Math.max(editorContent.split("\n").length, 1);

  useEffect(() => setNoteDraft(prompt.note), [prompt.id, prompt.note]);

  return (
    <main className={`detail-page ${fullscreen ? "editor-fullscreen" : ""}`}>
      <header className="detail-heading">
        <button className="back-button" onClick={onBack} aria-label="返回场景"><ArrowLeft size={22} /></button>
        <div className="detail-title">
          <input value={prompt.title} onChange={(event) => onTitleChange(event.target.value)} aria-label="提示词标题" />
          <p><span style={{ color: scene.color }}><SceneGlyph scene={scene} size={16} /></span>{scene.name}<span>·</span>更新于 {formatDate(prompt.updatedAt)}</p>
        </div>
        <div className="detail-actions">
          <button className={prompt.isFavorite ? "active" : ""} onClick={onToggleFavorite} aria-label="收藏"><Star size={21} weight={prompt.isFavorite ? "fill" : "regular"} /></button>
          <button onClick={onCopy} aria-label="复制"><Copy size={21} /></button>
          <button onClick={onDelete} aria-label="删除" className="danger-icon"><Trash size={21} /></button>
        </div>
      </header>
      <div className="detail-body">
        <section className="editor-card">
          <header className="editor-toolbar">
            <div><strong>提示词编辑器</strong><span>{editorContent.length} 字符 · 草稿自动保存</span></div>
            <div>
              <button className="save-version-button" onClick={onSaveVersion}><FloppyDisk size={18} />保存新版本</button>
              <button onClick={onCopy} aria-label="复制内容"><Copy size={19} /></button>
              <button onClick={onFullscreen} aria-label="全屏编辑"><ArrowsOutSimple size={19} /></button>
            </div>
          </header>
          {previewVersion && (
            <div className="version-preview-banner">
              <span>正在预览 {previewVersion.number}，当前草稿未被修改。</span>
              <div><button onClick={onCancelPreview}>返回当前版本</button><button onClick={() => void onRestore(previewVersion)}>恢复为新版本</button></div>
            </div>
          )}
          <div className="editor-area">
            <div className="line-numbers" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <textarea
              value={editorContent}
              onChange={(event) => onContentChange(event.target.value)}
              spellCheck={false}
              aria-label="提示词正文"
            />
          </div>
        </section>
        <aside className="metadata-panel">
          <section className="metadata-section version-section">
            <h2><ClockCounterClockwise size={20} />版本历史</h2>
            <div className="version-list">
              {versions.map((version) => {
                const current = version.number === prompt.currentVersion && !previewVersionId;
                const previewing = version.id === previewVersionId;
                return (
                  <button key={version.id} className={`version-card ${current || previewing ? "active" : ""}`} onClick={() => current ? onCancelPreview() : onPreview(version)}>
                    <div><strong>{version.number}</strong>{current && <span>当前</span>}</div>
                    <p>{version.note || "版本更新"}</p>
                    <time>{formatDate(version.createdAt)}</time>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="metadata-section">
            <h2><Tag size={20} />标签</h2>
            <div className="tag-editor">
              {prompt.tags.map((tagText) => (
                <span key={tagText}>{tagText}<button aria-label={`移除标签 ${tagText}`} onClick={() => onTagsChange(prompt.tags.filter((item) => item !== tagText))}><X size={13} /></button></span>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const cleanTag = tagDraft.trim();
                if (cleanTag && !prompt.tags.includes(cleanTag)) onTagsChange([...prompt.tags, cleanTag]);
                setTagDraft("");
              }}
            >
              <input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="输入标签后回车…" />
            </form>
          </section>
          <section className="metadata-section note-section">
            <h2><Note size={20} />备注说明</h2>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              onBlur={() => onNoteChange(noteDraft)}
              placeholder="记录适用模型、使用技巧或注意事项…"
            />
          </section>
          <div className="shortcut-hint"><GearSix size={17} /><span><kbd>⌘ S</kbd> 保存版本 · <kbd>Esc</kbd> 退出全屏</span></div>
        </aside>
      </div>
    </main>
  );
}

function SceneForm({ scene, onClose, onSaved }: { scene?: Scene; onClose: () => void; onSaved: (id: string) => void }) {
  const [name, setName] = useState(scene?.name ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [color, setColor] = useState(scene?.color ?? colorChoices[0]);
  const [icon, setIcon] = useState<SceneIcon>(scene?.icon ?? "briefcase");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const id = scene?.id ?? newId("scene");
    await db.scenes.put({ id, name: name.trim(), description: description.trim(), color, icon, createdAt: scene?.createdAt ?? now, updatedAt: now });
    onSaved(id);
  };

  return (
    <Modal title={scene ? "编辑场景" : "新建场景"} onClose={onClose}>
      <form className="form-stack" onSubmit={(event) => void submit(event)}>
        <label><span>场景名称</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：市场研究" required /></label>
        <label><span>场景说明</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="简要描述这个场景中的提示词用途" /></label>
        <fieldset><legend>图标</legend><div className="icon-picker">
          {(Object.keys(iconMap) as SceneIcon[]).map((iconName) => {
            const Glyph = iconMap[iconName];
            return <button type="button" className={icon === iconName ? "active" : ""} onClick={() => setIcon(iconName)} key={iconName}><Glyph size={20} /></button>;
          })}
        </div></fieldset>
        <fieldset><legend>识别色</legend><div className="color-picker">
          {colorChoices.map((choice) => <button type="button" key={choice} className={color === choice ? "active" : ""} style={{ backgroundColor: choice }} onClick={() => setColor(choice)} />)}
        </div></fieldset>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button className="primary-button">{scene ? "保存修改" : "创建场景"}</button></div>
      </form>
    </Modal>
  );
}

function PromptForm({ scene, onClose, onSaved }: { scene: Scene; onClose: () => void; onSaved: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const now = new Date().toISOString();
    const id = newId("prompt");
    const prompt: PromptItem = {
      id,
      sceneId: scene.id,
      title: title.trim(),
      summary: summary.trim() || textSnippet(content, 90),
      content: content.trim(),
      tags: [],
      note: "",
      isFavorite: false,
      currentVersion: "v1.0.0",
      createdAt: now,
      updatedAt: now,
    };
    await db.transaction("rw", db.prompts, db.versions, async () => {
      await db.prompts.add(prompt);
      await db.versions.add({ id: newId("version"), promptId: id, number: "v1.0.0", content: prompt.content, note: "初始版本", createdAt: now });
    });
    onSaved(id);
  };

  return (
    <Modal title="新建提示词" onClose={onClose} wide>
      <form className="form-stack" onSubmit={(event) => void submit(event)}>
        <div className="context-chip"><SceneGlyph scene={scene} size={17} />将保存到「{scene.name}」</div>
        <label><span>提示词名称</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给这条提示词一个清晰的名称" required /></label>
        <label><span>一句话说明</span><input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="说明它能帮助你完成什么" /></label>
        <label><span>提示词正文</span><textarea className="content-input" value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入完整的角色、任务、上下文和输出要求…" required /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button className="primary-button">创建并打开</button></div>
      </form>
    </Modal>
  );
}

function VersionForm({ prompt, content, onClose, onSaved }: { prompt: PromptItem; content: string; onClose: () => void; onSaved: (number: string) => void }) {
  const number = nextVersion(prompt.currentVersion);
  const [noteText, setNoteText] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const now = new Date().toISOString();
    await db.transaction("rw", db.prompts, db.versions, async () => {
      await db.versions.add({ id: newId("version"), promptId: prompt.id, number, content, note: noteText.trim() || "更新提示词内容", createdAt: now });
      await db.prompts.update(prompt.id, { content, currentVersion: number, updatedAt: now });
    });
    onSaved(number);
  };

  return (
    <Modal title={`保存为 ${number}`} onClose={onClose}>
      <form className="form-stack" onSubmit={(event) => void submit(event)}>
        <div className="version-explain"><ClockCounterClockwise size={21} /><p><strong>当前草稿将成为新版本</strong><span>旧版本会完整保留，可随时预览或恢复。</span></p></div>
        <label><span>版本说明</span><textarea autoFocus value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="这次主要修改了什么？" /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>继续编辑</button><button className="primary-button">保存版本</button></div>
      </form>
    </Modal>
  );
}

function ImportPreview({ backup, onClose, onImported }: { backup: PromptBackup; onClose: () => void; onImported: () => void }) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const submit = async () => {
    await importBackup(backup, mode);
    onImported();
  };
  return (
    <Modal title="预览导入数据" onClose={onClose} wide>
      <div className="import-summary">
        <div><strong>{backup.scenes.length}</strong><span>场景</span></div>
        <div><strong>{backup.prompts.length}</strong><span>提示词</span></div>
        <div><strong>{backup.versions.length}</strong><span>历史版本</span></div>
      </div>
      <div className="import-list">
        {backup.scenes.slice(0, 4).map((scene) => <span key={scene.id}>{scene.name}</span>)}
        {backup.scenes.length > 4 && <span>还有 {backup.scenes.length - 4} 个场景</span>}
      </div>
      <div className="mode-options">
        <label className={mode === "merge" ? "active" : ""}><input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} /><span><strong>合并到现有数据</strong><small>相同 ID 的内容更新，其余内容保留</small></span></label>
        <label className={mode === "replace" ? "active" : ""}><input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} /><span><strong>全量替换</strong><small>清空本地数据，再导入这份备份</small></span></label>
      </div>
      {mode === "replace" && <p className="warning-text"><WarningCircle size={18} />此操作不可撤销，建议先导出当前数据。</p>}
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => void submit()}>确认导入</button></div>
    </Modal>
  );
}

function ConfirmDelete({ title, description, onClose, onConfirm }: { title: string; description: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="delete-message"><span><WarningCircle size={25} weight="fill" /></span><p>{description}</p></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>取消</button><button className="danger-button" onClick={() => void onConfirm()}>确认删除</button></div>
    </Modal>
  );
}
