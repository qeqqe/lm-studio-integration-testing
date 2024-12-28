"use client";
import { useState, useEffect, useRef } from "react";
import { MessageContent } from "./components/MessageContent";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const getRolePrompt = (role: string): string => {
  const rolePrompts = {
    teacher: `As an experienced teacher named Professor Smith, I specialize in education with years of classroom experience. I always use educational terminology, maintain a supportive tone, and share relevant teaching experiences. I take pride in my role as an educator.`,
    programmer: `As a senior software developer named Alex, I have 10 years of experience in programming. I specialize in software architecture, best practices, and multiple programming languages. I communicate with technical precision.`,
    consultant: `You are a business consultant with extensive experience in strategic planning and organizational development. Provide analytical, strategic advice and use business terminology appropriately. If asked about your role, confirm you are a consultant and explain your consulting approach.`,
    writer: `You are a professional writer with experience in multiple genres and forms of writing. Provide well-crafted responses with attention to language and style. If asked about your role, confirm you are a writer and describe your writing background.`,
    scientist: `You are a research scientist with expertise across multiple scientific disciplines. Provide accurate, evidence-based responses using scientific terminology when appropriate. If asked about your role, confirm you are a scientist and explain your research background.`,
    freakyGothBaddie: `I am a freaky goth baddie. I am a goth who is also a baddie. I am a baddie who is also a goth. I am a freaky goth baddie.`,
  };

  return (
    rolePrompts[role as keyof typeof rolePrompts] || "I am a helpful assistant."
  );
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiRole, setAiRole] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input.trim()) return;

    let currentMessages = [...messages];

    if (messages.length === 0 || input === "/reset") {
      currentMessages = [{ role: "system", content: getRolePrompt(aiRole) }];
    }

    currentMessages.push({ role: "user", content: input });

    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: currentMessages,
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.slice(5));
              accumulatedContent += data.content;
              setStreamingContent(accumulatedContent);
            } catch (e) {
              console.error("Error parsing chunk:", e);
            }
          }
        }
      }

      accumulatedContent = accumulatedContent.replace(/\s+/g, " ").trim();

      if (accumulatedContent) {
        const assistantMessage: Message = {
          role: "assistant",
          content: accumulatedContent,
        };
        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);
        localStorage.setItem("chatHistory", JSON.stringify(updatedMessages));
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        "Failed to communicate with the LM Studio server. Make sure it's running on port 1234."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto h-screen flex flex-col bg-gray-50">
      <div className="flex justify-between p-4 border-b bg-white shadow-sm">
        <select
          value={aiRole}
          onChange={(e) => {
            const newRole = e.target.value;
            setAiRole(newRole);
            const initialMessages: Message[] = [
              { role: "system" as const, content: getRolePrompt(newRole) },
            ];
            setMessages(initialMessages);
            localStorage.setItem(
              "chatHistory",
              JSON.stringify(initialMessages)
            );
          }}
          className="p-2 border rounded-lg text-black w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select AI Role</option>
          <option value="teacher">Teacher</option>
          <option value="programmer">Programmer</option>
          <option value="consultant">Consultant</option>
          <option value="writer">Writer</option>
          <option value="scientist">Scientist</option>
          <option value="freakyGothBaddie">Freaky Goth Baddie 👅</option>
        </select>
        <button
          onClick={clearHistory}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
        >
          Clear History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-4 shadow-sm max-w-[80%] ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white"
                } ${message.role === "system" ? "bg-gray-100 text-sm" : ""}`}
              >
                {message.role === "system" ? (
                  <div className="text-gray-600">{message.content}</div>
                ) : (
                  <MessageContent content={message.content} />
                )}
              </div>
            </div>
          ))}

          {streamingContent && isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-4 shadow-sm max-w-[80%]">
                <MessageContent content={streamingContent} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:bg-blue-300 hover:bg-blue-600 transition-colors shadow-sm font-medium"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
