import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Agent } from './agent.entity';

@Entity('mcp_servers')
export class McpServer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'http' })
  type: 'http' | 'stdio';

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  command: string;

  @Column({ type: 'simple-json', nullable: true })
  args: string[];

  @Column({ type: 'simple-json', nullable: true })
  env: Record<string, string>;

  @Column({ type: 'simple-json', nullable: true })
  headers: Record<string, string>;

  @Column({ default: true })
  enabled: boolean;

  @ManyToOne(() => Agent, (agent) => agent.mcpServers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column()
  agentId: string;

  @CreateDateColumn()
  createdAt: Date;
}
