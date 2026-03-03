<template>
  <section class="tab-content">
    <div class="schedule-toolbar">
      <div class="week-nav">
        <button class="icon-button" @click="goToPreviousWeek">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>
        <strong>Week of {{ weekLabel }}</strong>
        <button class="icon-button" @click="goToNextWeek">
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
      </div>
      <div class="actions">
        <button class="ghost-button" @click="templateDialog = true">
          <v-icon size="18">mdi-content-copy</v-icon>
          Templates
        </button>
        <button class="primary-button" @click="openNewShiftDialog">
          <v-icon size="18">mdi-plus</v-icon>
          New Shift
        </button>
      </div>
    </div>

    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th v-for="day in weekDays" :key="day.isoDate">
              {{ day.label }}<br />{{ day.shortDate }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee.id">
            <td class="employee-cell">{{ employee.name }}</td>
            <td v-for="day in weekDays" :key="`${employee.id}-${day.isoDate}`">
              <div class="shift-stack">
                <div
                  v-for="shift in getShiftsFor(employee.name, day.isoDate)"
                  :key="shift.shiftId"
                  class="shift-pill"
                  @click="openEditShiftDialog(shift)"
                >
                  <button
                    class="shift-delete"
                    title="Delete shift"
                    @click.stop="deleteShift(shift.shiftId)"
                  >
                    x
                  </button>
                  {{ shift.startTime }} - {{ shift.endTime }}
                  <br />
                  {{ shift.position || "Shift" }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="newShiftDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>{{ editingShiftId ? "Edit Shift" : "New Shift" }}</h2>
          <button class="icon-inline" @click="closeShiftDialog">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>Employee</label>
        <select v-model="newShift.employeeName">
          <option disabled value="">Select employee</option>
          <option
            v-for="employee in employees"
            :key="employee.id"
            :value="employee.name"
          >
            {{ employee.name }}
          </option>
        </select>
        <label>Position</label>
        <input
          v-model="newShift.position"
          type="text"
          placeholder="e.g., Server, Cook"
        />
        <label>Date</label>
        <input v-model="newShift.date" type="date" />
        <div class="two-col">
          <div>
            <label>Start Time</label>
            <input v-model="newShift.startTime" type="time" />
          </div>
          <div>
            <label>End Time</label>
            <input v-model="newShift.endTime" type="time" />
          </div>
        </div>
        <label>Task List (Optional)</label>
        <select v-model="newShift.taskListId">
          <option :value="null">Select task list (optional)</option>
          <option
            v-for="list in taskLists"
            :key="list.taskListId"
            :value="list.taskListId"
          >
            {{ list.name }}
          </option>
        </select>
        <footer>
          <button
            v-if="editingShiftId"
            class="ghost-button danger-button footer-left"
            @click="deleteEditingShift"
          >
            Delete Shift
          </button>
          <button class="ghost-button" @click="closeShiftDialog">Cancel</button>
          <button class="primary-button" @click="saveShift">
            {{ editingShiftId ? "Update Shift" : "Save Shift" }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="templateDialog" class="overlay">
      <section class="modal template-modal">
        <header>
          <h2>Schedule Templates</h2>
          <button class="icon-inline" @click="templateDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <p class="muted">
          Template UI is available. Persisted template APIs are not implemented
          yet.
        </p>
        <footer>
          <button class="ghost-button" @click="templateDialog = false">
            Close
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script>
import SchedulerServices from "@/services/schedulerServices";

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value) => {
  if (!value) {
    return null;
  }
  const str = String(value).slice(0, 10);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, monthIndex, day, 0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfWeekMonday = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default {
  name: "EmployerSchedule",
  data() {
    const monday = startOfWeekMonday(new Date());
    return {
      newShiftDialog: false,
      templateDialog: false,
      currentWeekStart: monday,
      employees: [],
      taskLists: [],
      shifts: [],
      editingShiftId: null,
      newShift: {
        employeeName: "",
        position: "",
        date: toIsoDate(monday),
        startTime: "09:00",
        endTime: "17:00",
        taskListId: null,
      },
    };
  },
  computed: {
    weekDays() {
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return labels.map((label, index) => {
        const date = new Date(this.currentWeekStart);
        date.setDate(this.currentWeekStart.getDate() + index);
        return {
          label,
          dayKey: dayKeys[date.getDay()],
          isoDate: toIsoDate(date),
          shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
        };
      });
    },
    weekLabel() {
      return new Date(this.currentWeekStart).toLocaleDateString();
    },
    shiftsForCurrentWeek() {
      const weekStart = new Date(this.currentWeekStart);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return this.shifts.filter((shift) => {
        const shiftDate = parseIsoDate(shift.date);
        return shiftDate && shiftDate >= weekStart && shiftDate < weekEnd;
      });
    },
  },
  created() {
    this.fetchEmployees();
    this.fetchTaskLists();
    this.fetchShifts();
  },
  methods: {
    mapEmployee(row) {
      return {
        id: row.EmployeeID,
        name: `${row.firstName} ${row.lastName}`.trim(),
      };
    },
    fetchEmployees() {
      SchedulerServices.getEmployees()
        .then((response) => {
          this.employees = (response.data || []).map(this.mapEmployee);
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    fetchTaskLists() {
      SchedulerServices.getTaskLists()
        .then((response) => {
          this.taskLists = response.data || [];
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    fetchShifts() {
      SchedulerServices.getShifts()
        .then((response) => {
          this.shifts = response.data || [];
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    getShiftsFor(employeeName, isoDate) {
      return this.shiftsForCurrentWeek
        .filter(
          (shift) =>
            shift.employeeName === employeeName &&
            String(shift.date).slice(0, 10) === isoDate
        )
        .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    },
    goToPreviousWeek() {
      const next = new Date(this.currentWeekStart);
      next.setDate(next.getDate() - 7);
      this.currentWeekStart = next;
    },
    goToNextWeek() {
      const next = new Date(this.currentWeekStart);
      next.setDate(next.getDate() + 7);
      this.currentWeekStart = next;
    },
    openNewShiftDialog() {
      this.editingShiftId = null;
      this.newShift = {
        employeeName: "",
        position: "",
        date: this.weekDays[0].isoDate,
        startTime: "09:00",
        endTime: "17:00",
        taskListId: null,
      };
      this.newShiftDialog = true;
    },
    openEditShiftDialog(shift) {
      this.editingShiftId = shift.shiftId;
      this.newShift = {
        employeeName: shift.employeeName || "",
        position: shift.position || "",
        date: String(shift.date).slice(0, 10),
        startTime: shift.startTime || "09:00",
        endTime: shift.endTime || "17:00",
        taskListId: shift.taskListId || null,
      };
      this.newShiftDialog = true;
    },
    closeShiftDialog() {
      this.newShiftDialog = false;
      this.editingShiftId = null;
    },
    deleteShift(shiftId) {
      if (!shiftId || !window.confirm("Delete this shift?")) {
        return;
      }
      SchedulerServices.deleteShift(shiftId)
        .then(() => {
          if (this.editingShiftId === shiftId) {
            this.closeShiftDialog();
          }
          this.fetchShifts();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    deleteEditingShift() {
      this.deleteShift(this.editingShiftId);
    },
    saveShift() {
      if (
        !this.newShift.employeeName ||
        !this.newShift.date ||
        !this.newShift.startTime ||
        !this.newShift.endTime
      ) {
        return;
      }

      const payload = {
        ...this.newShift,
        taskListId: this.newShift.taskListId || null,
      };
      const saveRequest = this.editingShiftId
        ? SchedulerServices.updateShift(this.editingShiftId, payload)
        : SchedulerServices.createShift(payload);

      saveRequest
        .then(() => {
          this.closeShiftDialog();
          this.fetchShifts();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
  },
};
</script>

<style scoped>
.tab-content {
  padding: 0 20px 24px;
}

h2 {
  margin: 0;
  font-size: 22px;
}

h3 {
  margin-bottom: 4px;
}

p {
  margin: 0;
}

.schedule-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.actions,
.week-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-button,
.icon-inline {
  border: 1px solid #d5dae7;
  background: #fff;
  border-radius: 10px;
  width: 38px;
  height: 38px;
  cursor: pointer;
}

.ghost-button,
.primary-button,
.disabled-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  border: 1px solid #d7dceb;
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-button {
  border-color: #080c28;
  background: #060828;
  color: #fff;
}

.schedule-table-wrap {
  border: 1px solid #d7dceb;
  border-radius: 14px;
  overflow-x: auto;
  background: #fff;
}

.schedule-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #dce1ec;
  padding: 12px;
  text-align: center;
  vertical-align: top;
}

.employee-cell {
  text-align: left;
  width: 180px;
}

.shift-pill {
  position: relative;
  border: 1px solid #adcaf9;
  background: #d8e8ff;
  border-radius: 8px;
  padding: 8px 30px 8px 8px;
  white-space: pre-line;
  text-align: left;
  color: #355ea5;
  font-weight: 600;
  min-height: 50px;
  cursor: pointer;
}

.shift-pill:hover {
  border-color: #7da7ea;
}

.shift-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shift-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 999px;
  background: #b2caef;
  color: #294f8f;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  line-height: 18px;
  text-align: center;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 27, 39, 0.48);
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  max-height: 94vh;
  overflow-y: auto;
}

.template-modal {
  max-width: 760px;
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal label {
  font-size: 20px;
  font-weight: 700;
  margin-top: 10px;
  margin-bottom: 6px;
  display: inline-block;
}

.modal input,
.modal select {
  width: 100%;
  border: none;
  background: #f1f2f7;
  border-radius: 12px;
  min-height: 52px;
  padding: 11px 16px;
  outline: none;
  margin-bottom: 6px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.footer-left {
  margin-right: auto;
}

.danger-button {
  border-color: #e2bfc2;
  background: #fff4f4;
  color: #9e2b33;
}

.muted {
  color: #617089;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .schedule-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
