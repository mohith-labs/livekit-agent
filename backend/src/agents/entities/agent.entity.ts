import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { McpServer } from './mcp-server.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  livekitUrl: string;

  @Column()
  livekitApiKey: string;

  @Column()
  livekitApiSecret: string;

  @Column({ default: 'gpt-4o-realtime-preview' })
  openaiModel: string;

  @Column({ default: 'alloy' })
  voice: string;

  @Column({ type: 'text', default: 'You are a helpful voice AI assistant.' })
  instructions: string;

  @Column({ default: false })
  webSearchEnabled: boolean;

  @Column({ nullable: true })
  webSearchApiKey: string;

  @OneToMany(() => McpServer, (mcp) => mcp.agent, { cascade: true, eager: true })
  mcpServers: McpServer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
