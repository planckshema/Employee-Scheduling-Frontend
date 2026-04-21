<template>
  <section class="tab-content">
    <div class="toolbar-row">
      <div class="search-box">
        <v-icon size="18">mdi-magnify</v-icon>
        <input
          v-model="employeeSearch"
          type="text"
          placeholder="Search employees..."
        />
      </div>
      <button class="primary-button" @click="addEmployeeDialog = true">
        <v-icon size="18">mdi-plus</v-icon>
        Add Employee
      </button>
    </div>

    <div class="employee-list">
      <div class="employee-list-header">
        <span>Employee</span>
        <span>Contact</span>
        <span>Student ID</span>
        <span>Actions</span>
      </div>

      <article
        v-for="employee in filteredEmployees"
        :key="employee.id"
        class="employee-row"
      >
        <div>
          <strong>{{ employee.name }}</strong>
          <p class="muted">{{ employee.role }}</p>
        </div>
        <div class="contact-cell">
          <span><v-icon size="16">mdi-email-outline</v-icon>{{ employee.email }}</span>
          <span><v-icon size="16">mdi-phone-outline</v-icon>{{ employee.phone || "No phone" }}</span>
        </div>
        <span>{{ employee.studentId || "Not set" }}</span>
        <div class="row-actions">
          <button class="ghost-button view-btn" @click="openAvailability(employee)">
            View Calendar
          </button>
          <button
            class="delete-icon-btn"
            title="Delete employee"
            @click="deleteEmployee(employee.id)"
          >
            <v-icon size="20" color="red">mdi-trash-can-outline</v-icon>
          </button>
        </div>
      </article>

      <p v-if="!filteredEmployees.length" class="empty-copy">No employees match that search.</p>
    </div>

    <div v-if="addEmployeeDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>Add Employee</h2>
          <button class="icon-inline" @click="closeAddDialog">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>Name</label>
        <input v-model="newEmployee.name" type="text" placeholder="John Doe" />
        <label>Email</label>
        <input
          v-model="newEmployee.email"
          type="text"
          placeholder="john@example.com"
        />
        <label>Phone</label>
        <input v-model="newEmployee.phone" type="text" placeholder="555-0101" />
        <label>Student ID</label>
        <input v-model="newEmployee.studentId" type="text" placeholder="Optional" />
        <label>Position</label>
        <select v-model="newEmployee.role">
          <option disabled value="">Select a position</option>
          <option v-for="pos in positionOptions" :key="pos" :value="pos">
            {{ pos }}
          </option>
        </select>
        <p class="helper">Positions are based on your business type.</p>
        <footer>
          <button class="ghost-button" @click="closeAddDialog">Cancel</button>
          <button class="primary-button" @click="saveEmployee">
            Add Employee
          </button>
        </footer>
      </section>
    </div>

    <div v-if="availabilityDialog" class="overlay">
      <section class="modal narrow">
        <header>
          <h2>{{ selectedEmployee.name }}'s Availability</h2>
          <button class="icon-inline" @click="availabilityDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <p v-if="availabilityLoading || classScheduleLoading" class="helper">Loading availability calendar...</p>

        <div class="availability-calendar-shell">
          <FullCalendar :options="availabilityCalendarOptions" />
        </div>

        <div class="legend">
          <div class="legend-item">
            <span class="legend-box class-time"></span>
            Class time
          </div>
          <div class="legend-item">
            <span class="legend-box unavailable"></span>
            Unavailable
          </div>
        </div>
      </section>
    </div>
    <div v-if="deleteDialog" class="overlay">
  <section class="modal narrow">
    <header>
      <h2>Delete Employee</h2>
      <button class="icon-inline" @click="deleteDialog = false">
        <v-icon>mdi-close</v-icon>
      </button>
    </header>
    <p style="color: #617089; margin-bottom: 20px;">
      Are you sure you want to delete this employee? This cannot be undone.
    </p>
    <footer>
      <button class="ghost-button" @click="deleteDialog = false">Cancel</button>
      <button class="primary-button" style="background: #dc2626; border-color: #dc2626;" @click="confirmDelete">
        Delete
      </button>
    </footer>
  </section>
</div>
  </section>
</template>

<script>
import { extractPositionOptions } from "@/utils/positions";
import FullCalendar from "@fullcalendar/vue3";
import timeGridPlugin from "@fullcalendar/timegrid";
import SchedulerServices from "@/services/schedulerServices";
import EmployerServices from "@/services/employerServices";
import SchoolServices from "@/services/schoolServices";

const dayLabels = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const weekDays = dayKeys.map((key, index) => ({
  key,
  date: new Date(2026, 3, 20 + index).toISOString().slice(0, 10),
}));

const defaultAvailability = () =>
  Object.entries(dayLabels).map(([dayKey, day]) => ({
    dayKey,
    day,
    time: "Not available",
  }));

const formatAvailabilityRows = (availability) => {
  const rows = Array.isArray(availability) ? availability : [];
  const byDayKey = new Map(rows.map((row) => [String(row.dayKey || "").toLowerCase(), row]));

  return defaultAvailability().map((day) => {
    const entry = byDayKey.get(day.dayKey);
    const available = Boolean(entry?.available);
    return {
      ...day,
      time: available && entry?.startTime && entry?.endTime
        ? `${entry.startTime} - ${entry.endTime}`
        : "Not available",
    };
  });
};

export default {
  name: "EmployerEmployees",
  components: {
    FullCalendar,
  },
  data() {
    return {
      employeeSearch: "",
      addEmployeeDialog: false,
      availabilityDialog: false,
      selectedEmployee: { name: "Employee" },
      employees: [],
      employeeAvailabilityIndex: {},
      employeeUnavailableBlocksIndex: {},
      selectedUnavailableBlocks: [],
      availabilityLoading: false,
      classScheduleLoading: false,
      classSchedules: [],
      employerNiche: "",
      positionOptions: [],
      newEmployee: {
        name: "",
        email: "",
        phone: "",
        studentId: "",
        role: "",
      },
      availability: defaultAvailability(),
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    filteredEmployees() {
      const term = this.employeeSearch.toLowerCase().trim();
      if (!term) {
        return this.employees;
      }

      return this.employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(term) ||
          employee.role.toLowerCase().includes(term) ||
          employee.email.toLowerCase().includes(term)
      );
    },
    availabilityCalendarOptions() {
      return {
        plugins: [timeGridPlugin],
        initialView: "timeGridWeek",
        initialDate: weekDays[0].date,
        firstDay: 1,
        allDaySlot: false,
        height: "auto",
        slotMinTime: "07:00:00",
        slotMaxTime: "22:00:00",
        slotDuration: "00:30:00",
        headerToolbar: false,
        dayHeaderFormat: { weekday: "short", month: "numeric", day: "numeric" },
        events: this.availabilityCalendarEvents,
      };
    },
    availabilityCalendarEvents() {
      const classEvents = this.classSchedules.map((course, index) => {
        const day = weekDays.find(item => item.key === course.dayOfWeek);
        if (!day) return null;
        return {
          id: `class-${index}`,
          title: course.courseCode || course.courseName || "Class",
          start: `${day.date}T${course.startTime}`,
          end: `${day.date}T${course.endTime}`,
          backgroundColor: "#1d4ed8",
          borderColor: "#1e40af",
        };
      }).filter(Boolean);

      const unavailableEvents = this.selectedUnavailableBlocks.map((block) => {
        const day = weekDays.find(item => item.key === block.dayKey);
        if (!day) return null;
        return {
          id: block.id,
          title: block.reason || "Unavailable",
          start: `${day.date}T${block.startTime}`,
          end: `${day.date}T${block.endTime}`,
          backgroundColor: "#b4233c",
          borderColor: "#8b1f2d",
        };
      }).filter(Boolean);

      return [...classEvents, ...unavailableEvents];
    },
  },
  created() {
    this.fetchEmployees();
    this.fetchEmployeeAvailabilityIndex();
    this.fetchEmployerProfile();
  },
  methods: {
    mapEmployee(row) {
      return {
        id: row.EmployeeID,
        name: `${row.firstName} ${row.lastName}`.trim(),
        role: "Employee",
        email: row.email,
        phone: row.phoneNum,
        studentId: row.studentId || "",
      };
    },
    getSchoolLookupId(employee) {
      return employee?.studentId || String(employee?.email || "").split("@")[0] || "";
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
    fetchEmployeeAvailabilityIndex() {
      this.availabilityLoading = true;
      SchedulerServices.getEmployeeAvailabilityIndex()
        .then((response) => {
          this.employeeAvailabilityIndex = Object.fromEntries(
            (response.data || []).map((row) => [row.EmployeeID, row.availability || []])
          );
          this.employeeUnavailableBlocksIndex = Object.fromEntries(
            (response.data || []).map((row) => [row.EmployeeID, row.unavailableBlocks || []])
          );
        })
        .catch((error) => {
          console.log("error", error);
          this.employeeAvailabilityIndex = {};
        })
        .finally(() => {
          this.availabilityLoading = false;
        });
    },
    fetchEmployerProfile() {
      if (!this.currentUser?.userId) {
        return;
      }

      EmployerServices.getEmployerProfile(this.currentUser.userId)
        .then((response) => {
          this.employerNiche = response.data?.niche || "";
          this.positionOptions = extractPositionOptions(this.employerNiche);
        })
        .catch((error) => {
          console.log("error", error);
          this.positionOptions = ["General Staff", "Front Desk", "Support Staff", "Shift Lead"];
        });
    },
    closeAddDialog() {
      this.addEmployeeDialog = false;
      this.newEmployee = { name: "", email: "", phone: "", studentId: "", role: "" };
    },
   saveEmployee() {
  if (!this.newEmployee.name.trim() || !this.newEmployee.email.trim()) {
    return;
  }

      const nameParts = this.newEmployee.name.trim().split(/\s+/);
      const firstName = nameParts.shift() || "";
      const lastName = nameParts.join(" ") || "Employee";

      SchedulerServices.createEmployee({
        firstName,
        lastName,
        email: this.newEmployee.email.trim(),
        phoneNum: this.newEmployee.phone.trim(),
        studentId: this.newEmployee.studentId.trim(),
      })
        .then(() => {
          this.closeAddDialog();
          this.fetchEmployees();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    deleteEmployee(id) {
      if (!id || !window.confirm("Delete this employee?")) {
        return;
      }

      SchedulerServices.deleteEmployee(id)
        .then(() => {
          this.fetchEmployees();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    async openAvailability(employee) {
      this.selectedEmployee = employee;
      this.availability = formatAvailabilityRows(this.employeeAvailabilityIndex[employee.id]);
      this.selectedUnavailableBlocks = this.employeeUnavailableBlocksIndex[employee.id] || [];
      this.classSchedules = [];
      this.classScheduleLoading = false;
      this.availabilityDialog = true;

      const lookupId = this.getSchoolLookupId(employee);
      if (!lookupId) {
        return;
      }

      this.classScheduleLoading = true;
      try {
        const response = await SchoolServices.getClassSchedule(lookupId);
        this.classSchedules = response.data?.classSchedules || response.data?.classes || [];
      } catch (error) {
        console.warn(`Could not fetch class schedule for employee ${employee.id}:`, error);
        this.classSchedules = [];
      } finally {
        this.classScheduleLoading = false;
      }
    },
    formatDayLabel(dayKey) {
      return dayLabels[String(dayKey || "").toLowerCase()] || dayKey || "";
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

.toolbar-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #d9deea;
  border-radius: 12px;
  background: #f7f8fc;
  width: 100%;
  max-width: 420px;
  padding: 0 12px;
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  height: 44px;
}

.employee-list {
  border: 1px solid #dce1ec;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.employee-list-header,
.employee-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) minmax(240px, 1.4fr) minmax(120px, 0.6fr) minmax(210px, 0.8fr);
  gap: 14px;
  align-items: center;
  padding: 13px 16px;
}

.employee-list-header {
  background: #f5f7fb;
  color: #617089;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.employee-row {
  border-top: 1px solid #e8ecf2;
}

.employee-row strong {
  color: #182234;
}

.contact-cell {
  display: grid;
  gap: 4px;
}

.contact-cell span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.muted {
  color: #617089;
}

.icon-inline {
  border: 1px solid #d5dae7;
  background: #fff;
  border-radius: 10px;
  width: 38px;
  height: 38px;
  cursor: pointer;
}

.ghost-button,
.primary-button {
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

.modal.narrow {
  max-width: 1040px;
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

.modal input {
  width: 100%;
  border: none;
  background: #f1f2f7;
  border-radius: 12px;
  min-height: 52px;
  padding: 11px 16px;
  outline: none;
  margin-bottom: 6px;
}

.modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.availability-row {
  border: 1px solid #dce1ec;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.availability-calendar-shell {
  border: 1px solid #dce1ec;
  border-radius: 8px;
  background: #fff;
  padding: 10px;
  overflow-x: auto;
}

.availability-calendar-shell :deep(.fc) {
  min-width: 760px;
  font-family: inherit;
}

.availability-calendar-shell :deep(.fc-col-header-cell) {
  background: #f5f7fb;
  color: #223047;
  padding: 10px 6px;
}

.availability-calendar-shell :deep(.fc-event) {
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 12px;
  font-weight: 700;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8ecf2;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #617089;
  font-size: 13px;
  font-weight: 700;
}

.legend-box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #dce1ec;
}

.legend-box.available {
  background: #2e7d32;
  border-color: #1b5e20;
}

.legend-box.class-time {
  background: #1d4ed8;
  border-color: #1e40af;
}

.legend-box.unavailable {
  background: #b4233c;
  border-color: #8b1f2d;
}

.section-heading {
  margin-top: 18px;
}

.class-row span {
  text-align: right;
}

.course-name {
  display: block;
  color: #617089;
  font-size: 12px;
  margin-top: 2px;
}

.unavailable-row {
  background: #fff6f8;
  border-color: #f0b4c0;
}

.row-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.view-btn {
  flex-grow: 1;
  justify-content: center;
}

.delete-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff1f1;
  border: 1px solid #ffcccc;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  cursor: pointer;
}

.delete-icon-btn:hover {
  background: #ffe0e0;
  border-color: #ffb3b3;
}

.empty-copy {
  padding: 18px;
  text-align: center;
  color: #617089;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .employee-list-header {
    display: none;
  }

  .employee-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .row-actions {
    justify-content: flex-start;
  }
}
</style>
