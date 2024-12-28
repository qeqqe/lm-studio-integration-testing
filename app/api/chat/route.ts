import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const messages = body.messages.sort((a: any, b: any) => {
      if (a.role === "system") return -1;
      if (b.role === "system") return 1;
      return 0;
    });

    const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        messages,
        stream: true,
      }),
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                if (line.includes("[DONE]")) continue;
                const json = JSON.parse(line.slice(5));
                if (json.choices?.[0]?.delta?.content) {
                  let content = json.choices[0].delta.content;
                  if (!/\s$/.test(content) && !/^\s/.test(content)) {
                    content += " ";
                  }
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch (e) {
                console.error("Error parsing chunk:", e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to communicate with LM Studio" },
      { status: 500 }
    );
  }
}
