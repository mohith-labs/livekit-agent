import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AgentConfig } from '../lib/constants';
import AgentCard from '../components/AgentCard';
import { Plus, Bot, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchAgents = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/agents');
      setAgents(res.data);
    } catch (err) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    // Poll for status updates every 5 seconds
    const interval = setInterval(() => fetchAgents(false), 5000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const handleStart = async (id: string) => {
    try {
      await api.post(`/agents/${id}/start`);
      toast.success('Agent started');
      fetchAgents(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start agent');
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.post(`/agents/${id}/stop`);
      toast.success('Agent stopped');
      fetchAgents(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to stop agent');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/agents/${id}`);
      toast.success('Agent deleted');
      fetchAgents(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete agent');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Voice Agents</h2>
          <p className="text-gray-400 mt-1">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAgents(false)}
            disabled={refreshing}
            className="btn-ghost py-2 px-3"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/agents/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Agent
          </button>
        </div>
      </div>

      {/* Agent grid */}
      {agents.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Bot className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No agents yet</h3>
          <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
            Create your first voice agent to get started. Configure LiveKit connection,
            AI model, voice, and optional tools.
          </p>
          <button
            onClick={() => navigate('/agents/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStart={() => handleStart(agent.id!)}
              onStop={() => handleStop(agent.id!)}
              onEdit={() => navigate(`/agents/${agent.id}/edit`)}
              onDelete={() => handleDelete(agent.id!)}
              onPlayground={() => navigate(`/agents/${agent.id}/playground`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
