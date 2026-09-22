import { generateText } from 'ai';

async function main() {
  const { text } = await generateText({
    model: 'inclusionai/ling-3.0-flash-vl-free',
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  console.log(text);
}

main();
