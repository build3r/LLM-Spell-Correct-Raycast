import {
  getSelectedText,
  Clipboard,
  showHUD,
  showToast,
  Toast,
  ActionPanel,
  Action,
  Detail,
  closeMainWindow,
  PopToRootType,
  Icon,
} from "@raycast/api";
import { useState, useEffect, useRef } from "react";
import fetch from "node-fetch";

// Ollama API endpoint (adjust if your local deployment uses a different port)
const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";

// Specify the Ollama model you want to use
const OLLAMA_MODEL = "gnokit/improve-grammar"; // or any other model you've pulled, like "llama2"

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [correctedText, setCorrectedText] = useState("");
  const hasAttemptedCorrection = useRef(false);

  useEffect(() => {
    if (!hasAttemptedCorrection.current) {
      correctText();
      hasAttemptedCorrection.current = true;
    }
  }, []);

  async function correctText() {
    console.log("Starting text correction process");
    setIsLoading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Correcting text...",
    });
    try {
      const clipboardText = await Clipboard.readText();
      let selectedText = await getSelectedText();
      const textToCorrect = selectedText || clipboardText;

      if (!textToCorrect) {
        setIsLoading(false);
        toast.hide();
        await showHUD("No text to correct");
        return;
      }

      const prompt = `You are assistant which corrects simple mistakes for a person, coder, software engineer who is still learning touch typing on keyboard. You Correct all spelling and grammar errors in the following text without altering its original meaning. Fix capitalization if needed. Preserve the EXACT formatting. Output only the corrected text—no explanations, no extra quotes, no extra double quotes, don't add text like corrected text and no additional words: ${selectedText}`;
      console.log("prompt", prompt);
      const response = await fetch(OLLAMA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const corrected = data.response.trim();
        console.log("Corrected text:", corrected);
        setCorrectedText(corrected);
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "Failed to correct text",
        });
      }
    } catch (error) {
      console.error("Error occurred:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error.message,
      });
    } finally {
      setIsLoading(false);
      toast.hide();
    }
  }
/*   async function copyCorrectedText() {
    await Clipboard.copy(correctedText);
    await showToast({
      style: Toast.Style.Success,
      title: "Text corrected",
      message: "Copied to clipboard",
    });
    await closeMainWindow();
  } */
  return (
    <Detail
      markdown={isLoading ? "Correcting text..." : correctedText || "No text to correct"}
      actions={
        <ActionPanel>
          {correctedText && (
            <Action.CopyToClipboard
              title="Copy Corrected Text"
              content={correctedText}
              icon={Icon.Clipboard}
              // shortcut={{ modifiers: ["cmd"], key: "enter" }}
              onCopy={closeMainWindow({ popToRootType: PopToRootType.Immediate })}
            />
          )}
          {correctedText && <Action.Paste title="Enter Text" icon={Icon.TextInput} content={correctedText} />}
          <Action
            title="Correct Again"
            onAction={correctText}
            icon={Icon.Repeat}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    />
  );
}
