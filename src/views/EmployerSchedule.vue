<template>
  <section class="tab-content">
    <div class="schedule-toolbar">
      <div class="week-nav">
        <button class="icon-button" @click="prevWeek">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>
        <strong class="date-range-display">{{ weekDisplayRange }}</strong>
        <button class="icon-button" @click="nextWeek">
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
      </div>
      <div class="actions">
        <button class="ghost-button" @click="templateDialog = true">
          <v-icon size="18">mdi-content-copy</v-icon> Templates
        </button>
        <button class="primary-button" @click="newShiftDialog = true">
          <v-icon size="18">mdi-plus</v-icon> New Shift
        </button>
      </div>
    </div>

    <div class="calendar-scroll-area">
      <div class="calendar-container">
        <div class="calendar-grid">
          <div class="time-gutter-header"></div>
          <div v-for="day in weekDays" :key="'header-' + day.fullDate" class="day-header">
            <span class="day-label">{{ day.label }}</span>
            <span class="day-number">{{ day.date.split("/")[1] }}</span>
          </div>

          <template v-for="hour in timeSlots">
            <div :key="'label-' + hour" class="time-slot-label">
              {{ formatHour(hour) }}
            </div>
            <div v-for="day in weekDays" :key="hour + '-' + day.fullDate" class="grid-cell"></div>
          </template>
        </div>

        <div class="shift-overlay-layer">
          <div class="time-gutter-spacer"></div>
          <div v-for="day in weekDays" :key="'col-' + day.fullDate" class="shift-column">
            <div v-for="shift in getShiftsForDay(day.fullDate)" :key="shift.shiftId" class="shift-card"
              :style="getShiftStyle(shift)" @click="viewShift(shift)">
              <div class="shift-inner">
                <strong>{{ getEmployeeName(shift.EmployeeID) }}</strong>
                <div class="shift-meta">{{ shift.position }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="newShiftDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>Create New Shift</h2>
          <button class="icon-inline" @click="newShiftDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <div class="modal-body">
          <div class="form-group">
            <label>Employee</label>
            <select v-model="currentShift.EmployeeID" class="custom-select">
              <option disabled value="">Select staff member</option>
              <option v-for="emp in employees" :key="emp.id || emp.EmployeeID" :value="emp.id || emp.EmployeeID">
                {{ emp.fName || emp.firstName }} {{ emp.lName || emp.lastName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Position / Role</label>
            <input v-model="currentShift.position" type="text" class="custom-input" />
          </div>
          <div class="form-group">
            <label>Shift Date</label>
            <input v-model="currentShift.startDate" type="date" class="custom-input" />
          </div>
          <div class="two-col">
            <div class="form-group">
              <label>Start Time</label>
              <input v-model="currentShift.startTime" type="time" class="custom-input" />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input v-model="currentShift.endTime" type="time" class="custom-input" />
            </div>
          </div>
        </div>
        <footer>
          <button class="ghost-button" @click="newShiftDialog = false">Cancel</button>
          <button class="primary-button" @click="saveShift">Save Shift</button>
        </footer>
      </section>
    </div>

    <ShiftDetails :show="detailDialog" :shift="selectedShift" :employeeName="getEmployeeName(selectedShift.EmployeeID)"
      @close="detailDialog = false" @delete="deleteShift" />

    <EmployerTemplate :show="templateDialog" :currentWeekShifts="shifts" :currentMonday="currentMonday"
      @close="templateDialog = false" @apply="handleApplyTemplate" />
  </section>
</template>

<script>
// ... Imports stay the same ...
import EmployeeServices from "@/services/employeeServices";
import ShiftServices from "@/services/shiftServices";
import TemplateServices from "@/services/templateServices";
import ShiftDetails from "./ShiftDetails.vue";
import EmployerTemplate from "./EmployerTemplate.vue";


export default {
  name: "EmployerSchedule",
  components: {
    ShiftDetails,
    EmployerTemplate,
  },
  data() {
    return {
      newShiftDialog: false,
      detailDialog: false,
      templateDialog: false,
      employees: [],
      shifts: [],
      selectedShift: {},
      reminderInterval: null,
      // Start time is 8 (8 AM), End time is 22 (10 PM)
      timeSlots: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      currentMonday: new Date("2026-01-26T00:00:00"),
      currentShift: {
        EmployeeID: "",
        position: "",
        startDate: "",
        startTime: "",
        endTime: "",
      },
    };
  },
  computed: {
    weekDays() {
      const days = [];
      const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
      for (let i = 0; i < 7; i++) {
        const d = new Date(this.currentMonday);
        d.setDate(d.getDate() + i);
        const month = d.getMonth() + 1;
        const dateNum = d.getDate();
        const year = d.getFullYear();
        const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
        days.push({ label: labels[i], date: `${month}/${dateNum}`, fullDate: fullDate });
      }
      return days;
    },
    weekDisplayRange() {
      const d = new Date(this.currentMonday);
      const monthName = d.toLocaleString('default', { month: 'short' });
      return `Week of ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
    }
  },
async mounted() {
  await this.requestNotificationPermission();
  await this.loadData();

  this.checkShiftReminders();

  this.reminderInterval = setInterval(() => {
    this.checkShiftReminders();
  }, 60000);
},

beforeDestroy() {
  if (this.reminderInterval) {
    clearInterval(this.reminderInterval);
  }
},

methods: {
  async loadData() {
    try {
      const [empRes, shiftRes] = await Promise.all([
        EmployeeServices.getAllEmployees(),
        ShiftServices.getAllShifts(),
      ]);
      this.employees = empRes.data || [];
      this.shifts = shiftRes.data || [];
    } catch (err) { console.error(err); }
  },

  async requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  },

  checkShiftReminders() {
    if (!this.shifts || !this.shifts.length) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();

    this.shifts.forEach((shift) => {
      if (!shift.startTime) return;

      const shiftStart = new Date(shift.startTime);
      const diffMinutes = Math.floor((shiftStart - now) / 1000 / 60);
      const key = `reminder_${shift.shiftId}`;

      if (
        diffMinutes <= 30 &&
        diffMinutes >= 0 &&
        !localStorage.getItem(key)
      ) {
        new Notification("Shift Reminder", {
          body: `${this.getEmployeeName(shift.EmployeeID)} starts at ${this.formatTime(shift.startTime)}`
        });

        localStorage.setItem(key, "sent");
      }
    });
  },

  getShiftsForDay(date) {
    if (!this.shifts) return [];
    return this.shifts.filter(s => s.startDate && s.startDate.split('T')[0] === date);
  },

  getShiftStyle(shift) {
    const getDecimalHour = (timeStr) => {
      // If timeStr is null, undefined, or not a string, return 0 to prevent a crash
      if (!timeStr || typeof timeStr !== 'string') return 0;

      // Check if it's an ISO string or just HH:mm
      const time = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
      const [hours, minutes] = time.split(':').map(Number);
      return hours + (minutes / 60);
    };

    const start = getDecimalHour(shift.startTime);
    const end = getDecimalHour(shift.endTime);
    const rowHeight = 80; // Must match .grid-cell height in CSS

    return {
      top: `${(start - 8) * rowHeight}px`,
      height: `${(end - start) * rowHeight}px`,
    };
  },

  getEmployeeName(id) {
    if (!id) return "Unassigned";
    const emp = this.employees.find((e) => String(e.id || e.EmployeeID) === String(id));
    return emp ? `${emp.fName || emp.firstName} ${emp.lName || emp.lastName}` : "Unassigned";
  },

  viewShift(shift) {
    this.selectedShift = shift;
    this.detailDialog = true;
  },

  async saveShift() {
    try {
      const payload = { ...this.currentShift, startTime: `${this.currentShift.startDate}T${this.currentShift.startTime}:00`, endTime: `${this.currentShift.startDate}T${this.currentShift.endTime}:00` };
      await ShiftServices.createShift(payload);
      this.newShiftDialog = false;
      await this.loadData();
    } catch (err) { console.error(err); }
  },

  async deleteShift(id) {
    if (confirm("Delete this shift?")) {
      try {
        await ShiftServices.deleteShift(id);
        this.detailDialog = false;
        await this.loadData();
      } catch (err) { console.error(err); }
    }
  },

  formatHour(h) { return `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`; },
  formatTime(t) {
    if (!t) return "";
    const p = t.includes("T") ? t.split("T")[1].substring(0, 5) : t.substring(0, 5);
    return p;
  },
  nextWeek() { this.currentMonday = new Date(this.currentMonday.setDate(this.currentMonday.getDate() + 7)); },
  prevWeek() { this.currentMonday = new Date(this.currentMonday.setDate(this.currentMonday.getDate() - 7)); },

  async handleApplyTemplate(template) {
    if (!confirm(`Apply "${template.name}" to this week? This will add ${template.shifts.length} shifts.`)) return;

    try {
      // 1. Get the Monday of the week currently being viewed
      const startOfWeek = new Date(this.currentMonday);

      // 2. Map template shifts to REAL shifts
      const newShifts = template.shifts.map(ts => {
        const shiftDate = new Date(startOfWeek);
        shiftDate.setDate(shiftDate.getDate() + ts.dayOfWeek);
        const fullStart = `${shiftDate.toISOString().split('T')[0]}T${ts.startTime}`;

        return {
          EmployeeID: ts.EmployeeID,
          position: ts.position,
          startDate: shiftDate.toISOString().split('T')[0], // YYYY-MM-DD
          startTime: fullStart,
          endTime: `${shiftDate.toISOString().split('T')[0]}T${ts.endTime}`,
        };
      });

      // 3. Send to your ACTUAL Shift Service (not TemplateService)
      // Check if your ShiftService has a bulkCreate, otherwise loop it:
      for (const shift of newShifts) {
        await ShiftServices.createShift(shift);
      }

      this.loadData(); // Refresh the calendar
      this.templateDialog = false; // Close modal
      alert("Template applied successfully!");

    } catch (err) {
      console.error("Error applying template:", err);
      alert("Failed to apply some shifts.");
    }
  },
}
};
</script>

<style scoped>
.calendar-container {
  position: relative;
  width: 100%;
}

.calendar-scroll-area {
  background: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  max-height: 75vh;
  overflow-y: auto;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  width: 100%;
}

.shift-overlay-layer {
  position: absolute;
  top: 48px;
  /* Matches the height of the .day-header */
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  pointer-events: none;
  /* Allows scrolling through the layer */
  z-index: 5;
}

.time-gutter-spacer {
  width: 80px;
}

.day-header {
  border-left: 1px solid #dadce0;
  border-bottom: 1px solid #dadce0;
  padding: 10px;
  text-align: center;
  background: white;
  position: sticky;
  top: 0;
  z-index: 20;
}

.grid-cell {
  border-left: 1px solid #dadce0;
  border-bottom: 1px solid #dadce0;
  height: 80px;
}

.time-slot-label {
  font-size: 11px;
  color: #70757a;
  text-align: right;
  padding-right: 12px;
  height: 80px;
  padding-top: 5px;
  border-bottom: 1px solid transparent;
  /* Keeps alignment with cells */
}

.shift-column {
  position: relative;
  height: 100%;
  width: 100%;
}

.shift-card {
  position: absolute;
  pointer-events: auto;
  /* Re-enables clicking on shifts */
  background: #1a73e8;
  color: white;
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
  width: 90%;
  left: 5%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.shift-card:hover {
  transform: scale(1.02);
  z-index: 50;
}

.shift-time-mini {
  font-size: 10px;
  opacity: 0.9;
  margin-top: 4px;
}

/* Other UI styles */
.schedule-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.primary-button {
  background: #1a73e8;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 400px;
  padding: 20px;
}

.custom-input,
.custom-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 5px;
}

.form-group {
  margin-bottom: 12px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.ghost-button {
  background: none;
  border: 1px solid #ccc;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>