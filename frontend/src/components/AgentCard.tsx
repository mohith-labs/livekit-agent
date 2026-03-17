import { useState } from 'react';
import { AgentConfig } from '../lib/constants';
import {
  Play,
  Square,
  Pencil,
  Trash2,
  Cpu,
  Mic,
  Globe,
  Server,
  Loader2,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';

interface Props {
  agent: AgentConfig;
  onStart: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPlayground: () => void;
}

export default function AgentCard({ agent, onStart, onStop, onEdit, onDelete, onPlayground }: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const status = agent.status || 'stopped';

  const statusConfig = {
    running: {
      color: 'bg-emerald-500',
      ring: 'ring-emerald-500/20',
      text: 'text-emerald-400',
      label: 'Running',
    },
    stopped: {
      color: 'bg-gray-500',
      ring: 'ring-gray-500/20',
      text: 'text-gray-400',
      label: 'Stopped',
    },
    error: {
      color: 'bg-red-500',
      ring: 'ring-red-500/20',
      text: 'text-red-400',
      label: 'Error',
    },
  }[status];

  const handleAction = async (action: string, fn: () => void) => {
    setActionLoading(action);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const enabledMcpCount = (agent.mcpServers || []).filter((m) => m.enabled).length;

  return (
    <div className="card group hover:border-gray-700 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{agent.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} ring-4 ${statusConfig.ring}`} />
            <span className={`text-xs font-medium ${statusConfig.text}`}>{statusConfig.label}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            title="Edit agent"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete agent"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  handleAction('delete', onDelete);
                  setShowDeleteConfirm(false);
                }}
                className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Model & Voice badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
          <Cpu className="w-3 h-3 text-brand-400" />
          {agent.openaiModel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
          <Mic className="w-3 h-3 text-purple-400" />
          {agent.voice}
        </span>
      </div>

      {/* Feature indicators */}
      <div className="flex flex-wrap gap-2 mb-4">
        {agent.webSearchEnabled && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
            <Globe className="w-3 h-3" />
            Web Search
          </span>
        )}
        {enabledMcpCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
            <Server className="w-3 h-3" />
            {enabledMcpCount} MCP Server{enabledMcpCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Instructions preview */}
      <p className="text-xs text-gray-500 mb-4 line-clamp-2">
        {agent.instructions}
      </p>

      {/* Start/Stop + Playground buttons */}
      <div className="pt-3 border-t border-gray-800 space-y-2">
        {status === 'running' ? (
          <button
            onClick={() => handleAction('stop', onStop)}
            disabled={actionLoading !== null}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {actionLoading === 'stop' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Stop Agent
          </button>
        ) : status === 'error' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Agent encountered an error</span>
            </div>
            <button
              onClick={() => handleAction('start', onStart)}
              disabled={actionLoading !== null}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === 'start' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Restart Agent
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleAction('start', onStart)}
            disabled={actionLoading !== null}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {actionLoading === 'start' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start Agent
          </button>
        )}

        {/* Playground button - only shown when agent is running */}
        {status === 'running' && (
          <button
            onClick={onPlayground}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-sm font-medium transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Playground
          </button>
        )}
      </div>
    </div>
  );
}
