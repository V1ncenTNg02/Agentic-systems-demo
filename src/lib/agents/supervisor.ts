import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getAppArchetype } from '../mock-data/software-builder';

export async function* runSupervisorAgent(input: string): AsyncGenerator<AgentEvent> {
  const arch = getAppArchetype(input);

  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Analysing requirements…' };
  await delay(1000);
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'done', message: arch.supervisorPlan };
  await delay(500);

  // Frontend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Frontend agent…', to: 'frontend-agent' };
  await delay(400);
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'thinking', message: 'Building frontend…' };
  await delay(1000);
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'done', message: arch.frontend.deliverable };
  await delay(400);

  // Backend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Backend agent…', to: 'backend-agent' };
  await delay(400);
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'thinking', message: 'Building backend…' };
  await delay(1100);
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'done', message: arch.backend.deliverable };
  await delay(400);

  // Database
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Database agent…', to: 'database-agent' };
  await delay(400);
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'thinking', message: 'Designing schema…' };
  await delay(900);
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'done', message: arch.database.deliverable };
  await delay(400);

  // Infra
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Infra agent…', to: 'infra-agent' };
  await delay(400);
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'thinking', message: 'Setting up infrastructure…' };
  await delay(1000);
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'done', message: arch.infra.deliverable };
  await delay(500);

  // Final summary
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Reviewing all outputs…' };
  await delay(700);
  yield { agentId: 'build-summary', agentName: '✅ Build Summary', status: 'done', message: arch.summary };
  await delay(200);

  yield DONE_EVENT;
}
