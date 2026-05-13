import { NextResponse } from "next/server";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantContextSnapshot = {
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

type MiniMaxResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  base_resp?: {
    status_code?: number;
    status_msg?: string;
  };
};

const MINIMAX_API_URL = "https://api.minimax.io/v1/chat/completions";

function buildContextBlock(context: AssistantContextSnapshot) {
  const driverSummary =
    context.driverLoads.length > 0
      ? context.driverLoads
          .map((driver) => `${driver.driver}: ${driver.trips} งาน / ${driver.pax} pax`)
          .join("; ")
      : "ยังไม่มีข้อมูลคนขับในมุมมองนี้";

  const prioritySummary =
    context.priorityBookings.length > 0
      ? context.priorityBookings
          .map(
            (item) =>
              `${item.booking} ${item.customer} ${item.hotel} ${item.slot} ${item.status}${
                item.note ? ` หมายเหตุ: ${item.note}` : ""
              }`
          )
          .join("\n")
      : "ไม่มีรายการเสี่ยง";

  return [
    `โมดูลปัจจุบัน: ${context.activeModule}`,
    `วันที่โฟกัส: ${context.focusDate}`,
    `จำนวน booking ที่มองเห็น: ${context.totals.visibleBookings}`,
    `จำนวน pax รวม: ${context.totals.totalPax}`,
    `รอรับ/รอดำเนินการ: ${context.totals.waitingCount}`,
    `No Show: ${context.totals.noShowCount}`,
    `ยังไม่ assign รถ: ${context.totals.unassignedDrivers}`,
    `ภาระงานคนขับ: ${driverSummary}`,
    `รายการที่ควรจับตา:\n${prioritySummary}`
  ].join("\n");
}

function sanitizeReply(content: string) {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "ยังไม่ได้ตั้งค่า MINIMAX_API_KEY สำหรับผู้ช่วยปฏิบัติการ"
      },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as {
    messages?: AssistantMessage[];
    context?: AssistantContextSnapshot;
  };

  const messages = payload.messages?.filter((message) => message.content?.trim()) ?? [];
  const context = payload.context;

  if (!messages.length || !context) {
    return NextResponse.json({ error: "ข้อมูลคำถามไม่ครบ" }, { status: 400 });
  }

  const systemPrompt = [
    "คุณคือผู้ช่วยปฏิบัติการสำหรับ Zipline Command Center",
    "ตอบเป็นภาษาไทยเป็นหลัก น้ำเสียงกระชับ ชัด และช่วยตัดสินใจเชิงปฏิบัติการ",
    "ห้ามอ้างว่าคุณเห็นข้อมูลนอกเหนือจาก context ที่ส่งมา",
    "ถ้าผู้ใช้ถามให้ช่วยสรุป ให้จัดคำตอบเป็นหัวข้อสั้น ๆ ที่ใช้ทำงานต่อได้ทันที",
    "ถ้ามีความเสี่ยงเชิงปฏิบัติการ เช่น no-show, งานค้าง, รถยังไม่ assign ให้ชี้ออกมาตรง ๆ",
    "ถ้าผู้ใช้ขอให้ร่างข้อความ ให้เขียนให้พร้อมส่งในภาษาไทย",
    "บริบทแดชบอร์ดปัจจุบัน:\n" + buildContextBlock(context)
  ].join("\n");

  try {
    const minimaxResponse = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_MODEL || "MiniMax-M2.7",
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            name: "Ops AI",
            content: systemPrompt
          },
          ...messages.slice(-8).map((message) => ({
            role: message.role,
            name: message.role === "assistant" ? "Ops AI" : "User",
            content: message.content
          }))
        ]
      })
    });

    const result = (await minimaxResponse.json()) as MiniMaxResponse;

    if (!minimaxResponse.ok) {
      return NextResponse.json(
        {
          error: result.base_resp?.status_msg || "MiniMax ไม่ตอบกลับตามปกติ"
        },
        { status: 502 }
      );
    }

    const reply = sanitizeReply(result.choices?.[0]?.message?.content || "");

    if (!reply) {
      return NextResponse.json({ error: "MiniMax ไม่ส่งข้อความกลับมา" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        error: "เชื่อมต่อ MiniMax ไม่สำเร็จในตอนนี้"
      },
      { status: 502 }
    );
  }
}
