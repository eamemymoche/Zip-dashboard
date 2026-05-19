"use client";

import { useLang } from "./i18n";

import type { EmployeeRecord } from "../lib/ops-data";

type PersonnelViewProps = {
  employees: EmployeeRecord[];
  expandedEmployeeId: string | null;
  onToggleEmployee: (employeeId: string) => void;
  onOpenNewEmployee: () => void;
  onEditEmployee: (employee: EmployeeRecord) => void;
  lang?: "th" | "en";
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
  const { lang } = useLang();
  const isEn = lang === "en";
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
                  {employee.phone ? <span>Phone: {employee.phone}</span> : null}
                </div>
              </div>
              <div className="personnel-expand-hint">{expandedEmployeeId === employee.id ? "−" : "+"}</div>
            </div>
            {expandedEmployeeId === employee.id ? (
              <div className="personnel-detail-panel">
                <div className="personnel-detail-grid">
                  <div className="pd-item">
                    <span className="pd-label">{isEn ? "Nickname" : "ชื่อเล่น"}</span>
                    <strong>{employee.nickname}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">English</span>
                    <strong>{[employee.englishFirstName, employee.englishLastName].filter(Boolean).join(" ") || "-"}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">Username</span>
                    <strong>{employee.username || "-"}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">{isEn ? "Main Phone" : "เบอร์หลัก"}</span>
                    <strong>{employee.phone || "-"}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">{isEn ? "Backup Phone" : "เบอร์สำรอง"}</span>
                    <strong>{employee.phone2 || "-"}</strong>
                  </div>
                  <div className="pd-item">
                    <span className="pd-label">{isEn ? "Start Date" : "วันเข้างาน"}</span>
                    <strong>{employee.startDate || "-"}</strong>
                  </div>
                </div>
                <button
                  className="indigo-button"
                  style={{ marginTop: "12px", width: "100%" }}
                  type="button"
                  onClick={() => onEditEmployee(employee)}
                >
                  {isEn ? "Edit Profile" : "แก้ไขข้อมูล"}
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
  onEditEmployee,
  lang = "th"
}: PersonnelViewProps) {
  const { t } = useLang();
  const isEn = lang === "en";
  const staffCount = employees.filter((employee) => employee.role === "Staff").length;
  const driverCount = employees.filter((employee) => employee.role === "Driver").length;
  const officerCount = employees.filter((employee) => employee.role === "Officer").length;
  const accountingCount = employees.filter((employee) => employee.role === "Accounting").length;

  return (
    <section className="view-section">
      <div className="glass-card">
        <div className="section-header">
          <div>
            <h2>{t("personnel.title")}</h2>
            <p>
              {isEn
                ? `${employees.length} people (${staffCount} staff / ${driverCount} drivers / ${officerCount} officers / ${accountingCount} accounting)`
                : t("personnel.countPrefix").replace("{total}", String(employees.length)).replace("{staff}", String(staffCount)).replace("{driver}", String(driverCount)).replace("{officer}", String(officerCount)).replace("{accounting}", String(accountingCount))}
            </p>
          </div>
          <button className="indigo-button" onClick={onOpenNewEmployee} type="button">
            {t("personnel.newEmployee")}
          </button>
        </div>

        <PersonnelSection
          title={t("personnel.section.officer")}
          icon="OPS"
          role="Officer"
          roleDotClassName="staff-dot"
          employees={employees}
          expandedEmployeeId={expandedEmployeeId}
          onToggleEmployee={onToggleEmployee}
          onEditEmployee={onEditEmployee}
        />

        <div style={{ marginTop: "24px" }}>
          <PersonnelSection
            title={t("personnel.section.accounting")}
            icon="$"
            role="Accounting"
            roleDotClassName="staff-dot"
            employees={employees}
            expandedEmployeeId={expandedEmployeeId}
            onToggleEmployee={onToggleEmployee}
            onEditEmployee={onEditEmployee}
          />
        </div>
        <div style={{ marginTop: "24px" }}>
          <PersonnelSection
            title={t("personnel.section.staff")}
            icon="ST"
            role="Staff"
            roleDotClassName="staff-dot"
            employees={employees}
            expandedEmployeeId={expandedEmployeeId}
            onToggleEmployee={onToggleEmployee}
            onEditEmployee={onEditEmployee}
          />
        </div>

        <div style={{ marginTop: "24px" }}>
          <PersonnelSection
            title={t("personnel.section.driver")}
            icon="DR"
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
