import { initializeChat } from './actions/chat';

async function main() {
  const res = await initializeChat({
    name: 'Test User',
    email: 'test@test.com',
    message: 'Hello',
    visitorId: '12345'
  });
  console.log('Result:', res);
}

main();
