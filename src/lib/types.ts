export type AgentStatus = 'idle' | 'thinking' | 'passing' | 'done';

export interface AgentEvent {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  message: string;
  to?: string; // target agentId — triggers edge animation
}

export const DONE_EVENT: AgentEvent = {
  agentId: '__done__',
  agentName: '',
  status: 'done',
  message: '',
};
