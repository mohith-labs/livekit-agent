import { useState } from 'react';
import { McpServerConfig } from '../lib/constants';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Server,
  Terminal,
  Globe,
  Plus,
  X,
} from 'lucide-react';

interface Props {
  server: McpServerConfig;
  index: number;
  onChange: (updated: McpServerConfig) => void;
  onRemove: () => void;
}

export default function McpServerForm({ server, index, onChange, onRemove }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const update = (field: string, value: any) => {
    onChange({ ...server, [field]: value });
  };

  const addHeader = () => {
    if (!newHeaderKey.trim()) return;
    const headers = { ...(server.headers || {}), [newHeaderKey]: newHeaderValue };
    update('headers', headers);
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const headers = { ...(server.headers || {}) };
    delete headers[key];
    update('headers', headers);
  };

  const addEnv = () => {
    if (!newEnvKey.trim()) return;
    const env = { ...(server.env || {}), [newEnvKey]: newEnvValue };
    update('env', env);
    setNewEnvKey('');
    setNewEnvValue('');
  };

  const removeEnv = (key: string) => {
    const env = { ...(server.env || {}) };
    delete env[key];
    update('env', env);
  };

  return (
    <div className={`border rounded-lg transition-colors ${server.enabled ? 'border-gray-700 bg-gray-800/30' : 'border-gray-800 bg-gray-900/50 opacity-60'}`}>
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${server.type === 'http' ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
          {server.type === 'http' ? (
            <Globe className="w-4 h-4 text-blue-400" />
          ) : (
            <Terminal className="w-4 h-4 text-orange-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white truncate block">
            {server.name || `Server ${index + 1}`}
          </span>
          <span className="text-xs text-gray-500">
            {server.type === 'http' ? server.url || 'HTTP endpoint' : server.command || 'Stdio command'}
          </span>
        </div>

        {/* Toggle enabled */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={server.enabled}
            onChange={(e) => update('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
        </label>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-gray-700 text-gray-400"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50 pt-3">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Server Name</label>
              <input
                type="text"
                value={server.name}
                onChange={(e) => update('name', e.target.value)}
                className="input-field text-sm py-1.5"
                placeholder="my-mcp-server"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Transport Type</label>
              <select
                value={server.type}
                onChange={(e) => update('type', e.target.value as 'http' | 'stdio')}
                className="input-field text-sm py-1.5"
              >
                <option value="http">HTTP (SSE / Streamable)</option>
                <option value="stdio">Stdio (Local Process)</option>
              </select>
            </div>
          </div>

          {/* HTTP fields */}
          {server.type === 'http' && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Server URL</label>
                <input
                  type="text"
                  value={server.url || ''}
                  onChange={(e) => update('url', e.target.value)}
                  className="input-field text-sm py-1.5"
                  placeholder="https://your-mcp-server.com/sse"
                />
                <p className="text-xs text-gray-600 mt-0.5">
                  URLs ending in /sse use SSE transport; /mcp uses streamable HTTP
                </p>
              </div>

              {/* Headers */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Headers</label>
                {Object.entries(server.headers || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded flex-1 truncate">
                      {key}: {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHeader(key)}
                      className="p-0.5 text-gray-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                    className="input-field text-xs py-1 flex-1"
                    placeholder="Key"
                  />
                  <input
                    type="text"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                    className="input-field text-xs py-1 flex-1"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={addHeader}
                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Stdio fields */}
          {server.type === 'stdio' && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Command</label>
                <input
                  type="text"
                  value={server.command || ''}
                  onChange={(e) => update('command', e.target.value)}
                  className="input-field text-sm py-1.5"
                  placeholder="npx"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Arguments (comma-separated)
                </label>
                <input
                  type="text"
                  value={(server.args || []).join(', ')}
                  onChange={(e) =>
                    update(
                      'args',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  className="input-field text-sm py-1.5"
                  placeholder="-y, @modelcontextprotocol/server-filesystem, /path/to/dir"
                />
              </div>

              {/* Environment variables */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Environment Variables</label>
                {Object.entries(server.env || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded flex-1 truncate">
                      {key}={value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEnv(key)}
                      className="p-0.5 text-gray-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    className="input-field text-xs py-1 flex-1"
                    placeholder="VAR_NAME"
                  />
                  <input
                    type="text"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    className="input-field text-xs py-1 flex-1"
                    placeholder="value"
                  />
                  <button
                    type="button"
                    onClick={addEnv}
                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
