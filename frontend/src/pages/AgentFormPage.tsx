import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { OPENAI_MODELS, VOICES, McpServerConfig } from '../lib/constants';
import McpServerForm from '../components/McpServerForm';
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Globe,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const defaultForm = {
  name: '',
  livekitUrl: '',
  livekitApiKey: '',
  livekitApiSecret: '',
  openaiModel: 'gpt-4o-realtime-preview',
  voice: 'alloy',
  instructions: 'You are a helpful voice AI assistant.',
  webSearchEnabled: false,
  webSearchApiKey: '',
  mcpServers: [] as McpServerConfig[],
};

export default function AgentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [showSecret, setShowSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      api.get(`/agents/${id}`).then((res) => {
        const agent = res.data;
        setForm({
          name: agent.name || '',
          livekitUrl: agent.livekitUrl || '',
          livekitApiKey: agent.livekitApiKey || '',
          livekitApiSecret: agent.livekitApiSecret || '',
          openaiModel: agent.openaiModel || 'gpt-4o-realtime-preview',
          voice: agent.voice || 'alloy',
          instructions: agent.instructions || '',
          webSearchEnabled: agent.webSearchEnabled || false,
          webSearchApiKey: agent.webSearchApiKey || '',
          mcpServers: (agent.mcpServers || []).map((m: any) => ({
            id: m.id,
            name: m.name || '',
            type: m.type || 'http',
            url: m.url || '',
            command: m.command || '',
            args: m.args || [],
            env: m.env || {},
            headers: m.headers || {},
            enabled: m.enabled !== false,
          })),
        });
        setFetching(false);
      }).catch(() => {
        toast.error('Failed to load agent');
        navigate('/');
      });
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Agent name is required');
      return;
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(form.name)) {
      toast.error('Agent name can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    if (!form.livekitUrl.trim()) {
      toast.error('LiveKit URL is required');
      return;
    }
    if (!form.livekitApiKey.trim()) {
      toast.error('LiveKit API Key is required');
      return;
    }
    if (!form.livekitApiSecret.trim()) {
      toast.error('LiveKit API Secret is required');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/agents/${id}`, form);
        toast.success('Agent updated successfully');
      } else {
        await api.post('/agents', form);
        toast.success('Agent created successfully');
      }
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save agent');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMcpServer = () => {
    setForm((prev) => ({
      ...prev,
      mcpServers: [
        ...prev.mcpServers,
        {
          name: '',
          type: 'http' as const,
          url: '',
          command: '',
          args: [],
          env: {},
          headers: {},
          enabled: true,
        },
      ],
    }));
  };

  const updateMcpServer = (index: number, updated: McpServerConfig) => {
    setForm((prev) => ({
      ...prev,
      mcpServers: prev.mcpServers.map((s, i) => (i === index ? updated : s)),
    }));
  };

  const removeMcpServer = (index: number) => {
    setForm((prev) => ({
      ...prev,
      mcpServers: prev.mcpServers.filter((_, i) => i !== index),
    }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Agent' : 'Create Agent'}
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEdit ? 'Update your agent configuration' : 'Configure a new voice agent'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <section className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">
                Agent Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input-field"
                placeholder="my-voice-agent"
                disabled={isEdit}
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in the token endpoint URL: GET /{form.name || 'agent-name'}/token
              </p>
            </div>

            <div>
              <label className="label">Instructions / System Prompt</label>
              <textarea
                value={form.instructions}
                onChange={(e) => updateField('instructions', e.target.value)}
                className="input-field min-h-[120px] resize-y"
                placeholder="You are a helpful voice AI assistant..."
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* Section 2: LiveKit Connection */}
        <section className="card">
          <h3 className="text-lg font-semibold text-white mb-4">LiveKit Connection</h3>
          <div className="space-y-4">
            <div>
              <label className="label">
                LiveKit URL <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.livekitUrl}
                onChange={(e) => updateField('livekitUrl', e.target.value)}
                className="input-field"
                placeholder="wss://your-project.livekit.cloud"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  API Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.livekitApiKey}
                  onChange={(e) => updateField('livekitApiKey', e.target.value)}
                  className="input-field"
                  placeholder="API..."
                />
              </div>
              <div>
                <label className="label">
                  API Secret <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={form.livekitApiSecret}
                    onChange={(e) => updateField('livekitApiSecret', e.target.value)}
                    className="input-field pr-10"
                    placeholder="Secret..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: AI Model */}
        <section className="card">
          <h3 className="text-lg font-semibold text-white mb-4">AI Model & Voice</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">OpenAI Realtime Model</label>
              <select
                value={form.openaiModel}
                onChange={(e) => updateField('openaiModel', e.target.value)}
                className="input-field"
              >
                {OPENAI_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Voice</label>
              <select
                value={form.voice}
                onChange={(e) => updateField('voice', e.target.value)}
                className="input-field"
              >
                {VOICES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label} — {v.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 4: Web Search */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Web Search</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.webSearchEnabled}
                onChange={(e) => updateField('webSearchEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
            </label>
          </div>

          {form.webSearchEnabled && (
            <div>
              <label className="label">Tavily API Key (optional)</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={form.webSearchApiKey}
                  onChange={(e) => updateField('webSearchApiKey', e.target.value)}
                  className="input-field pr-10"
                  placeholder="tvly-... (leave empty to use DuckDuckGo)"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If no API key is provided, DuckDuckGo Instant Answers will be used (free, no key required).
              </p>
            </div>
          )}

          {!form.webSearchEnabled && (
            <p className="text-sm text-gray-500">
              Enable web search to give your agent access to real-time internet information.
            </p>
          )}
        </section>

        {/* Section 5: MCP Servers */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">MCP Servers</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Connect Model Context Protocol servers to expose external tools to your agent
              </p>
            </div>
            <button
              type="button"
              onClick={addMcpServer}
              className="btn-secondary flex items-center gap-2 text-sm py-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Server
            </button>
          </div>

          {form.mcpServers.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">No MCP servers configured</p>
              <button
                type="button"
                onClick={addMcpServer}
                className="text-sm text-brand-400 hover:text-brand-300 font-medium"
              >
                + Add your first MCP server
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {form.mcpServers.map((server, index) => (
                <McpServerForm
                  key={index}
                  server={server}
                  index={index}
                  onChange={(updated) => updateMcpServer(index, updated)}
                  onRemove={() => removeMcpServer(index)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Update Agent' : 'Create Agent'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
