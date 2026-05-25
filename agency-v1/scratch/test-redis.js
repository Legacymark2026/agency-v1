const redisUrl = "https://quality-maggot-103967.upstash.io";
const redisToken = "gQAAAAAAAZYfAAIgcDE0YWIwYWNkZDMzYmM0NGE5YjFhMmU4YTNmMmU3MGM0Ng";

async function checkRedis() {
  console.log("Checking Upstash Redis connection...");
  try {
    const res = await fetch(`${redisUrl}/ping`, {
      headers: {
        Authorization: `Bearer ${redisToken}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log("Upstash Redis Response:", data);
    } else {
      console.error("Upstash Redis request failed with status:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Failed to connect to Upstash Redis:", err);
  }
}

async function checkQStash() {
  console.log("\nChecking Upstash QStash connection...");
  const qstashUrl = "https://qstash-eu-central-1.upstash.io";
  const qstashToken = "eyJVc2VySUQiOiI1NjE5MmMxYy03ZDdkLTRkYWQtOWM4My1lYjlmYzYyN2QyMWYiLCJQYXNzd29yZCI6ImFhOTZiNDBhZTNhMTQzYmRhNGRmYmQ2NWVlNDY5ZWU1In0=";
  
  try {
    // List schedules
    const resSchedules = await fetch(`${qstashUrl}/v2/schedules`, {
      headers: {
        Authorization: `Bearer ${qstashToken}`
      }
    });
    if (resSchedules.ok) {
      const data = await resSchedules.json();
      console.log("Upstash QStash Schedules count:", Array.isArray(data) ? data.length : "invalid data");
      console.log("Upstash QStash Schedules details:", JSON.stringify(data, null, 2));
    } else {
      console.error("Upstash QStash schedules request failed with status:", resSchedules.status, await resSchedules.text());
    }

    // List events
    const resEvents = await fetch(`${qstashUrl}/v2/events`, {
      headers: {
        Authorization: `Bearer ${qstashToken}`
      }
    });
    if (resEvents.ok) {
      const data = await resEvents.json();
      console.log("Upstash QStash Events:", Array.isArray(data.events) ? data.events.length : "invalid events");
    } else {
      console.error("Upstash QStash events request failed with status:", resEvents.status, await resEvents.text());
    }

  } catch (err) {
    console.error("Failed to connect to Upstash QStash:", err);
  }
}

async function main() {
  await checkRedis();
  await checkQStash();
}

main();
