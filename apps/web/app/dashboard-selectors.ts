import type { BookingStatus, EmployeeRecord, OrderRecord } from "../lib/ops-data";

type SortDir = "asc" | "desc";
type PivotGroupBy = "agent" | "packet";

export function buildFilteredOrders(
  orders: OrderRecord[],
  orderDateStart: string,
  orderDateEnd: string,
  orderSearch: string,
  selectedTimeSlots: string[]
) {
  return orders.filter((order) => {
    const query = orderSearch.trim().toLowerCase();
    const startOk = !orderDateStart || order.date >= orderDateStart;
    const endOk = !orderDateEnd || order.date <= orderDateEnd;
    const matchesDate = startOk && endOk;
    const matchesSlot = selectedTimeSlots.length === 0 || selectedTimeSlots.includes(order.time);
    const searchable = [
      order.name,
      order.booking,
      order.phone,
      order.agent,
      order.hotel,
      order.packet
    ]
      .join(" ")
      .toLowerCase();

    return matchesDate && matchesSlot && (!query || searchable.includes(query));
  });
}

export function buildSortedOrders(
  orders: OrderRecord[],
  orderSortField: string,
  orderSortDir: SortDir
) {
  return [...orders].sort((a, b) => {
    let cmp = 0;
    switch (orderSortField) {
      case "id": cmp = a.id - b.id; break;
      case "date": cmp = a.date.localeCompare(b.date); break;
      case "time": cmp = a.time.localeCompare(b.time); break;
      case "agent": cmp = a.agent.localeCompare(b.agent); break;
      case "booking": cmp = a.booking.localeCompare(b.booking); break;
      case "packet": cmp = a.packet.localeCompare(b.packet); break;
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "pax": cmp = (a.join + a.visitor) - (b.join + b.visitor); break;
      case "join": cmp = a.join - b.join; break;
      case "hotel": cmp = a.hotel.localeCompare(b.hotel); break;
      default: cmp = a.id - b.id;
    }
    return orderSortDir === "asc" ? cmp : -cmp;
  });
}

function countJoin(list: OrderRecord[]) {
  return list.reduce((sum, order) => sum + order.join, 0);
}

function countPax(list: OrderRecord[]) {
  return list.reduce((sum, order) => sum + order.join + order.visitor, 0);
}

function getSlotState(slot: string, currentHour: number): "past" | "current" | "next" | "upcoming" {
  const slotHour = parseInt(slot.split(":")[0]);
  if (currentHour > slotHour) return "past";
  if (currentHour === slotHour) return "current";
  if (currentHour === slotHour - 1) return "next";
  return "upcoming";
}

export function buildCapacityCards(
  orders: OrderRecord[],
  timeSlots: string[],
  orderDateStart: string,
  currentHour: number
) {
  return timeSlots.map((slot) => {
    const list = orders.filter(
      (order) =>
        order.date === orderDateStart &&
        order.time === slot &&
        order.boarding !== "NO_SHOW" &&
        order.boarding !== "CANCELLED"
    );

    return {
      slot,
      pax: countPax(list),
      join: countJoin(list),
      state: getSlotState(slot, currentHour)
    };
  });
}

export function buildTransportOrders(
  orders: OrderRecord[],
  transportDate: string,
  transportTime: string,
  assignSortField: string,
  assignSortDir: SortDir
) {
  const baseTransportOrders = orders.filter(
    (order) =>
      order.date === transportDate && (transportTime === "ALL" || order.time === transportTime)
  );

  return [...baseTransportOrders].sort((a, b) => {
    let cmp = 0;
    switch (assignSortField) {
      case "time": cmp = a.time.localeCompare(b.time); break;
      case "hotel": cmp = a.hotel.localeCompare(b.hotel); break;
      case "pax": cmp = (a.join + a.visitor) - (b.join + b.visitor); break;
      default: cmp = a.time.localeCompare(b.time);
    }
    return assignSortDir === "asc" ? cmp : -cmp;
  });
}

export function buildDayOrders(orders: OrderRecord[], transportDate: string) {
  return orders.filter((order) => order.date === transportDate);
}

export function buildDriversInDay(dayOrders: OrderRecord[]) {
  return [...new Set(dayOrders.filter((order) => order.driver).map((order) => order.driver))];
}

export function buildRecheckOrders(
  dayOrders: OrderRecord[],
  recheckDriverFilter: string,
  recheckStatusFilter: string,
  recheckSortField: string,
  recheckSortDir: SortDir
) {
  const baseRecheckOrders = dayOrders.filter(
    (order) =>
      (recheckDriverFilter === "ALL" || order.driver === recheckDriverFilter) &&
      (recheckStatusFilter === "ALL" || order.boarding === recheckStatusFilter)
  );

  return [...baseRecheckOrders].sort((a, b) => {
    let cmp = 0;
    switch (recheckSortField) {
      case "time": cmp = a.time.localeCompare(b.time); break;
      case "hotel": cmp = a.hotel.localeCompare(b.hotel); break;
      case "status": cmp = a.boarding.localeCompare(b.boarding); break;
      default: cmp = a.time.localeCompare(b.time);
    }
    return recheckSortDir === "asc" ? cmp : -cmp;
  });
}

export function buildPacketsInDay(orders: OrderRecord[], staffDate: string) {
  return [...new Set(orders.filter((order) => order.date === staffDate).map((order) => order.packet))];
}

export function buildStaffingOrders(
  orders: OrderRecord[],
  staffDate: string,
  staffTime: string,
  staffPacket: string
) {
  return orders.filter((order) => {
    if (order.date !== staffDate) return false;
    if (staffTime !== "ALL" && order.time !== staffTime) return false;
    if (staffPacket !== "ALL" && order.packet !== staffPacket) return false;
    return true;
  });
}

export function buildBoardOrders(orders: OrderRecord[], boardDate: string) {
  return orders.filter((order) => order.date === boardDate);
}

export function buildSelectedDriverOrders(
  orders: OrderRecord[],
  transportDate: string,
  selectedDriver: string,
  selectedSheetSlot: string
) {
  return orders.filter(
    (order) => order.date === transportDate && order.driver === selectedDriver && order.time === selectedSheetSlot
  );
}

export function buildPivotMap(
  orders: OrderRecord[],
  pivotGroupBy: PivotGroupBy
) {
  return orders
    .filter((order) => order.boarding !== "NO_SHOW" && order.boarding !== "CANCELLED")
    .reduce<Record<string, { bookings: number; pax: number; join: number }>>((map, order) => {
      const key = pivotGroupBy === "agent" ? order.agent : order.packet;
      if (!map[key]) {
        map[key] = { bookings: 0, pax: 0, join: 0 };
      }
      map[key].bookings += 1;
      map[key].pax += order.join + order.visitor;
      map[key].join += order.join;
      return map;
    }, {});
}

export function buildSelectedStaffWork(
  orders: OrderRecord[],
  selectedStaffName: string
) {
  return orders.filter(
    (order) => order.assignedStaff.includes(selectedStaffName) && order.boarding === "BOARDED"
  );
}

export function countOrdersByStatus(orders: OrderRecord[], status: BookingStatus) {
  return orders.filter((order) => order.boarding === status).length;
}

export function buildAssistantDriverLoads(
  orders: OrderRecord[],
  employees: EmployeeRecord[],
  assistantFocusDate: string
) {
  return employees
    .filter((employee) => employee.role === "Driver")
    .map((employee) => {
      const relatedOrders = orders.filter(
        (order) => order.date === assistantFocusDate && order.driver === employee.name
      );

      return {
        driver: employee.name,
        trips: relatedOrders.length,
        pax: relatedOrders.reduce((sum, order) => sum + order.join + order.visitor, 0)
      };
    })
    .filter((driver) => driver.trips > 0)
    .sort((left, right) => right.trips - left.trips)
    .slice(0, 5);
}

export function buildAssistantPriorityBookings(
  orders: OrderRecord[],
  assistantFocusDate: string,
  mainView: string,
  formatStatus: (status: string) => string
) {
  return orders
    .filter((order) => order.date === assistantFocusDate)
    .filter(
      (order) =>
        order.boarding === "NO_SHOW" ||
        order.boarding === "WAITING" ||
        (mainView === "transport" && !order.driver)
    )
    .slice(0, 6)
    .map((order) => ({
      booking: order.booking,
      customer: order.name,
      hotel: order.hotel,
      slot: order.time,
      status: formatStatus(order.boarding),
      note: order.adminNote
    }));
}
