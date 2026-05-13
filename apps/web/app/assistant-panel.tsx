"use client";

import { FormEvent, useMemo, useState } from "react";

export type AssistantContextSnapshot = {
  activeModule: string;
  focusDate: string;
  totals: {
    visibleBookings: number;
    totalPax: number;
    waitingCount: number;
    noShowCount: number;
    unassignedDrivers: number;
  };
  driverLoads: Array<{
    driver: string;
    trips: number;
    pax: number;
  }>;
  priorityBookings: Array<{
    booking: string;
    customer: string;
    hotel: string;
    slot: string;
    status: string;
    note: string;
  }>;
};

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  "สรุปงานวันนี้ให้หน่อย",
  "มี booking ไหนต้องตามต่อด่วนบ้าง",
  "ช่วยดูรอบรถที่ยังไม่ได้ assign",
  "เขียนสรุปสั้น ๆ ส่งหัวหน้าให้หน่อย"
];

export function AssistantPanel({ context }: { context: AssistantContextSnapshot }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "ผู้ช่วยปฏิบัติการพร้อมแล้วค่ะ ถ้าต้องการสรุปงาน, เช็ก no-show, ไล่ booking เสี่ยง หรือช่วยร่างข้อความส่งทีม บอกได้เลย"
    }
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const statusText = useMemo(() => {
    if (context.totals.noShowCount > 0) {
      return `มี No Show ${context.totals.noShowCount} รายการ`;
    }
    if (context.totals.unassignedDrivers > 0) {
      return `ยังไม่ได้จัดรถ ${context.totals.unassignedDrivers} รายการ`;
    }
    return "ภาพรวมงานค่อนข้างนิ่ง";
  }, [context]);

  async function sendMessage(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subagent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages,
          context
        })
      });

      const payload = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "ไม่สามารถเรียกผู้ช่วยได้");
      }

      setMessages((current) => [...current, { role: "assistant", content: payload.reply! }]);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "ระบบผู้ช่วยยังไม่พร้อมใช้งาน";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <aside className="assistant-panel">
      <div className="assistant-panel__header">
        <div>
          <p className="assistant-panel__eyebrow">MiniMax Ops Subagent</p>
          <h2>ผู้ช่วยปฏิบัติการ</h2>
        </div>
        <span className="assistant-panel__status">{statusText}</span>
      </div>

      <div className="assistant-panel__summary">
        <div className="assistant-metric">
          <span>โมดูล</span>
          <strong>{context.activeModule}</strong>
        </div>
        <div className="assistant-metric">
          <span>วันที่โฟกัส</span>
          <strong>{context.focusDate}</strong>
        </div>
        <div className="assistant-metric">
          <span>Booking</span>
          <strong>{context.totals.visibleBookings}</strong>
        </div>
        <div className="assistant-metric">
          <span>Pax</span>
          <strong>{context.totals.totalPax}</strong>
        </div>
      </div>

      <div className="assistant-panel__chips">
        {quickPrompts.map((prompt) => (
          <button
            className="assistant-chip"
            key={prompt}
            onClick={() => void sendMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="assistant-feed">
        {messages.map((message, index) => (
          <article
            className={
              message.role === "assistant" ? "assistant-bubble assistant" : "assistant-bubble user"
            }
            key={`${message.role}-${index}`}
          >
            <span>{message.role === "assistant" ? "OPS AI" : "คุณ"}</span>
            <p>{message.content}</p>
          </article>
        ))}
        {isLoading ? (
          <article className="assistant-bubble assistant">
            <span>OPS AI</span>
            <p>กำลังสรุปข้อมูลปฏิบัติการให้...</p>
          </article>
        ) : null}
      </div>

      <div className="assistant-panel__footer">
        <div className="assistant-priority">
          <h3>รายการที่ควรจับตา</h3>
          <ul>
            {context.priorityBookings.length ? (
              context.priorityBookings.map((item) => (
                <li key={`${item.booking}-${item.slot}`}>
                  <strong>{item.booking}</strong> {item.customer} / {item.hotel} / {item.slot}
                </li>
              ))
            ) : (
              <li>ยังไม่มีรายการเสี่ยงในมุมมองนี้</li>
            )}
          </ul>
        </div>

        <form className="assistant-composer" onSubmit={handleSubmit}>
          <textarea
            onChange={(event) => setDraft(event.target.value)}
            placeholder="ถามเป็นภาษาไทยได้เลย เช่น ช่วยสรุปงานจัดรถรอบ 07:00"
            rows={3}
            value={draft}
          />
          <div className="assistant-composer__actions">
            {error ? <p className="assistant-error">{error}</p> : <div />}
            <button className="primary-button" disabled={isLoading} type="submit">
              ส่งให้ผู้ช่วย
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
