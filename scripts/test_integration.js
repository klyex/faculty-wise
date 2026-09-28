const API_KEY = "E98D385B-12FA-4FA0-8C4C-93425FF29961";
const ENDPOINT = "https://innovatechservicesph.com/management/microservices.php?service=ai-chat";

async function testAi() {
  console.log('Testing with endpoint:', ENDPOINT);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: API_KEY,
      question: "Hello from Node.js standalone test!",
    }),
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testAi().catch(console.error);
