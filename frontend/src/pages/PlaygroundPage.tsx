import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useVoiceAssistant,
  BarVisualizer,
  DisconnectButton,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { ConnectionState, Track } from 'livekit-client';
import api from '../lib/api';
import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TokenData {
  serverUrl: string;
  token: string;
  roomName: string;
  identity: string;
}

export default function PlaygroundPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agentName, setAgentName] = useState('');
  const [agentConfig, setAgentConfig] = useState<any>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Fetch agent info + token
  useEffect(() => {
    if (!id) return;

    const init = async () => {
      try {
        // Get agent info
        const agentRes = await api.get(`/agents/${id}`);
        setAgentConfig(agentRes.data);
        setAgentName(agentRes.data.name);

        // Get playground token
        const tokenRes = await api.post(`/agents/${id}/playground-token`);
        setTokenData(tokenRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initialize playground');
        toast.error('Failed to initialize playground');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id]);

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    setTokenData(null);
  }, []);

  const handleConnected = useCallback(() => {
    setConnected(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Playground</h2>
        </div>
        <div className="card text-center py-12">
          <p className="text-red-400 mb-4">{error || 'Failed to get connection token'}</p>
          <p className="text-gray-500 text-sm mb-6">
            Make sure the agent is running before opening the playground.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Playground</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Testing agent: <span className="text-brand-400 font-medium">{agentName}</span>
          </p>
        </div>
        {agentConfig && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
              {agentConfig.openaiModel}
            </span>
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
              {agentConfig.voice}
            </span>
          </div>
        )}
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={tokenData.serverUrl}
        token={tokenData.token}
        connect={true}
        audio={true}
        video={false}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        className="card overflow-hidden"
        style={{ minHeight: '500px' }}
      >
        <PlaygroundInner agentName={agentName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function PlaygroundInner({ agentName }: { agentName: string }) {
  const connectionState = useConnectionState();
  const voiceAssistant = useVoiceAssistant();
  const [isMuted, setIsMuted] = useState(false);

  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  const agentState = voiceAssistant.state;

  const stateConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
    disconnected: { label: 'Disconnected', color: 'text-gray-500', pulse: false },
    connecting: { label: 'Connecting...', color: 'text-yellow-400', pulse: true },
    initializing: { label: 'Initializing...', color: 'text-yellow-400', pulse: true },
    listening: { label: 'Listening', color: 'text-emerald-400', pulse: false },
    thinking: { label: 'Thinking...', color: 'text-blue-400', pulse: true },
    speaking: { label: 'Speaking', color: 'text-purple-400', pulse: true },
  };

  const currentState = stateConfig[agentState] || stateConfig['disconnected'];

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '500px' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            ) : isConnecting ? (
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-500" />
            )}
            <span className="text-xs text-gray-400">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          <span className="text-gray-700">|</span>
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${currentState.color}`} />
            <span className={`text-xs font-medium ${currentState.color}`}>
              {currentState.label}
            </span>
          </div>
        </div>

        <span className="text-xs text-gray-600">{agentName}</span>
      </div>

      {/* Visualizer area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {isConnected && voiceAssistant.audioTrack ? (
          <div className="w-full max-w-md">
            <BarVisualizer
              state={agentState}
              barCount={7}
              trackRef={voiceAssistant.audioTrack}
              className="h-48"
              options={{ minHeight: 10 }}
            />
          </div>
        ) : isConnected ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
              <Volume2 className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Waiting for agent to connect...</p>
          </div>
        ) : isConnecting ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
            <p className="text-gray-400 text-sm">Connecting to room...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Disconnected</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-5 border-t border-gray-800 bg-gray-900/50">
        {isConnected && (
          <>
            <MicToggleButton />
            <DisconnectButton className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-full transition-colors">
              <PhoneOff className="w-4 h-4" />
              End Session
            </DisconnectButton>
          </>
        )}
        {!isConnected && !isConnecting && (
          <p className="text-gray-500 text-sm">Session ended. Go back to restart.</p>
        )}
      </div>
    </div>
  );
}

function MicToggleButton() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const handleToggle = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 py-2.5 px-5 rounded-full font-medium transition-colors ${
        !isMicrophoneEnabled
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      }`}
    >
      {!isMicrophoneEnabled ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      {!isMicrophoneEnabled ? 'Unmute' : 'Mute'}
    </button>
  );
}
