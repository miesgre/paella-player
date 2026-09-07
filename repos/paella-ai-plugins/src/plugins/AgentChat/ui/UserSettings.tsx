import { useState } from 'preact/hooks';
import { usePaellaPlugin, type Settings } from "../es.upv.paella.ai.agentchat";
import type AIAgentChatPlugin from "../es.upv.paella.ai.agentchat";
import "./UserSettings.css";

const WEBLLM_MODELS = [
    { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", name: "Qwen 2.5 3B" },
    { id: "Phi-3-mini-4k-instruct-q4f16_1-MLC", name: "Phi 3 Mini 4K" },
    { id: "Llama-3.1-8B-Instruct-q4f32_1-MLC", name: "Llama 3.1 8B" },
];

interface UserSettingsProps {
    settings: Settings;
    onClose?: () => void;
    onSave?: (newSettings: Settings) => Promise<void>;
}

export function UserSettings({ settings, onClose = () => {}, onSave }: UserSettingsProps) {
    const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();

    const [modelType, setModelType] = useState<Settings['modelType']>(settings.modelType);
    const [baseURL, setBaseURL] = useState(settings.baseURL);
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [modelName, setModelName] = useState(settings.modelName);
    const [contextWindowLength, setContextWindowLength] = useState(settings.contextWindowLength);

    const handleModelTypeChange = (newType: Settings['modelType']) => {
        setModelType(newType);
        if (newType === 'webllm' && !WEBLLM_MODELS.some(m => m.id === modelName)) {
            setModelName(WEBLLM_MODELS[0].id);
        }
    };

    const handleSave = async () => {
        const newSettings: Settings = {
            modelType,
            baseURL,
            apiKey,
            modelName,
            contextWindowLength,
        };
        if (onSave) {
            await onSave(newSettings);
        } else {
            paellaPlugin.updateSettings(newSettings);
            onClose();
        }
    };

    return (
        <div className="settings">
            <header className="settings-header">
                <h1>{paellaPlugin.player.translate("Settings")}</h1>
                <button type="button" className="settings-close" onClick={onClose} title={paellaPlugin.player.translate("Close")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                </button>
            </header>

            <p className="settings-description">
                {paellaPlugin.player.translate("Select the AI model and adjust its parameters.")}
            </p>

            <ul className="settings-list">
                <li>
                    <div className="title">{paellaPlugin.player.translate("Model type")}</div>
                    <select value={modelType} onChange={(e) => handleModelTypeChange(e.currentTarget.value as Settings['modelType'])}>
                        <option value="openai">OpenAI API</option>
                        <option value="webllm">WebLLM</option>
                    </select>
                </li>

                {modelType === 'openai' && (
                    <>
                        <li>
                            <div className="title">{paellaPlugin.player.translate("API URL")}</div>
                            <input type="text" value={baseURL} placeholder="https://api.openai.com/v1"
                                onChange={(e) => setBaseURL(e.currentTarget.value)} />
                        </li>
                        <li>
                            <div className="title">{paellaPlugin.player.translate("API Key")}</div>
                            <input type="password" value={apiKey} placeholder="sk-..."
                                onChange={(e) => setApiKey(e.currentTarget.value)} />
                        </li>
                    </>
                )}

                {modelType === 'webllm' && (
                    <div className="settings-note">
                        <p>💡 <strong>{paellaPlugin.player.translate("Note:")}</strong> {paellaPlugin.player.translate("When using WebLLM, the AI model runs locally in your browser using WebGPU.")}</p>
                        <ul>
                            <li>✅ {paellaPlugin.player.translate("Your browser must support WebGPU.")}</li>
                            <li>✅ {paellaPlugin.player.translate("You need enough memory to load and run the model.")}</li>
                        </ul>
                        <p>⚠️ {paellaPlugin.player.translate("Performance depends on your hardware. If you experience issues, try using a different browser or a more powerful device.")}</p>
                    </div>
                )}

                <li>
                    <div className="title">{paellaPlugin.player.translate("Model")}</div>
                    {modelType === 'webllm' ? (
                        <select value={modelName} onChange={(e) => setModelName(e.currentTarget.value)}>
                            {WEBLLM_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" value={modelName} placeholder="gpt-4o"
                            onChange={(e) => setModelName(e.currentTarget.value)} />
                    )}
                </li>

                <li>
                    <div className="title">
                        <div>{paellaPlugin.player.translate("Context window")}</div>
                        <div className="sub-title">{paellaPlugin.player.translate("Maximum number of tokens for the context window")}</div>
                    </div>
                    <input type="number" value={contextWindowLength} min={1024} step={1024}
                        onChange={(e) => setContextWindowLength(parseInt(e.currentTarget.value) || 100000)} />
                </li>
            </ul>

            <footer className="settings-footer">
                <button type="button" onClick={onClose}>
                    {paellaPlugin.player.translate("Cancel")}
                </button>
                <button type="button" className="settings-save" onClick={handleSave}>
                    {paellaPlugin.player.translate("Save settings")}
                </button>
            </footer>
        </div>
    );
}
