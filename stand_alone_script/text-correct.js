#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Text Corrector
// @raycast.mode fullOutput

// Optional parameters
// @raycast.icon 🤖

// Documentation:
// @raycast.description Coorect text in clip board
// @raycast.author shabaz

async function main() {
  const clipboardyM = await import("clipboardy");
  const fetchModule = await import("node-fetch");
  const fetch = fetchModule.default;
  const clipboardy = clipboardyM.default;
  const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";
  const OLLAMA_MODEL = "llama3"; // or any other model you've pulled, like "llama2"

  async function correctText() {
    try {
      const selectedText = await clipboardy.readSync();

      if (!selectedText) {
        console.log("No text in clipboard");
        return;
      }

      const prompt = `Please correct any spelling or grammar errors in the following text. Only output the corrected text, with no explanations:

"${selectedText}"`;

      const response = await fetch(OLLAMA_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
        }),
      });

      const data = await response.json();
      if (data.response) {
        const correctedText = data.response.trim();
        await clipboardy.writeSync(correctedText);
        console.log("Text corrected and copied to clipboard");
      } else {
        console.log("No corrections made or error occurred");
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  correctText().catch(console.error);
}

main().catch(console.error);
