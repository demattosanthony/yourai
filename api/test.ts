async function testInference() {
  try {
    const response = await fetch("http://localhost:3000/inference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream", // Add this header to accept SSE
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Replace with your actual model name
        input: "Hello, how can I assist you today?", // Replace with your actual input
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;

      // Process each event
      const events = chunk.split("\n\n");
      for (const event of events) {
        if (event.trim()) {
          const data = JSON.parse(event.split("data: ")[1]); // Parse the event data
          result += data; // Concatenate the message text
        }
      }
    }

    console.log("Final result:", result); // Print the concatenated message text
  } catch (error) {
    console.error(error);
  }
}

// Run the test inference function
testInference();
