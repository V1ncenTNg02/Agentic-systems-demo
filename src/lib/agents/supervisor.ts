import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';

export async function* runSupervisorAgent(input: string): AsyncGenerator<AgentEvent> {
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Analysing requirements…' };
  const planMsg = await generateAgentMessage(
    'You are a software architect supervisor. Write a 2-sentence plan describing how you will delegate this app to frontend, backend, database, and infra specialists. No preamble.',
    `App requirements: ${input}`
  );
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'done', message: planMsg };
  await delay(400);

  // Frontend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Frontend agent…', to: 'frontend-agent' };
  await delay(300);
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'thinking', message: 'Building frontend…' };
  const frontendMsg = await generateAgentMessage(
    'You are a frontend engineer. Describe your deliverable for this app in 2 sentences: key screens, framework choice, and UI approach. No preamble.',
    `Frontend for: ${input}`
  );
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'done', message: frontendMsg };
  await delay(300);

  // Backend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Backend agent…', to: 'backend-agent' };
  await delay(300);
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'thinking', message: 'Building backend…' };
  const backendMsg = await generateAgentMessage(
    'You are a backend engineer. Describe your deliverable in 2 sentences: API design, key endpoints, and tech stack. No preamble.',
    `Backend for: ${input}`
  );
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'done', message: backendMsg };
  await delay(300);

  // Database
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Database agent…', to: 'database-agent' };
  await delay(300);
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'thinking', message: 'Designing schema…' };
  const databaseMsg = await generateAgentMessage(
    'You are a database engineer. Describe your deliverable in 2 sentences: key tables/collections, relationships, and DB choice. No preamble.',
    `Database design for: ${input}`
  );
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'done', message: databaseMsg };
  await delay(300);

  // Infra
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Infra agent…', to: 'infra-agent' };
  await delay(300);
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'thinking', message: 'Setting up infrastructure…' };
  const infraMsg = await generateAgentMessage(
    'You are a DevOps engineer. Describe your deliverable in 2 sentences: hosting platform, CI/CD, and deployment strategy. No preamble.',
    `Infrastructure for: ${input}`
  );
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'done', message: infraMsg };
  await delay(400);

  // Final summary
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Reviewing all outputs…' };
  const summaryMsg = await generateAgentMessage(
    'You are a software architect. Write a 3-sentence project summary combining all specialist outputs. Mention timeline estimate and key risks. No preamble.',
    `Summarise build of "${input}":\nFrontend: ${frontendMsg}\nBackend: ${backendMsg}\nDatabase: ${databaseMsg}\nInfra: ${infraMsg}`
  );
  yield { agentId: 'build-summary', agentName: '✅ Build Summary', status: 'done', message: summaryMsg };
  await delay(200);

  yield DONE_EVENT;
}
