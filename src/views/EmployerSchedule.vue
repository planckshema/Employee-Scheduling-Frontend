<template>
  <section class="tab-content">
    <div v-if="warningMessage" class="status-banner warning">
      <v-icon size="18">mdi-alert-outline</v-icon>
      <span>{{ warningMessage }}</span>
    </div>

    <div v-if="successMessage" class="status-banner success">
      <v-icon size="18">mdi-check-circle-outline</v-icon>
      <span>{{ successMessage }}</span>
    </div>

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
        <button class="ghost-button" @click="openTemplateDialog">
          <v-icon size="18">mdi-content-copy</v-icon>
          Templates
        </button>
        <button class="primary-button" @click="openNewShiftDialog()">
          <v-icon size="18">mdi-plus</v-icon>
          New Shift
        </button>
      </div>
    </div>

    <section class="schedule-summary">
      <article class="summary-card">
        <span>Shifts This Week</span>
        <strong>{{ shiftsForCurrentWeek.length }}</strong>
      </article>
      <article class="summary-card warning-card">
        <span>Unassigned Slots</span>
        <strong>{{ unassignedShiftCount }}</strong>
      </article>
      <article class="summary-card conflict-card">
        <span>Availability Flags</span>
        <strong>{{ availabilityConflictCount }}</strong>
      </article>
      <article class="summary-card">
        <span>Business Type</span>
        <strong>{{ businessLabel }}</strong>
      </article>
    </section>

    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="time-header">Time</th>
            <th v-for="day in weekDays" :key="day.isoDate">
              {{ day.label }}<br />{{ day.shortDate }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slot in timeSlots" :key="slot.key">
            <td class="time-cell">
              <strong>{{ slot.label }}</strong>
              <button class="mini-add-button" @click="openNewShiftDialog(null, slot)">
                <v-icon size="16">mdi-plus</v-icon>
              </button>
            </td>

            <td v-for="day in weekDays" :key="`${slot.key}-${day.isoDate}`" class="slot-cell">
              <div class="cell-actions">
                <button class="cell-add-button" @click="openNewShiftDialog(day.isoDate, slot)">
                  <v-icon size="14">mdi-plus</v-icon>
                  Add
                </button>
              </div>

              <div v-if="getShiftsForSlot(day.isoDate, slot).length" class="shift-stack">
                <article
                  v-for="shift in getShiftsForSlot(day.isoDate, slot)"
                  :key="shift.shiftId"
                  :class="[
                    'shift-card',
                    { unassigned: !shift.employeeName, flagged: hasAvailabilityConflict(shift) },
                  ]"
                  @click="openEditShiftDialog(shift)"
                >
                  <button
                    class="shift-delete"
                    title="Delete shift"
                    @click.stop="deleteShift(shift.shiftId)"
                  >
                    <v-icon size="14">mdi-close</v-icon>
                  </button>

                  <div class="shift-header">
                    <strong>{{ shift.position || "Shift" }}</strong>
                    <span>{{ shift.startTime }} - {{ shift.endTime }}</span>
                  </div>

                  <p :class="['shift-assignee', { missing: !shift.employeeName }]">
                    {{ shift.employeeName || "Unassigned employee" }}
                  </p>

                  <p v-if="hasAvailabilityConflict(shift)" class="shift-flag">
                    Outside employee availability
                  </p>
                </article>
              </div>

              <div v-else class="empty-slot">
                <span>No shift planned</span>
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
        <select v-model="newShift.employeeId">
          <option value="">Unassigned for now</option>
          <option v-for="employee in employees" :key="employee.id" :value="String(employee.id)">
            {{ employee.name }}
          </option>
        </select>
        <p v-if="draftAvailabilityWarning" class="helper warning-text">
          {{ draftAvailabilityWarning }}
        </p>

        <label>Position</label>
        <select v-model="newShift.position">
          <option disabled value="">Select position</option>
          <option v-for="option in positionOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <p class="helper">Options are suggested from the employer business type.</p>

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
          <option v-for="list in taskLists" :key="list.taskListId" :value="list.taskListId">
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

        <div class="template-actions">
          <button class="primary-button" @click="generateSuggestedWeek">
            <v-icon size="18">mdi-auto-fix</v-icon>
            Generate Suggested Week
          </button>
          <button class="ghost-button" @click="saveCurrentWeekAsTemplate">
            <v-icon size="18">mdi-content-save-outline</v-icon>
            Save Current Week
          </button>
        </div>

        <p class="muted modal-copy">
          Generated suggestions use employee availability, your business hours, and your business type to prefill a workable draft.
        </p>

        <div v-if="templates.length" class="template-list">
          <article v-for="template in templates" :key="template.id" class="template-card">
            <div>
              <strong>{{ template.name }}</strong>
              <p>{{ template.description || "Saved schedule template" }}</p>
            </div>
            <div class="template-card-actions">
              <button class="primary-button small-button" @click="applyTemplate(template)">
                Apply
              </button>
              <button class="ghost-button small-button" @click="deleteTemplate(template.id)">
                Delete
              </button>
            </div>
          </article>
        </div>

        <p v-else class="muted">No templates saved yet.</p>

        <footer>
          <button class="ghost-button" @click="templateDialog = false">Close</button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script>
import EmployerServices from "@/services/employerServices";
import SchedulerServices from "@/services/schedulerServices";
import TemplateServices from "@/services/templateServices";

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const POSITION_LIBRARY = [
  {
    keywords: ["gym", "fitness", "recreation", "rec center"],
    positions: ["Front Desk", "Fitness Attendant", "Equipment Staff", "Lifeguard", "Intramural Assistant"],
  },
  {
    keywords: ["library", "study", "learning"],
    positions: ["Library Assistant", "Circulation Desk", "Stacks Assistant", "Tech Help Desk", "Research Support"],
  },
  {
    keywords: ["cafe", "coffee", "restaurant", "dining", "food"],
    positions: ["Cashier", "Server", "Cook", "Barista", "Prep Staff"],
  },
  {
    keywords: ["office", "administration", "front desk", "student center"],
    positions: ["Front Desk", "Office Assistant", "Reception", "Student Services Assistant", "Administrative Aide"],
  },
  {
    keywords: ["lab", "technology", "it", "computer"],
    positions: ["Lab Assistant", "IT Support", "Tech Monitor", "Equipment Checkout", "Help Desk"],
  },
];

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

const toMinutes = (time) => {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const toTimeString = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatSlotLabel = (startTime, endTime) => `${startTime} - ${endTime}`;

const buildDefaultSlots = () => {
  const slots = [];
  for (let hour = 7; hour < 22; hour += 1) {
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
    slots.push({
      key: `${startTime}-${endTime}`,
      startTime,
      endTime,
      label: formatSlotLabel(startTime, endTime),
    });
  }
  return slots;
};

const normalizeAvailability = (availability) =>
  Array.isArray(availability)
    ? availability.map((row) => ({
        dayKey: row.dayKey,
        available: Boolean(row.available),
        startTime: row.startTime || "",
        endTime: row.endTime || "",
      }))
    : [];

const extractPositionOptions = (niche) => {
  const normalized = String(niche || "").toLowerCase();
  const matched = POSITION_LIBRARY.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return matched?.positions || ["General Staff", "Front Desk", "Support Staff", "Shift Lead"];
};

const parseOperatingHours = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

  const to24HourMinutes = (hourValue, minuteValue, meridiem) => {
    let hour = Number(hourValue);
    const minute = Number(minuteValue || "0");
    const mer = String(meridiem || "").toLowerCase();

    if (mer === "pm" && hour !== 12) {
      hour += 12;
    }
    if (mer === "am" && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  };

  const lower = raw.toLowerCase();
  const activeDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].filter((dayKey) =>
    lower.includes(dayKey),
  );

  return {
    startMinutes: match ? to24HourMinutes(match[1], match[2], match[3]) : 9 * 60,
    endMinutes: match ? to24HourMinutes(match[4], match[5], match[6]) : 17 * 60,
    activeDayKeys: activeDayKeys.length ? activeDayKeys : ["mon", "tue", "wed", "thu", "fri"],
  };
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
      employeeAvailabilityIndex: {},
      employerProfile: null,
      taskLists: [],
      templates: [],
      shifts: [],
      editingShiftId: null,
      warningMessage: "",
      successMessage: "",
      newShift: {
        employeeId: "",
        position: "",
        date: toIsoDate(monday),
        startTime: "09:00",
        endTime: "17:00",
        taskListId: null,
      },
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
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
    timeSlots() {
      const shiftSlots = this.shiftsForCurrentWeek.map((shift) => ({
        key: `${shift.startTime}-${shift.endTime}`,
        startTime: shift.startTime,
        endTime: shift.endTime,
        label: formatSlotLabel(shift.startTime, shift.endTime),
      }));

      return Array.from(
        new Map([...buildDefaultSlots(), ...shiftSlots].map((slot) => [slot.key, slot])).values(),
      ).sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    },
    unassignedShiftCount() {
      return this.shiftsForCurrentWeek.filter((shift) => !shift.employeeName).length;
    },
    availabilityConflictCount() {
      return this.shiftsForCurrentWeek.filter((shift) => this.hasAvailabilityConflict(shift)).length;
    },
    businessLabel() {
      return this.employerProfile?.niche || "General";
    },
    positionOptions() {
      return extractPositionOptions(this.employerProfile?.niche);
    },
    draftAvailabilityWarning() {
      const employeeId = this.parseSelectedEmployeeId(this.newShift.employeeId);
      if (!employeeId || !this.newShift.date || !this.newShift.startTime || !this.newShift.endTime) {
        return "";
      }

      return this.getAvailabilityConflictText({
        EmployeeID: employeeId,
        date: this.newShift.date,
        startTime: this.newShift.startTime,
        endTime: this.newShift.endTime,
      });
    },
  },
  created() {
    this.bootstrapPage();
  },
  methods: {
    async bootstrapPage() {
      await Promise.all([
        this.fetchEmployees(),
        this.fetchEmployeeAvailabilityIndex(),
        this.fetchEmployerProfile(),
        this.fetchTaskLists(),
        this.fetchShifts(),
      ]);
    },
    mapEmployee(row) {
      return {
        id: row.EmployeeID,
        name: `${row.firstName} ${row.lastName}`.trim(),
        email: row.email,
      };
    },
    parseSelectedEmployeeId(id) {
      if (id === null || id === undefined || id === "") {
        return null;
      }
      const parsed = Number(id);
      return Number.isNaN(parsed) ? null : parsed;
    },
    findEmployeeById(id) {
      const normalized = this.parseSelectedEmployeeId(id);
      return this.employees.find((employee) => employee.id === normalized) || null;
    },
    async fetchEmployees() {
      try {
        const response = await SchedulerServices.getEmployees();
        this.employees = (response.data || []).map(this.mapEmployee);
      } catch (error) {
        console.log("error", error);
      }
    },
    async fetchEmployeeAvailabilityIndex() {
      try {
        const response = await SchedulerServices.getEmployeeAvailabilityIndex();
        this.employeeAvailabilityIndex = Object.fromEntries(
          (response.data || []).map((row) => [row.EmployeeID, normalizeAvailability(row.availability)]),
        );
      } catch (error) {
        console.log("error", error);
      }
    },
    async fetchEmployerProfile() {
      if (!this.currentUser?.userId) {
        return;
      }

      try {
        const response = await EmployerServices.getEmployerProfile(this.currentUser.userId);
        this.employerProfile = response.data || null;
      } catch (error) {
        console.log("error", error);
      }
    },
    async fetchTaskLists() {
      try {
        const response = await SchedulerServices.getTaskLists();
        this.taskLists = response.data || [];
      } catch (error) {
        console.log("error", error);
      }
    },
    async fetchShifts() {
      try {
        const response = await SchedulerServices.getShifts();
        this.shifts = response.data || [];
      } catch (error) {
        console.log("error", error);
      }
    },
    async openTemplateDialog() {
      this.templateDialog = true;
      await this.loadTemplates();
    },
    async loadTemplates() {
      try {
        const response = await TemplateServices.getAllTemplates();
        this.templates = response.data || [];
      } catch (error) {
        console.log("error", error);
      }
    },
    getShiftsForSlot(isoDate, slot) {
      return this.shiftsForCurrentWeek
        .filter(
          (shift) =>
            String(shift.date).slice(0, 10) === isoDate &&
            shift.startTime === slot.startTime &&
            shift.endTime === slot.endTime,
        )
        .sort((a, b) => String(a.position || "").localeCompare(String(b.position || "")));
    },
    goToPreviousWeek() {
      const next = new Date(this.currentWeekStart);
      next.setDate(next.getDate() - 7);
      this.currentWeekStart = next;
      this.warningMessage = "";
      this.successMessage = "";
    },
    goToNextWeek() {
      const next = new Date(this.currentWeekStart);
      next.setDate(next.getDate() + 7);
      this.currentWeekStart = next;
      this.warningMessage = "";
      this.successMessage = "";
    },
    openNewShiftDialog(isoDate = null, slot = null) {
      this.editingShiftId = null;
      this.newShift = {
        employeeId: "",
        position: this.positionOptions[0] || "",
        date: isoDate || this.weekDays[0]?.isoDate || toIsoDate(this.currentWeekStart),
        startTime: slot?.startTime || "09:00",
        endTime: slot?.endTime || "17:00",
        taskListId: null,
      };
      this.newShiftDialog = true;
    },
    openEditShiftDialog(shift) {
      this.editingShiftId = shift.shiftId;
      this.newShift = {
        employeeId: shift.EmployeeID ? String(shift.EmployeeID) : "",
        position: shift.position || this.positionOptions[0] || "",
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
    getEmployeeAvailability(employeeId) {
      return this.employeeAvailabilityIndex[this.parseSelectedEmployeeId(employeeId)] || [];
    },
    getAvailabilityEntry(employeeId, isoDate) {
      const shiftDate = parseIsoDate(isoDate);
      if (!shiftDate) {
        return null;
      }

      const dayKey = dayKeys[shiftDate.getDay()];
      return this.getEmployeeAvailability(employeeId).find((entry) => entry.dayKey === dayKey) || null;
    },
    getAvailabilityConflictText(shift) {
      const employeeId = this.parseSelectedEmployeeId(shift.EmployeeID);
      if (!employeeId) {
        return "";
      }

      const availability = this.getAvailabilityEntry(employeeId, shift.date);
      if (!availability) {
        return "";
      }

      if (!availability.available) {
        return "This employee is marked unavailable for that day.";
      }

      const shiftStart = toMinutes(shift.startTime);
      const shiftEnd = toMinutes(shift.endTime);
      const availabilityStart = toMinutes(availability.startTime);
      const availabilityEnd = toMinutes(availability.endTime);

      if (shiftStart < availabilityStart || shiftEnd > availabilityEnd) {
        return `This shift is outside the employee's available hours (${availability.startTime} - ${availability.endTime}).`;
      }

      return "";
    },
    hasAvailabilityConflict(shift) {
      return Boolean(this.getAvailabilityConflictText(shift));
    },
    async deleteShift(shiftId) {
      if (!shiftId || !window.confirm("Delete this shift?")) {
        return;
      }

      try {
        await SchedulerServices.deleteShift(shiftId);
        if (this.editingShiftId === shiftId) {
          this.closeShiftDialog();
        }
        await this.fetchShifts();
      } catch (error) {
        console.log("error", error);
      }
    },
    deleteEditingShift() {
      this.deleteShift(this.editingShiftId);
    },
    async saveShift() {
      if (!this.newShift.date || !this.newShift.startTime || !this.newShift.endTime || !this.newShift.position) {
        return;
      }

      const selectedEmployee = this.findEmployeeById(this.newShift.employeeId);
      const payload = {
        date: this.newShift.date,
        startTime: this.newShift.startTime,
        endTime: this.newShift.endTime,
        position: this.newShift.position,
        taskListId: this.newShift.taskListId || null,
        EmployeeID: selectedEmployee?.id ?? null,
        employeeName: selectedEmployee?.name || "",
      };

      const availabilityConflict = this.getAvailabilityConflictText(payload);
      if (availabilityConflict) {
        const shouldContinue = window.confirm(`${availabilityConflict} Do you still want to save this shift?`);
        this.warningMessage = availabilityConflict;
        if (!shouldContinue) {
          return;
        }
      } else {
        this.warningMessage = "";
      }

      try {
        const saveRequest = this.editingShiftId
          ? SchedulerServices.updateShift(this.editingShiftId, payload)
          : SchedulerServices.createShift(payload);

        await saveRequest;
        this.successMessage = selectedEmployee
          ? `${selectedEmployee.name} was scheduled successfully.`
          : "Unassigned shift saved successfully.";
        this.closeShiftDialog();
        await this.fetchShifts();
      } catch (error) {
        console.log("error", error);
      }
    },
    buildShiftPayloadForWeek(blueprints) {
      const employeeMap = new Map(this.employees.map((employee) => [employee.id, employee]));
      return blueprints.map((shift) => {
        const employee = shift.EmployeeID ? employeeMap.get(shift.EmployeeID) : null;
        return {
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          position: shift.position,
          taskListId: shift.taskListId || null,
          EmployeeID: employee?.id ?? null,
          employeeName: employee?.name || "",
        };
      });
    },
    async replaceCurrentWeekWithShifts(blueprints, successText) {
      const existingIds = this.shiftsForCurrentWeek.map((shift) => shift.shiftId);

      try {
        await Promise.all(existingIds.map((shiftId) => SchedulerServices.deleteShift(shiftId)));
        await Promise.all(
          this.buildShiftPayloadForWeek(blueprints).map((payload) => SchedulerServices.createShift(payload)),
        );
        await this.fetchShifts();
        this.successMessage = successText;
        this.warningMessage = "";
      } catch (error) {
        console.log("error", error);
      }
    },
    async saveCurrentWeekAsTemplate() {
      const name = window.prompt("Enter a name for this template:");
      if (!name) {
        return;
      }

      const shifts = this.shiftsForCurrentWeek.map((shift) => {
        const shiftDate = parseIsoDate(shift.date);
        return {
          EmployeeID: shift.EmployeeID || null,
          position: shift.position || this.positionOptions[0] || "General Staff",
          startTime: shift.startTime,
          endTime: shift.endTime,
          dayOfWeek: shiftDate ? shiftDate.getDay() : 1,
        };
      });

      if (!shifts.length) {
        this.warningMessage = "There are no shifts in the current week to save as a template.";
        return;
      }

      try {
        await TemplateServices.createTemplate({
          name,
          description: `Saved from week of ${this.weekLabel}`,
          shifts,
        });
        this.successMessage = "Template saved successfully.";
        await this.loadTemplates();
      } catch (error) {
        console.log("error", error);
      }
    },
    async applyTemplate(template) {
      const shouldReplace = window.confirm(
        "Apply this template to the current week and replace the existing shifts for this week?",
      );
      if (!shouldReplace) {
        return;
      }

      const shifts = (template.shifts || []).map((shift) => {
        const offset = shift.dayOfWeek === 0 ? 6 : shift.dayOfWeek - 1;
        const date = new Date(this.currentWeekStart);
        date.setDate(this.currentWeekStart.getDate() + offset);
        return {
          EmployeeID: shift.EmployeeID || null,
          position: shift.position || this.positionOptions[0] || "General Staff",
          startTime: String(shift.startTime).slice(0, 5),
          endTime: String(shift.endTime).slice(0, 5),
          date: toIsoDate(date),
        };
      });

      await this.replaceCurrentWeekWithShifts(shifts, `Applied template "${template.name}".`);
      this.templateDialog = false;
    },
    buildSuggestedWeekBlueprints() {
      const businessWindow = parseOperatingHours(this.employerProfile?.operatingHours);
      const positionOptions = this.positionOptions;
      const blueprint = [];

      this.employees.forEach((employee, employeeIndex) => {
        const availability = this.getEmployeeAvailability(employee.id);
        let shiftsAssigned = 0;

        this.weekDays.forEach((day, dayIndex) => {
          if (shiftsAssigned >= 4 || !businessWindow.activeDayKeys.includes(day.dayKey)) {
            return;
          }

          const entry = availability.find((item) => item.dayKey === day.dayKey);
          if (!entry || !entry.available || !entry.startTime || !entry.endTime) {
            return;
          }

          const overlapStart = Math.max(toMinutes(entry.startTime), businessWindow.startMinutes);
          const overlapEnd = Math.min(toMinutes(entry.endTime), businessWindow.endMinutes);
          if (overlapEnd - overlapStart < 180) {
            return;
          }

          const shiftLength = Math.min(240, overlapEnd - overlapStart);
          const stagger = (employeeIndex % 2) * 60;
          const startMinutes = Math.min(overlapStart + stagger, overlapEnd - shiftLength);
          const endMinutes = startMinutes + shiftLength;

          blueprint.push({
            EmployeeID: employee.id,
            position: positionOptions[(employeeIndex + dayIndex) % positionOptions.length],
            startTime: toTimeString(startMinutes),
            endTime: toTimeString(endMinutes),
            date: day.isoDate,
          });
          shiftsAssigned += 1;
        });
      });

      return blueprint.sort(
        (a, b) =>
          String(a.date).localeCompare(String(b.date)) ||
          String(a.startTime).localeCompare(String(b.startTime)),
      );
    },
    async generateSuggestedWeek() {
      const generatedShifts = this.buildSuggestedWeekBlueprints();
      if (!generatedShifts.length) {
        this.warningMessage =
          "No suggested shifts could be generated from the current employee availability and business hours.";
        return;
      }

      const shouldReplace = window.confirm(
        "Generate a suggested week and replace the current week's shifts? You can still edit the result afterward.",
      );
      if (!shouldReplace) {
        return;
      }

      await this.replaceCurrentWeekWithShifts(
        generatedShifts,
        "Suggested weekly schedule generated. Review and tweak it as needed.",
      );
      this.templateDialog = false;
    },
    async deleteTemplate(id) {
      if (!window.confirm("Delete this template?")) {
        return;
      }

      try {
        await TemplateServices.deleteTemplate(id);
        await this.loadTemplates();
      } catch (error) {
        console.log("error", error);
      }
    },
  },
};
</script>

<style scoped>
.tab-content {
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 28px 32px;
}

h2,
h3,
p {
  margin: 0;
}

.status-banner {
  border: 1px solid #dce1ec;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
  background: #fff;
}

.status-banner.warning {
  background: #fff8eb;
  color: #9b6300;
  border-color: #efd196;
}

.status-banner.success {
  background: #effcf4;
  color: #195f40;
}

.schedule-toolbar,
.schedule-summary,
.actions,
.week-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.schedule-toolbar {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.schedule-summary {
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.summary-card {
  min-width: 180px;
  border: 1px solid rgba(220, 225, 236, 0.95);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px 18px;
  display: grid;
  gap: 6px;
  box-shadow: 0 12px 28px rgba(30, 41, 65, 0.05);
}

.summary-card span {
  color: #617089;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-card strong {
  font-size: 24px;
}

.warning-card {
  background: #fff9ef;
  border-color: #f4ddb2;
}

.conflict-card {
  background: #fff4f5;
  border-color: #f1c8cf;
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
.cell-add-button,
.mini-add-button {
  border-radius: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ghost-button,
.cell-add-button,
.mini-add-button {
  border: 1px solid #d7dceb;
  background: #fff;
}

.primary-button {
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
  padding: 11px 16px;
}

.ghost-button {
  padding: 11px 16px;
}

.small-button {
  padding: 8px 12px;
  font-size: 13px;
}

.schedule-table-wrap {
  border: 1px solid rgba(220, 225, 236, 0.95);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.93);
  overflow-x: auto;
  box-shadow: 0 22px 48px rgba(30, 41, 65, 0.06);
  padding: 12px;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
  table-layout: fixed;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #e7ebf3;
  vertical-align: top;
}

.schedule-table th {
  background: #f5f7fb;
  padding: 16px 14px;
  text-align: left;
  font-size: 14px;
  color: #223047;
}

.time-header {
  width: 148px;
}

.time-cell {
  width: 148px;
  padding: 16px 12px;
  background: #fafbfd;
}

.slot-cell {
  min-width: 154px;
  padding: 10px;
  background: #fbfcff;
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.cell-add-button,
.mini-add-button {
  padding: 6px 10px;
  font-size: 12px;
  color: #364154;
}

.mini-add-button {
  margin-top: 10px;
}

.shift-stack {
  display: grid;
  gap: 8px;
}

.shift-card {
  position: relative;
  border-radius: 16px;
  border: 1px solid #bfd4ff;
  background: linear-gradient(180deg, #eef4ff 0%, #e7f0ff 100%);
  padding: 13px 12px 12px;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(71, 101, 173, 0.08);
}

.shift-card.unassigned {
  border-color: #efc772;
  background: linear-gradient(180deg, #fff8e8 0%, #fff3d6 100%);
}

.shift-card.flagged {
  border-color: #e08ea0;
  background: linear-gradient(180deg, #fff6f8 0%, #ffe9ee 100%);
}

.shift-header {
  display: grid;
  gap: 4px;
  padding-right: 24px;
}

.shift-header strong {
  font-size: 14px;
}

.shift-header span {
  color: #4e5d73;
  font-size: 13px;
}

.shift-assignee {
  margin-top: 10px;
  font-weight: 700;
  color: #223047;
}

.shift-assignee.missing {
  color: #b56a00;
}

.shift-flag {
  margin-top: 6px;
  color: #b4233c;
  font-size: 12px;
  font-weight: 700;
}

.shift-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.empty-slot {
  min-height: 82px;
  border: 1px dashed #d7dceb;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #8591a6;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.72);
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
  max-width: 760px;
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  max-height: 94vh;
  overflow-y: auto;
}

.template-modal {
  max-width: 720px;
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal label {
  font-size: 18px;
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

.helper {
  margin-top: 2px;
  margin-bottom: 8px;
  color: #617089;
  font-size: 13px;
}

.warning-text {
  color: #b4233c;
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
  color: #b4233c;
}

.muted {
  color: #617089;
}

.modal-copy {
  margin-top: 12px;
  margin-bottom: 16px;
}

.template-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.template-list {
  display: grid;
  gap: 12px;
}

.template-card {
  border: 1px solid #dce1ec;
  border-radius: 14px;
  padding: 14px;
  background: #fbfcff;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.template-card p {
  margin-top: 6px;
}

.template-card-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 18px;
  }

  .schedule-toolbar,
  .template-card {
    display: grid;
  }

  .schedule-table-wrap {
    padding: 8px;
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
