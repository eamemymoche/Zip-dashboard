"use client";

import { useLang } from "./i18n";

import type { EmployeeRecord } from "../lib/ops-data";

type PersonnelViewProps = {
  employees: EmployeeRecord[];
  expandedEmployeeId: string | null;
  onToggleEmployee: (employeeId: string) => void;
  onOpenNewEmployee: () => void;
  onEditEmployee: (employee: EmployeeRecord) => void;
};

type PersonnelSectionProps = {
  title: string;
  icon: string;
  role: EmployeeRecord["role"];
  roleDotClassName: string;
  avatarPlaceholderClassName?: string;
  employees: EmployeeRecord[];
  expandedEmployeeId: string | null;
  onToggleEmployee: (employeeId: string) => void;
  onEditEmployee: (employee: EmployeeRecord) => void;
};

function PersonnelSection({
  title,
  icon,
  role,
  roleDotClassName,
  avatarPlaceholderClassName,
  employees,
  expandedEmployeeId,
  onToggleEmployee,
  onEditEmployee
}: PersonnelSectionProps) {
  const roleEmployees = employees.filter((employee) => employee.role === role);

  return (
    <div className="personnel-section">
      <div className="personnel-section-header">
        <span className="personnel-section-icon">{icon}</span>
        <h3>{title}</h3>
        <span className="personnel-count">{roleEmployees.length}</span>
      </div>
      <div className="personnel-card-grid">
        {roleEmployees.map((employee) => (
          <div key={employee.id} className="personnel-card">
            <div className="personnel-card-main" onClick={() => onToggleEmployee(employee.id)}>
              <div className="personnel-avatar-wrap">
                {employee.photo ? (
                  <img src={employee.photo} alt={employee.name} className="personnel-avatar" />
                ) : (
                  <div className={`personnel-avatar-placeholder${avatarPlaceholderClassName ? ` ${avatarPlaceholderClassName}` : ""}`}>
                    {employee.name.charAt(0)}
                  </div>
                )}
                <span className={`personnel-role-dot ${roleDotClassName}`} />
              </div>
              <div className="personnel-info">
                <div className="personnel-name">
                  {employee.name} <span className="personnel-nickname">({employee.nickname})</span>
                </div>
                <div className="personnel-id-code">{employee.id}</div>
                <div className="personnel-quick-contact">
                  {employee.phone ? <span>📞 {employee.phone}</span> : null}
                </div>
              </div>
              <div className="personnel-expand-hint">{expandedEmployeeId === employee.id ? "−" : "+"}</div>
            </div>
            {expandedEmployeeId === employee.id ? (
              <div className="personnel-detail-panel">
                <div className="personnel-detail-grid">
                  <div className="pd-item">
                    <span className="pd-label">ชื่อเล่น</span>
                    <strong>{employee.nickname}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">เบอร์หลัก</span>
                    <strong>{employee.phone || "-"}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">เบอร์สำรอง</span>
                    <strong>{employee.phone2 || "-"}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">วันเข้าทำงาน</span>
                    <strong>{employee.startDate || "-"}</strong>
                  </div>
                </div>
                <button
                  className="indigo-button"
                  style={{ marginTop: "12px", width: "100%" }}
                  type="button"
                  onClick={() => onEditEmployee(employee)}
                >
                  แก้ไขข้อมูล
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PersonnelView({
  employees,
  expandedEmployeeId,
  onToggleEmployee,
  onOpenNewEmployee,
  onEditEmployee
}: PersonnelViewProps) {
  const { t } = useLang();
  const staffCount = employees.filter((employee) => employee.role === "Staff").length;
  const driverCount = employees.filter((employee) => employee.role === "Driver").length;

  return (
    <section className="view-section">
      <div className="glass-card">
        <div className="section-header">
          <div>
            <h2>{t("personnel.title")}</h2>
            <p>
              {employees.length} คน ({staffCount} ไกด์สนาม / {driverCount} คนขับรถ)
            </p>
          </div>
          <button className="indigo-button" onClick={onOpenNewEmployee} type="button">
            {t("personnel.newEmployee")}
          </button>
        </div>

        <PersonnelSection
          title="ไกด์สนาม (Staff)"
          icon="🧑‍💼"
          role="Staff"
          roleDotClassName="staff-dot"
          employees={employees}
          expandedEmployeeId={expandedEmployeeId}
          onToggleEmployee={onToggleEmployee}
          onEditEmployee={onEditEmployee}
        />

        <div style={{ marginTop: "24px" }}>
          <PersonnelSection
            title="คนขับรถ (Driver)"
            icon="🚌"
            role="Driver"
            roleDotClassName="driver-dot"
            avatarPlaceholderClassName="driver-color"
            employees={employees}
            expandedEmployeeId={expandedEmployeeId}
            onToggleEmployee={onToggleEmployee}
            onEditEmployee={onEditEmployee}
          />
        </div>
      </div>
    </section>
  );
}
