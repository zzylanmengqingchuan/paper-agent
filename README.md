# Weather Tool Homework

This project shows how to:

1. Define a custom LangChain tool.
2. Bind the tool to a DeepSeek chat model.
3. Let the model decide when to call the tool.
4. Execute the tool and send the result back to the model.

## Install

```bash
npm install
```

## Configure

Create a `.env` file:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## Run

```bash
npm start
```

Run the chain homework demo:

```bash
npm run chain
```

You can also pass a topic:

```bash
node src/chain-demo.js 北极熊
```

## Notes

- The weather tool uses `wttr.in` as a simple public weather endpoint, so no extra weather API key is required.
- The model will first produce a `tool_call`, then the script executes the tool, and finally the model generates a natural-language answer based on the tool result.
