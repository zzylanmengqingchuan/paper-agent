import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableMap } from "@langchain/core/runnables";

function createModel() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY in environment variables.");
  }

  return new ChatDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: "deepseek-chat",
    temperature: 0.7,
  });
}

async function main() {
  const llm = createModel();
  const parser = new StringOutputParser();
  const topic = process.argv[2] ?? "熊猫";

  const jokePrompt =
    ChatPromptTemplate.fromTemplate("讲一个关于{topic}的短笑话，控制在两句话以内。");

  const jokeChain = jokePrompt.pipe(llm).pipe(parser);

  const analysisPrompt = ChatPromptTemplate.fromTemplate(
    "请分析下面这个笑话为什么有趣，控制在80字以内：\n{joke}",
  );

  const analysisChain = new RunnableLambda({
    func: async (input) => {
      const joke = await jokeChain.invoke(input);
      return { joke };
    },
  })
    .pipe(analysisPrompt)
    .pipe(llm)
    .pipe(parser);

  const introChain = ChatPromptTemplate.fromTemplate(
    "介绍{topic}的一个冷知识，控制在60字以内。",
  )
    .pipe(llm)
    .pipe(parser);

  const parallelChain = RunnableMap.from({
    joke: jokeChain,
    intro: introChain,
    analysis: analysisChain,
  });

  console.log("=== Pipe invoke demo ===");
  const joke = await jokeChain.invoke({ topic });
  console.log(joke);

  console.log("\n=== Stream demo ===");
  const stream = await jokeChain.stream({ topic });
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");

  console.log("\n=== RunnableLambda demo ===");
  const analysis = await analysisChain.invoke({ topic });
  console.log(analysis);

  console.log("\n=== RunnableMap demo ===");
  const parallelResult = await parallelChain.invoke({ topic });
  console.log(JSON.stringify(parallelResult, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
