import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getDestinationData, formatItinerary } from '../mock-data/travel';

export async function* runReactAgent(input: string): AsyncGenerator<AgentEvent> {
  const dest = getDestinationData(input);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Analysing your travel request…' };
  await delay(800);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching flights…', to: 'flights-tool' };
  await delay(500);
  yield { agentId: 'flights-tool', agentName: '✈ Flights', status: 'done', message: `${dest.flights[0].airline} · ${dest.flights[0].route} · $${dest.flights[0].price}/person` };
  await delay(400);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching hotels…', to: 'hotels-tool' };
  await delay(400);
  yield { agentId: 'hotels-tool', agentName: '🏨 Hotels', status: 'done', message: `${dest.hotels[0].name} · $${dest.hotels[0].pricePerNight}/night` };
  await delay(500);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Finding restaurants…', to: 'food-tool' };
  await delay(400);
  yield { agentId: 'food-tool', agentName: '🍜 Food', status: 'done', message: dest.restaurants.slice(0, 2).map(r => r.name).join(', ') + ' + more' };
  await delay(400);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Checking activities…', to: 'activities-tool' };
  await delay(400);
  yield { agentId: 'activities-tool', agentName: '🎌 Activities', status: 'done', message: dest.activities.slice(0, 3).map(a => a.name).join(', ') };
  await delay(600);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Compiling full itinerary…' };
  await delay(900);
  yield { agentId: 'final-plan', agentName: '📋 Final Itinerary', status: 'done', message: formatItinerary(dest) };
  await delay(200);

  yield DONE_EVENT;
}
