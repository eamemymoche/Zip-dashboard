"use client";

import type { OrderRecord } from "../lib/ops-data";

type OrderEditForm = {
  booking: string;
  agent: string;
  packet: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  hotel: string;
  room: string;
  join: string;
  visitor: string;
};

type OrderEditField = keyof OrderEditForm;

type OrderDetailRowProps = {
  order: OrderRecord;
  isEditing: boolean;
  editForm: OrderEditForm | null;
  userRole: string | null;
  canEdit: boolean;
  formatStatus: (status: string) => string;
  statusClass: (status: string) => string;
  onEditFieldChange: (field: OrderEditField, value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onStartEdit: (order: OrderRecord) => void;
  onDelete: (orderId: number) => void;
};

export default function OrderDetailRow({
  order,
  isEditing,
  editForm,
  userRole,
  canEdit,
  formatStatus,
  statusClass,
  onEditFieldChange,
  onCancelEdit,
  onSaveEdit,
  onStartEdit,
  onDelete
}: OrderDetailRowProps) {
  const isRestricted = !canEdit || userRole === "STAFF" || userRole === "DRIVER";

  return (
    <tr className="order-detail-row">
      <td colSpan={10}>
        <div className="order-detail-panel">
          {isEditing && editForm ? (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Booking No.</span>
                <input className="order-edit-input" value={editForm.booking} onChange={(e) => onEditFieldChange("booking", e.target.value)} />
              </div>
              <div className="detail-item">
                <span className="detail-label">Agent</span>
                <input className="order-edit-input" value={editForm.agent} onChange={(e) => onEditFieldChange("agent", e.target.value)} />
              </div>
              <div className="detail-item">
                <span className="detail-label">Packet</span>
                <input className="order-edit-input" value={editForm.packet} onChange={(e) => onEditFieldChange("packet", e.target.value)} />
              </div>
              <div className="detail-item">
                <span className="detail-label">วันที่ / รอบ</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="order-edit-input" style={{ width: "110px" }} value={editForm.date} onChange={(e) => onEditFieldChange("date", e.target.value)} />
                  <input className="order-edit-input" style={{ width: "70px" }} value={editForm.time} onChange={(e) => onEditFieldChange("time", e.target.value)} />
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">ลูกค้า</span>
                <input className="order-edit-input" value={editForm.name} onChange={(e) => onEditFieldChange("name", e.target.value)} />
              </div>
              <div className="detail-item">
                <span className="detail-label">เบอร์โทร</span>
                <input className="order-edit-input" value={editForm.phone} onChange={(e) => onEditFieldChange("phone", e.target.value)} />
              </div>
              <div className="detail-item">
                <span className="detail-label">โรงแรม / ห้อง</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="order-edit-input" style={{ width: "100px" }} value={editForm.hotel} onChange={(e) => onEditFieldChange("hotel", e.target.value)} />
                  <input className="order-edit-input" style={{ width: "60px" }} value={editForm.room} onChange={(e) => onEditFieldChange("room", e.target.value)} />
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pax / Join</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input className="order-edit-input" style={{ width: "50px" }} value={editForm.join} onChange={(e) => onEditFieldChange("join", e.target.value)} />
                  <input className="order-edit-input" style={{ width: "50px" }} value={editForm.visitor} onChange={(e) => onEditFieldChange("visitor", e.target.value)} />
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">คนขับ</span>
                <strong style={{ color: "var(--muted)" }}>{order.driver || "ยังไม่จัด"}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">สถานะ</span>
                <span className={`status-badge ${statusClass(order.boarding)}`}>{formatStatus(order.boarding)}</span>
              </div>
              <div className="detail-item full">
                <span className="detail-label">Staff ที่จัด</span>
                <strong style={{ color: "var(--muted)" }}>{order.assignedStaff.join(", ") || "ยังไม่จัด"}</strong>
              </div>
              {order.adminNote ? (
                <div className="detail-item full">
                  <span className="detail-label">Note</span>
                  <em className="note-text">{order.adminNote}</em>
                </div>
              ) : null}
              <div className="detail-item full" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button className="secondary-button" style={{ padding: "9px 16px" }} onClick={onCancelEdit} type="button">
                  ยกเลิก
                </button>
                <button className="primary-button" style={{ padding: "9px 16px" }} onClick={onSaveEdit} type="button">
                  บันทึก
                </button>
              </div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">Booking No.</span><strong>{order.booking}</strong></div>
              <div className="detail-item"><span className="detail-label">Agent</span><strong>{order.agent}</strong></div>
              <div className="detail-item"><span className="detail-label">Packet</span><strong>{order.packet}</strong></div>
              <div className="detail-item"><span className="detail-label">วันที่ / รอบ</span><strong>{order.date} / {order.time}</strong></div>
              <div className="detail-item"><span className="detail-label">ลูกค้า</span><strong>{order.name}</strong></div>
              <div className="detail-item"><span className="detail-label">เบอร์โทร</span><strong>{order.phone}</strong></div>
              <div className="detail-item"><span className="detail-label">โรงแรม / ห้อง</span><strong>{order.hotel} ({order.room})</strong></div>
              <div className="detail-item"><span className="detail-label">Pax / Join</span><strong>{order.join + order.visitor} / {order.join}</strong></div>
              <div className="detail-item"><span className="detail-label">คนขับ</span><strong>{order.driver || "ยังไม่จัด"}</strong></div>
              <div className="detail-item"><span className="detail-label">Staff ที่จัด</span><strong style={{ color: "var(--muted)" }}>{order.assignedStaff.join(", ") || "ยังไม่จัด"}</strong></div>
              <div className="detail-item full detail-item-status-inline">
                {order.adminNote ? (
                  <div className="detail-note-inline">
                    <span className="detail-label">Note</span>
                    <em className="note-text">{order.adminNote}</em>
                  </div>
                ) : null}
                <div className="detail-status-group">
                  <span className="detail-status-title">สถานะ</span>
                  <span className={`status-badge ${statusClass(order.boarding)}`}>{formatStatus(order.boarding)}</span>
                </div>
                <div className="detail-actions">
                  <button
                    className="indigo-button"
                    onClick={() => onStartEdit(order)}
                    disabled={isRestricted}
                    title={isRestricted ? "ไม่มีสิทธิ์แก้ไข" : ""}
                    type="button"
                  >
                    แก้ไข
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => onDelete(order.id)}
                    disabled={isRestricted}
                    title={isRestricted ? "ไม่มีสิทธิ์ลบ" : ""}
                    type="button"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
