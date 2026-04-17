import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';

export async function* runReactAgent(input: string): AsyncGenerator<AgentEvent> {
  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Analysing your travel request…' };

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching flights…', to: 'flights-tool' };
  await delay(300);
  const flightsMsg = await generateAgentMessage(
    'You are a flight search tool. Return exactly 2 flight options with airline, route, price and duration. Format: "AirlineName · Route · $Price · Xh Ym". One option per line. No preamble.',
    `Find flights for: ${input}`
  );
  yield { agentId: 'flights-tool', agentName: '✈ Flights', status: 'done', message: flightsMsg };
  await delay(200);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching hotels…', to: 'hotels-tool' };
  await delay(300);
  const hotelsMsg = await generateAgentMessage(
    'You are a hotel search tool. Return exactly 2 hotel options with name, area, and price per night. Format: "HotelName · Area · $X/night". One option per line. No preamble.',
    `Find hotels for: ${input}`
  );
  yield { agentId: 'hotels-tool', agentName: '🏨 Hotels', status: 'done', message: hotelsMsg };
  await delay(200);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Finding restaurants…', to: 'food-tool' };
  await delay(300);
  const foodMsg = await generateAgentMessage(
    'You are a restaurant finder. List 3 restaurants with cuisine type. Format: "Name (Cuisine), Name (Cuisine), Name (Cuisine)". No preamble.',
    `Find restaurants for: ${input}`
  );
  yield { agentId: 'food-tool', agentName: '🍜 Food', status: 'done', message: foodMsg };
  await delay(200);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Checking activities…', to: 'activities-tool' };
  await delay(300);
  const activitiesMsg = await generateAgentMessage(
    'You are an activities advisor. List 3 must-do activities with a 3-word description each. Format: "Activity — description". One per line. No preamble.',
    `Find activities for: ${input}`
  );
  yield { agentId: 'activities-tool', agentName: '🎌 Activities', status: 'done', message: activitiesMsg };
  await delay(300);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Compiling full itinerary…' };
  const itineraryMsg = await generateAgentMessage(
    'You are a travel planner. Write a concise 5-day itinerary summary in 4-5 sentences. Include highlights from flights, hotels, food, and activities.',
    `Create a complete itinerary for: ${input}`
  );
  yield { agentId: 'final-plan', agentName: '📋 Final Itinerary', status: 'done', message: itineraryMsg };
  await delay(200);

  yield DONE_EVENT;
}
