import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { AgentsService } from '../agents/agents.service';

@Injectable()
export class TokenService {
  constructor(private agentsService: AgentsService) {}

  async generateToken(agentName: string) {
    const agent = await this.agentsService.findByName(agentName);

    const roomName = `${agentName}-${Date.now()}`;
    const participantIdentity = `user-${Date.now()}`;

    const at = new AccessToken(agent.livekitApiKey, agent.livekitApiSecret, {
      identity: participantIdentity,
      name: 'User',
      ttl: '10m',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    at.roomConfig = new RoomConfiguration({
      agents: [
        new RoomAgentDispatch({
          agentName: agentName,
        }),
      ],
    });

    const token = await at.toJwt();

    return {
      serverUrl: agent.livekitUrl,
      token,
      roomName,
      identity: participantIdentity,
    };
  }
}
