"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Booking, SupportMessage } from "./types";

type Props = {
  activeBooking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FAULT_QUICK = [
  "Freno non funziona",
  "Batteria scarica",
  "Ruota danneggiata",
  "Luci non funzionano",
];

export default function SupportChat({
  activeBooking,
  open,
  onOpenChange,
}: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/support");
    if (res.ok) {
      setMessages(await res.json());
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadMessages();
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [open, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;

    const trimmed = text.trim();
    setSending(true);
    setInput("");

    const optimistic: SupportMessage = {
      id: -Date.now(),
      message: trimmed,
      isStaff: false,
      vehicleId: activeBooking?.vehicleId ?? null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        vehicleId: activeBooking?.vehicleId ?? null,
      }),
    });

    if (res.ok) {
      const { userMsg, staffMsg } = await res.json();
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        userMsg,
        staffMsg,
      ]);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
    setSending(false);
  }

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => onOpenChange(!open)}
        title="Assistenza"
      >
        💬
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <strong>Assistenza Zootropolis</strong>
              {activeBooking && (
                <p className="chat-sub">
                  Mezzo #{activeBooking.vehicleId} in uso
                </p>
              )}
            </div>
            <button type="button" onClick={() => onOpenChange(false)}>
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">
                Segnala un guasto o scrivi all&apos;assistenza.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.isStaff ? "chat-bubble--staff" : "chat-bubble--user"}`}
              >
                {m.message}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {activeBooking && (
            <div className="chat-quick">
              {FAULT_QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(`Guasto: ${q}`)}
                  disabled={sending}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              placeholder="Scrivi un messaggio..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
