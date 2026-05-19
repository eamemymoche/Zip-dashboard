"use client";

import { useEffect, useState } from "react";

type BackupMode = "always-on" | "daily-snapshot" | "plugin-vault" | "overlap-recovery";

type BackupViewProps = {
  backupMode: BackupMode;
  onBackupModeChange: (mode: BackupMode) => void;
  lang?: "th" | "en";
};

type BackupStatus = {
  status: string;
  recoveryMode: string;
  generatedAt: string;
  layers: { key: string; label: string; state: string; flexible: boolean }[];
  plugins: { key: string; label: string; state: string }[];
};

const modeCards: Record<BackupMode, { title: string; subtitle: string; bullets: string[] }> = {
  "always-on": {
    title: "Always-on Safety Net",
    subtitle: "สำรองแบบพื้นฐาน ให้ระบบไม่หยุดแม้เกิดปัญหากะทันหัน",
    bullets: ["เก็บสำเนารายวัน", "พร้อมกู้คืนเร็ว", "เหมาะกับทีม non-IT"]
  },
  "daily-snapshot": {
    title: "Daily Snapshot",
    subtitle: "บันทึกภาพรวมทั้งระบบเป็นรอบ ๆ เหมือนถ่ายรูปสถานะงานทุกวัน",
    bullets: ["ย้อนกลับได้เป็นวัน", "ดูความต่างก่อน-หลัง", "เหมาะกับ rollback"]
  },
  "plugin-vault": {
    title: "Plugin Vault",
    subtitle: "พื้นที่สำหรับส่วนเสริม backup เช่น export, checksum, mirror, offsite sync",
    bullets: ["ต่อ plugin ได้ง่าย", "แยกหน้าที่ชัด", "ขยายภายหลังได้"]
  },
  "overlap-recovery": {
    title: "Overlap Recovery",
    subtitle: "กู้คืนแบบซ้อนทับความปลอดภัย ใช้หลายชั้นกันข้อมูลหาย",
    bullets: ["มีสำเนาหลักและสำรอง", "เทียบความต่างได้", "ลดโอกาสข้อมูลขาดตอน"]
  }
};

const checkpoints = [
  { label: "Database", status: "Healthy", detail: "PostgreSQL backup cadence is defined." },
  { label: "App Config", status: "Ready", detail: "Env and auth settings can be packed with the backup." },
  { label: "Attachments", status: "Planned", detail: "Future file vault can be mirrored as a plugin." },
  { label: "Recovery Runbook", status: "Ready", detail: "Non-IT users see a step-by-step restore flow." }
];

const pluginIdeas = [
  "Auto snapshot scheduler",
  "Offsite mirror plugin",
  "Integrity check plugin",
  "One-click restore plugin",
  "Overlap compare plugin"
];

export function BackupView({ backupMode, onBackupModeChange, lang = "th" }: BackupViewProps) {
  const isEn = lang === "en";
  const current = modeCards[backupMode];
  const [status, setStatus] = useState<BackupStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/backup/status", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: BackupStatus | null) => {
        if (alive) setStatus(data);
      })
      .catch(() => {
        if (alive) setStatus(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="view-section">
      <div className="glass-card">
        <div className="section-header section-header-lg">
          <div>
            <h2>Backup & Recovery</h2>
            <p>{isEn ? "The final safety dashboard for simple backup, plugin recovery, and overlap protection." : "หน้าเก็บความปลอดภัยสุดท้ายของระบบ ให้คนใช้งานทั่วไปเข้าใจง่ายและกดทำงานได้เป็นขั้นตอน"}</p>
          </div>
          <div className="toolbar muted">
            <span>{isEn ? "Protection Mode" : "โหมดปกป้องข้อมูล"}</span>
            <strong>{current.title}</strong>
          </div>
        </div>

        <div className="subnav">
          {Object.entries(modeCards).map(([key, card]) => (
            <button
              className={backupMode === key ? "subnav-button active" : "subnav-button"}
              key={key}
              onClick={() => onBackupModeChange(key as BackupMode)}
              type="button"
            >
              {card.title}
            </button>
          ))}
        </div>

        <div className="backup-hero">
          <div>
            <span className="backup-kicker">{isEn ? "Protect first, recover faster" : "ป้องกันก่อน หายทีหลังแก้ยาก"}</span>
            <h3>{current.title}</h3>
            <p>{current.subtitle}</p>
            <div className="backup-pill-row">
              {current.bullets.map((bullet) => <span key={bullet}>{bullet}</span>)}
            </div>
          </div>
          <div className="backup-status-card">
            <span>สถานะตอนนี้</span>
            <strong>{status ? (isEn ? "Connected" : "เชื่อมต่อแล้ว") : (isEn ? "Design Ready" : "พร้อมออกแบบ")}</strong>
            <small>{status ? `mode: ${status.recoveryMode}` : isEn ? "This is the final safety layer for the whole operation." : "ระบบนี้ควรถูกมองว่าเป็น safety layer ต่อท้ายสุดของงานทั้งหมด"}</small>
          </div>
        </div>

        <div className="backup-grid">
          <div className="backup-panel">
            <h4>{isEn ? "What Gets Backed Up" : "สิ่งที่สำรอง"}</h4>
            <ul className="backup-list">
              <li>{isEn ? "Core database records" : "ข้อมูลหลักจากฐานข้อมูล"}</li>
              <li>{isEn ? "Important app configuration" : "คอนฟิกสำคัญของระบบ"}</li>
              <li>{isEn ? "Change history and audit trail" : "บันทึกการเปลี่ยนแปลงและ audit"}</li>
              <li>{isEn ? "Future attachments or related assets" : "ไฟล์แนบหรือ asset ที่เกี่ยวข้องในอนาคต"}</li>
            </ul>
          </div>

          <div className="backup-panel">
            <h4>{isEn ? "Overlap Recovery Idea" : "วิธีคิดแบบ overlap"}</h4>
            <ul className="backup-list">
              <li>{isEn ? "Keep primary and secondary copies" : "มีสำเนาหลักและสำเนารอง"}</li>
              <li>{isEn ? "Compare data before restore" : "เทียบข้อมูลก่อนยืนยันการกู้คืน"}</li>
              <li>{isEn ? "Fallback if one layer fails" : "fallback ได้แม้จุดใดจุดหนึ่งล้ม"}</li>
              <li>{isEn ? "Reduce single-point failure" : "ลดการพึ่งพาจุดเดียวแบบเปราะบาง"}</li>
            </ul>
          </div>

          <div className="backup-panel">
            <h4>Plugin Backup Layer</h4>
            <ul className="backup-list">
              {pluginIdeas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="backup-checklist">
          {(status?.layers ?? checkpoints).map((item) => (
            <div className="backup-check" key={item.label}>
              <strong>{item.label}</strong>
              <span>{"status" in item ? item.status : item.state}</span>
              <p>{"detail" in item ? item.detail : item.flexible ? (isEn ? "Flexible for future data model changes" : "ยืดหยุ่นสำหรับ data model ในอนาคต") : "fixed layer"}</p>
            </div>
          ))}
        </div>

        <div className="backup-flow">
          <div className="backup-flow-step">
            <strong>1. Backup</strong>
            <p>{isEn ? "Capture system state without interrupting users" : "จับภาพสถานะระบบเป็นจุด ๆ โดยไม่รบกวนผู้ใช้"}</p>
          </div>
          <div className="backup-flow-step">
            <strong>2. Verify</strong>
            <p>{isEn ? "Verify files and data before marking it recoverable" : "เช็กว่าไฟล์และข้อมูลครบก่อนรับรองว่าพร้อมกู้คืน"}</p>
          </div>
          <div className="backup-flow-step">
            <strong>3. Overlap</strong>
            <p>{isEn ? "Keep overlapping layers to reduce single-point failure" : "เก็บสำเนาซ้อนทับไว้หลายชั้น เพื่อลด single point of failure"}</p>
          </div>
          <div className="backup-flow-step">
            <strong>4. Restore</strong>
            <p>{isEn ? "Restore with guided steps for non-IT users" : "กู้คืนแบบมีคำแนะนำทีละขั้นสำหรับ non-IT user"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
