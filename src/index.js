import "dotenv/config";
import { tool } from "@langchain/core/tools";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ChatDeepSeek } from "@langchain/deepseek";
import { z } from "zod";

const weatherSchema = z.object({
  city: z.string().describe("The city name to query weather for."),
});

const weatherTool = tool(
  async ({ city }) => {
    const encodedCity = encodeURIComponent(city.trim());
    const response = await fetch(`https://wttr.in/${encodedCity}?format=j1`);

    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }

    const raw = await response.json();
    const data = raw.data ?? raw;
    const current = data.current_condition?.[0];
    const today = data.weather?.[0];

    if (!current || !today) {
      throw new Error("Weather service returned incomplete data.");
    }

    return JSON.stringify(
      {
        city,
        observationTime: current.localObsDateTime,
        temperatureC: current.temp_C,
        feelsLikeC: current.FeelsLikeC,
        humidity: current.humidity,
        weatherDesc: current.weatherDesc?.[0]?.value ?? "Unknown",
        windKmph: current.windspeedKmph,
        maxTempC: today.maxtempC,
        minTempC: today.mintempC,
      },
      null,
      2,
    );
  },
  {
    name: "get_weather",
    description: "Get the current weather for a given city.",
    schema: weatherSchema,
  },
);

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY in environment variables.");
  }

  const llm = new ChatDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: "deepseek-chat",
    temperature: 0,
  });

  const llmWithTools = llm.bindTools([weatherTool]);
  const question = "帮我查询一下天津今天天气怎么样？";

  const firstResponse = await llmWithTools.invoke([new HumanMessage(question)]);

  console.log("=== First model response ===");
  console.log(firstResponse.content);
  console.log("=== Tool calls ===");
  console.log(JSON.stringify(firstResponse.tool_calls, null, 2));

  if (!firstResponse.tool_calls?.length) {
    console.log("Model did not request any tool.");
    return;
  }

  const toolMessages = [];

  for (const toolCall of firstResponse.tool_calls) {
    const toolResult = await weatherTool.invoke(toolCall.args);

    toolMessages.push(
      new ToolMessage({
        tool_call_id: toolCall.id,
        name: toolCall.name,
        content: toolResult,
      }),
    );
  }

  const finalResponse = await llmWithTools.invoke([
    new HumanMessage(question),
    firstResponse,
    ...toolMessages,
  ]);

  console.log("=== Final answer ===");
  console.log(finalResponse.content);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
