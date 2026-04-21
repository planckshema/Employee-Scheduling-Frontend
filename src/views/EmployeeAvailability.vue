<template>
  <section class="tab-content">
    <section v-if="errorMessage" class="status-banner error">
      <v-icon size="18">mdi-alert-circle-outline</v-icon>
      <span>{{ errorMessage }}</span>
    </section>

    <section v-if="successMessage" class="status-banner success">
      <v-icon size="18">mdi-check-circle-outline</v-icon>
      <span>{{ successMessage }}</span>
    </section>

    <section v-if="classScheduleMessage" class="status-banner warning">
      <v-icon size="18">mdi-alert-outline</v-icon>
      <span>{{ classScheduleMessage }}</span>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Weekly Pattern</p>
          <h2>Your Unavailable Times</h2>
          <p class="muted">Your classes are blocked automatically. Add anything else that keeps you from working.</p>
        </div>
        <div class="header-actions">
          <button class="primary-button" :disabled="saving || !availabilityChanged" @click="saveAvailability">
            <v-icon size="18">mdi-content-save-outline</v-icon>
            {{ saving ? "Saving..." : "Save Availability" }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-card">
        <v-progress-circular indeterminate color="#2647c8" size="34" width="3" />
        <p>Loading availability...</p>
      </div>

      <div v-else class="availability-calendar">
        <div class="quick-actions">
          <button class="primary-button" @click="openUnavailableEditor()">
            <v-icon size="16">mdi-calendar-remove-outline</v-icon>Add Unavailable Time
          </button>
        </div>

        <div class="calendar-shell">
          <FullCalendar ref="availabilityCalendar" :options="calendarOptions" />
        </div>

        <div class="legend">
          <div v-if="classSchedules.length" class="legend-item">
            <div class="legend-box class-time"></div>
            <span>Class time</span>
          </div>
          <div class="legend-item">
            <div class="legend-box unavailable"></div>
            <span>Unavailable</span>
          </div>
        </div>

        <div v-if="unavailableBlocks.length" class="unavailable-list">
          <article v-for="block in unavailableBlocks" :key="block.id" class="unavailable-row">
            <div>
              <strong>{{ dayLabelFor(block.dayKey) }} {{ block.startTime }} - {{ block.endTime }}</strong>
              <p>{{ block.reason || "Unavailable" }}</p>
            </div>
            <div class="row-actions">
              <button class="icon-inline" @click="openUnavailableEditor(block)" title="Edit unavailable time">
                <v-icon size="18">mdi-pencil-outline</v-icon>
              </button>
              <button class="icon-inline danger-icon" @click="removeUnavailableBlock(block.id)" title="Remove unavailable time">
                <v-icon size="18">mdi-delete-outline</v-icon>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="showUnavailableEditor" class="overlay" @click.self="closeUnavailableEditor">
      <section class="modal-editor">
        <header>
          <h2>{{ unavailableDraft.id ? "Edit Unavailable Time" : "Add Unavailable Time" }}</h2>
          <button class="icon-inline" @click="closeUnavailableEditor">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>

        <div class="editor-content">
          <div class="form-group">
            <label>Day</label>
            <select v-model="unavailableDraft.dayKey">
              <option v-for="day in weekDays" :key="day.key" :value="day.key">{{ day.label }}</option>
            </select>
          </div>

          <div class="two-col">
            <div class="form-group">
              <label>Start Time</label>
              <input v-model="unavailableDraft.startTime" type="time" min="07:00" max="21:00" />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input v-model="unavailableDraft.endTime" type="time" min="07:00" max="21:00" />
            </div>
          </div>

          <div class="form-group">
            <label>Reason</label>
            <input v-model="unavailableDraft.reason" type="text" placeholder="Class project, tutoring, appointment" />
          </div>
        </div>

        <footer>
          <button
            v-if="unavailableDraft.id"
            class="btn-danger footer-left"
            @click="removeUnavailableBlock(unavailableDraft.id); closeUnavailableEditor();"
          >
            Delete
          </button>
          <button class="btn-cancel" @click="closeUnavailableEditor">Cancel</button>
          <button class="btn-save" @click="saveUnavailableBlock">
            {{ unavailableDraft.id ? "Update Time" : "Add Time" }}
          </button>
        </footer>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header compact">
        <div>
          <p class="eyebrow">Reference</p>
          <h3>Recent Time-Off Requests</h3>
        </div>
      </div>

      <div v-if="timeOffHistory.length" class="history-list">
        <article v-for="request in timeOffHistory" :key="request.timeOffId" class="history-row">
          <div>
            <strong>{{ formatDateRange(request.startDate, request.endDate) }}</strong>
            <p>{{ request.reason }}</p>
          </div>
        </article>
      </div>

      <p v-else class="empty-copy">No recent time-off requests were found.</p>
    </section>
  </section>
</template>

<script>
import { defineComponent } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EmployeeServices from "@/services/employeeServices";
import SchoolServices from "@/services/schoolServices";

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // 7 AM to 9 PM
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default defineComponent({
  name: "EmployeeAvailability",
  components: {
    FullCalendar,
  },
  data() {
    return {
      loading: true,
      saving: false,
      errorMessage: "",
      successMessage: "",
      classScheduleMessage: "",
      availabilityTimes: {},
      savedTimesSnapshot: "{}",
      unavailableBlocks: [],
      savedUnavailableSnapshot: "[]",
      timeOffHistory: [],
      hours: HOURS,
      weekDays: DAYS.map((key, index) => ({
        key,
        label: DAY_LABELS[index],
        date: new Date(2026, 3, 20 + index).toISOString().slice(0, 10),
        shortDate: new Date(2026, 3, 20 + index).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      })),
      isDragging: false,
      dragDayIndex: -1,
      dragStartHour: -1,
      dragCurrentHour: -1,
      showTimeEditor: false,
      editingDayIndex: -1,
      editingTimes: {
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
      },
      showClassSchedule: false,
      classSchedules: [],
      mergedAvailability: [],
      loadingClasses: false,
      showUnavailableEditor: false,
      unavailableDraft: {
        id: "",
        dayKey: "mon",
        startTime: "12:00",
        endTime: "13:00",
        reason: "",
      },
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    availabilityChanged() {
      return JSON.stringify(this.unavailableBlocks) !== this.savedUnavailableSnapshot;
    },
    editingDay() {
      if (this.editingDayIndex < 0) return {};
      return this.weekDays[this.editingDayIndex];
    },
    calendarOptions() {
      return {
        plugins: [timeGridPlugin, interactionPlugin],
        initialView: "timeGridWeek",
        initialDate: this.weekDays[0].date,
        firstDay: 1,
        allDaySlot: false,
        height: "auto",
        slotMinTime: "07:00:00",
        slotMaxTime: "22:00:00",
        slotDuration: "00:30:00",
        nowIndicator: false,
        selectable: true,
        selectMirror: true,
        headerToolbar: false,
        dayHeaderFormat: { weekday: "short", month: "numeric", day: "numeric" },
        events: this.calendarEvents,
        select: this.openUnavailableEditorFromSelect,
        eventClick: this.handleCalendarEventClick,
      };
    },
    calendarEvents() {
      const classEvents = this.classSchedules.map((course, index) => {
        const dayIndex = DAYS.indexOf(course.dayOfWeek);
        if (dayIndex < 0) return null;

        return {
          id: `class-${index}`,
          title: course.courseCode || course.courseName || "Class",
          start: `${this.weekDays[dayIndex].date}T${course.startTime}`,
          end: `${this.weekDays[dayIndex].date}T${course.endTime}`,
          backgroundColor: "#1d4ed8",
          borderColor: "#1e40af",
          extendedProps: { type: "class" },
        };
      }).filter(Boolean);

      const unavailableEvents = this.unavailableBlocks.map((block) => {
        const dayIndex = DAYS.indexOf(block.dayKey);
        if (dayIndex < 0) return null;

        return {
          id: block.id,
          title: block.reason || "Unavailable",
          start: `${this.weekDays[dayIndex].date}T${block.startTime}`,
          end: `${this.weekDays[dayIndex].date}T${block.endTime}`,
          backgroundColor: "#b4233c",
          borderColor: "#8b1f2d",
          extendedProps: { type: "unavailable", blockId: block.id },
        };
      }).filter(Boolean);

      return [...classEvents, ...unavailableEvents];
    },
  },
  created() {
    this.loadDashboard();
  },
  methods: {
    async loadDashboard() {
      if (!this.currentUser?.userId) {
        this.loading = false;
        this.errorMessage = "Your session is missing user information. Please sign in again.";
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const { data } = await EmployeeServices.getEmployeeDashboard(this.currentUser.userId);
        this.availabilityTimes = this.parseAvailabilityData(data.availability || []);
        this.unavailableBlocks = this.parseUnavailableBlocks(data.unavailableBlocks || []);
        this.savedTimesSnapshot = JSON.stringify(this.availabilityTimes);
        this.savedUnavailableSnapshot = JSON.stringify(this.unavailableBlocks);
        this.timeOffHistory = data.timeOffHistory || [];

        // Load class schedules if available
        await this.loadClassSchedules();
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "We could not load employee availability.";
      } finally {
        this.loading = false;
      }
    },
    async loadClassSchedules() {
      try {
        this.loadingClasses = true;
        const { data } = await SchoolServices.getMergedAvailability(this.currentUser.userId);
        this.mergedAvailability = data.mergedAvailability || [];
        this.classSchedules = data.classSchedules || data.classSchedule || [];
        this.classScheduleMessage = data.classScheduleError
          ? `Class schedule was not loaded: ${data.classScheduleError}`
          : "";
      } catch (error) {
        // Class schedules are optional, don't show error if they fail to load
        console.warn("Could not load class schedules:", error);
        this.classSchedules = [];
        this.mergedAvailability = [];
        this.classScheduleMessage = "Class schedule was not loaded. Check the school API lookup settings.";
      } finally {
        this.loadingClasses = false;
      }
    },
    parseAvailabilityData(data) {
      const times = {};
      DAYS.forEach(day => {
        times[day] = { startHour: null, startMinute: null, endHour: null, endMinute: null };
      });

      if (Array.isArray(data)) {
        data.forEach(entry => {
          if (entry.dayKey && entry.available && entry.startTime && entry.endTime) {
            const [startHour, startMinute] = entry.startTime.split(':').map(Number);
            const [endHour, endMinute] = entry.endTime.split(':').map(Number);
            times[entry.dayKey] = { startHour, startMinute, endHour, endMinute };
          }
        });
      } else if (typeof data === 'object') {
        return { ...times, ...data };
      }

      return times;
    },
    parseUnavailableBlocks(data) {
      return (Array.isArray(data) ? data : [])
        .filter(block => block.dayKey && block.startTime && block.endTime)
        .map((block, index) => ({
          id: block.id || `unavailable-${Date.now()}-${index}`,
          dayKey: String(block.dayKey).toLowerCase(),
          label: block.label || this.dayLabelFor(block.dayKey),
          startTime: String(block.startTime).slice(0, 5),
          endTime: String(block.endTime).slice(0, 5),
          reason: block.reason || "Unavailable",
        }));
    },
    timeFromParts(hour, minute) {
      return `${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
    },
    dayLabelFor(dayKey) {
      const index = DAYS.indexOf(String(dayKey || "").toLowerCase());
      return index >= 0 ? DAY_LABELS[index] : "";
    },
    dayKeyFromDate(dateValue) {
      const isoDate = String(dateValue || "").slice(0, 10);
      return this.weekDays.find(day => day.date === isoDate)?.key || "mon";
    },
    formatHour(hour) {
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:00`;
    },
    isHourAvailable(dayIndex, hour) {
      const dayKey = DAYS[dayIndex];
      const times = this.availabilityTimes[dayKey];
      
      if (!times || times.startHour === null || times.endHour === null) {
        return false;
      }

      // Check if hour falls within the time range
      if (hour < times.startHour || hour >= times.endHour) {
        return false;
      }

      // For the start hour, check if it's after the start minute
      if (hour === times.startHour && times.startMinute > 0) {
        return true;
      }

      // For the end hour, check if it's before the end minute
      if (hour === times.endHour - 1 && times.endMinute > 0) {
        return true;
      }

      return true;
    },
    hasClassAtTime(dayIndex, hour) {
      if (!this.classSchedules.length) return false;
      
      const dayKey = DAYS[dayIndex];
      const dayClasses = this.classSchedules.filter(cls => cls.dayOfWeek === dayKey);
      
      return dayClasses.some(cls => {
        const startHour = parseInt(cls.startTime.split(':')[0]);
        const endHour = parseInt(cls.endTime.split(':')[0]);
        return hour >= startHour && hour < endHour;
      });
    },
    hasConflictAtTime(dayIndex, hour) {
      return this.isHourAvailable(dayIndex, hour) && this.hasClassAtTime(dayIndex, hour);
    },
    getClassTooltip(dayIndex, hour) {
      const dayKey = DAYS[dayIndex];
      const dayClasses = this.classSchedules.filter(cls => cls.dayOfWeek === dayKey);
      const classesAtTime = dayClasses.filter(cls => {
        const startHour = parseInt(cls.startTime.split(':')[0]);
        const endHour = parseInt(cls.endTime.split(':')[0]);
        return hour >= startHour && hour < endHour;
      });
      
      if (classesAtTime.length === 0) return 'No classes scheduled';
      
      const classNames = classesAtTime.map(cls => `${cls.courseName} (${cls.startTime}-${cls.endTime})`).join(', ');
      return `Classes: ${classNames}`;
    },
    startDayDrag(dayIndex, event) {
      if (event.button !== 0 || this.showClassSchedule) return; // Only left click and only when not showing class schedule
      this.isDragging = true;
      this.dragDayIndex = dayIndex;
      this.setDragStart(dayIndex, event);
    },
    setDragStart(dayIndex, event) {
      const dayColumn = event.currentTarget;
      const rect = dayColumn.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const hourIndex = Math.floor((relativeY / rect.height) * HOURS.length);
      this.dragStartHour = Math.max(0, Math.min(HOURS.length - 1, hourIndex));
      this.dragCurrentHour = this.dragStartHour;
    },
    dragDaySelection(dayIndex, event) {
      if (!this.isDragging || this.dragDayIndex !== dayIndex) return;
      
      const dayColumn = event.currentTarget;
      const rect = dayColumn.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const hourIndex = Math.floor((relativeY / rect.height) * HOURS.length);
      this.dragCurrentHour = Math.max(0, Math.min(HOURS.length - 1, hourIndex));
      
      // Mark hours between start and current as available
      this.updateDragSelection();
    },
    updateDragSelection() {
      const dayKey = DAYS[this.dragDayIndex];
      const start = Math.min(this.dragStartHour, this.dragCurrentHour);
      const end = Math.max(this.dragStartHour, this.dragCurrentHour);

      const startHour = HOURS[start];
      const endHour = HOURS[end + 1] || HOURS[HOURS.length - 1];

      this.availabilityTimes[dayKey] = {
        startHour,
        startMinute: 0,
        endHour,
        endMinute: 0,
      };
    },
    endDayDrag() {
      this.isDragging = false;
      this.dragDayIndex = -1;
      this.dragStartHour = -1;
      this.dragCurrentHour = -1;
    },
    openTimeEditor(dayIndex) {
      this.editingDayIndex = dayIndex;
      const dayKey = DAYS[dayIndex];
      const times = this.availabilityTimes[dayKey];

      if (times.startHour !== null) {
        this.editingTimes = { ...times };
      } else {
        this.editingTimes = { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 };
      }

      this.showTimeEditor = true;
    },
    closeTimeEditor() {
      this.showTimeEditor = false;
      this.editingDayIndex = -1;
    },
    openUnavailableEditor(defaults = {}) {
      this.unavailableDraft = {
        id: defaults.id || "",
        dayKey: defaults.dayKey || "mon",
        startTime: defaults.startTime || "12:00",
        endTime: defaults.endTime || "13:00",
        reason: defaults.reason || "",
      };
      this.showUnavailableEditor = true;
    },
    openUnavailableEditorFromSelect(selection) {
      this.openUnavailableEditor({
        dayKey: this.dayKeyFromDate(selection.startStr),
        startTime: selection.startStr.slice(11, 16) || "12:00",
        endTime: selection.endStr.slice(11, 16) || "13:00",
      });
      selection.view.calendar.unselect();
    },
    closeUnavailableEditor() {
      this.showUnavailableEditor = false;
    },
    saveUnavailableBlock() {
      if (!this.unavailableDraft.dayKey || !this.unavailableDraft.startTime || !this.unavailableDraft.endTime) {
        this.errorMessage = "Choose a day, start time, and end time.";
        return;
      }

      if (this.unavailableDraft.startTime >= this.unavailableDraft.endTime) {
        this.errorMessage = "Unavailable time must end after it starts.";
        return;
      }

      const savedBlock = {
        id: this.unavailableDraft.id || `unavailable-${Date.now()}`,
        dayKey: this.unavailableDraft.dayKey,
        label: this.dayLabelFor(this.unavailableDraft.dayKey),
        startTime: this.unavailableDraft.startTime,
        endTime: this.unavailableDraft.endTime,
        reason: this.unavailableDraft.reason.trim() || "Unavailable",
      };

      this.unavailableBlocks = this.unavailableDraft.id
        ? this.unavailableBlocks.map(block => block.id === savedBlock.id ? savedBlock : block)
        : [...this.unavailableBlocks, savedBlock];
      this.errorMessage = "";
      this.closeUnavailableEditor();
    },
    removeUnavailableBlock(id) {
      this.unavailableBlocks = this.unavailableBlocks.filter(block => block.id !== id);
    },
    handleCalendarEventClick(clickInfo) {
      const eventType = clickInfo.event.extendedProps.type;
      if (eventType === "unavailable") {
        const block = this.unavailableBlocks.find(item => item.id === clickInfo.event.extendedProps.blockId);
        if (block) {
          this.openUnavailableEditor(block);
        }
      }
    },
    validateTimes() {
      this.editingTimes.startMinute = Math.max(0, Math.min(59, this.editingTimes.startMinute || 0));
      this.editingTimes.endMinute = Math.max(0, Math.min(59, this.editingTimes.endMinute || 0));
      this.editingTimes.startHour = Math.max(7, Math.min(21, this.editingTimes.startHour || 7));
      this.editingTimes.endHour = Math.max(7, Math.min(21, this.editingTimes.endHour || 21));

      if (this.editingTimes.startHour > this.editingTimes.endHour) {
        this.editingTimes.endHour = this.editingTimes.startHour + 1;
      }
    },
    formatTimeRange(times) {
      const format = (h, m) => {
        const ampm = h >= 12 ? "PM" : "AM";
        const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
      };
      return `${format(times.startHour, times.startMinute)} - ${format(times.endHour, times.endMinute)}`;
    },
    setQuickTime(preset) {
      if (preset === 'businessHours') {
        this.editingTimes = { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 };
      } else if (preset === 'morning') {
        this.editingTimes = { startHour: 7, startMinute: 0, endHour: 12, endMinute: 0 };
      } else if (preset === 'afternoon') {
        this.editingTimes = { startHour: 12, startMinute: 0, endHour: 21, endMinute: 0 };
      }
    },
    clearDayAvailability() {
      const dayKey = DAYS[this.editingDayIndex];
      this.availabilityTimes[dayKey] = { startHour: null, startMinute: null, endHour: null, endMinute: null };
      this.closeTimeEditor();
    },
    saveTimeEdit() {
      this.validateTimes();
      const dayKey = DAYS[this.editingDayIndex];
      this.availabilityTimes[dayKey] = { ...this.editingTimes };
      this.closeTimeEditor();
    },
    setAllHours() {
      DAYS.forEach(day => {
        this.availabilityTimes[day] = { startHour: 7, startMinute: 0, endHour: 21, endMinute: 0 };
      });
    },
    clearAllHours() {
      DAYS.forEach(day => {
        this.availabilityTimes[day] = { startHour: null, startMinute: null, endHour: null, endMinute: null };
      });
    },
    setBusinessHours() {
      DAYS.forEach((day, dayIndex) => {
        if (dayIndex < 5) {
          this.availabilityTimes[day] = { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 };
        } else {
          this.availabilityTimes[day] = { startHour: null, startMinute: null, endHour: null, endMinute: null };
        }
      });
    },
    async saveAvailability() {
      if (!this.currentUser?.userId) {
        this.errorMessage = "Your session is missing user information.";
        return;
      }

      this.saving = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const availabilityData = this.convertTimesToApiFormat();
        await EmployeeServices.updateEmployeeAvailability(this.currentUser.userId, availabilityData, this.unavailableBlocks);
        this.savedTimesSnapshot = JSON.stringify(this.availabilityTimes);
        this.savedUnavailableSnapshot = JSON.stringify(this.unavailableBlocks);
        this.successMessage = "Your availability has been saved successfully!";
        
        setTimeout(() => {
          this.successMessage = "";
        }, 3000);
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "We could not save your availability. Please try again.";
      } finally {
        this.saving = false;
      }
    },
    convertTimesToApiFormat() {
      const result = [];
      DAYS.forEach((dayKey, index) => {
        const times = this.availabilityTimes[dayKey];
        
        if (times.startHour !== null && times.endHour !== null) {
          result.push({
            dayKey,
            label: DAY_LABELS[index],
            available: true,
            startTime: `${String(times.startHour).padStart(2, '0')}:${String(times.startMinute).padStart(2, '0')}`,
            endTime: `${String(times.endHour).padStart(2, '0')}:${String(times.endMinute).padStart(2, '0')}`,
          });
        } else {
          result.push({
            dayKey,
            label: DAY_LABELS[index],
            available: false,
            startTime: "",
            endTime: "",
          });
        }
      });
      return result;
    },
    formatDateRange(start, end) {
      const options = { month: "short", day: "numeric" };
      const startDate = new Date(start).toLocaleDateString("en-US", options);
      const endDate = new Date(end).toLocaleDateString("en-US", options);
      return `${startDate} - ${endDate}`;
    },
  },
});
</script>

<style scoped>
.tab-content {
  padding: 0 20px 24px;
  display: grid;
  gap: 16px;
}

.panel,
.status-banner {
  border: 1px solid #dce1ec;
  border-radius: 18px;
  background: #fff;
}

.panel {
  padding: 20px;
}

.status-banner {
  padding: 14px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-banner.error {
  background: #fff4f5;
  color: #8b1f2d;
}

.status-banner.success {
  background: #effcf4;
  color: #195f40;
}

.status-banner.warning {
  background: #fff8eb;
  color: #8a4f00;
  border-color: #efd196;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.panel-header.compact {
  margin-bottom: 12px;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.toggle-group {
  display: flex;
  border: 1px solid #dce1ec;
  border-radius: 8px;
  overflow: hidden;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: #2647c8;
  color: #fff;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-btn .v-icon {
  margin-right: 4px;
}

.availability-slot {
  height: 32px;
  border: 1px solid #e8ecf2;
  background: #fff;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.availability-slot.available {
  background: #effcf4;
  border-color: #195f40;
}

.availability-slot.class-time {
  background: #eff6ff;
  border-color: #1d4ed8;
}

.availability-slot.conflict {
  background: #fef3c7;
  border-color: #d97706;
}

.availability-slot:hover:not(.class-time):not(.conflict) {
  background: #f8fafc;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8ecf2;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.legend-box {
  width: 16px;
  height: 16px;
  border: 1px solid #e8ecf2;
  background: #fff;
}

.legend-box.available {
  background: #effcf4;
  border-color: #195f40;
}

.legend-box.class-time {
  background: #eff6ff;
  border-color: #1d4ed8;
}

.legend-box.conflict {
  background: #fef3c7;
  border-color: #d97706;
}

.legend-box.unavailable {
  background: #ffe9ee;
  border-color: #b4233c;
}

.panel-header.compact {
  margin-bottom: 12px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 800;
  color: #3957ba;
}

h2,
h3,
p {
  margin: 0;
}

.muted {
  color: #617089;
}

.primary-button {
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  border: 1px solid #080c28;
  background: #060828;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-button:hover:not(:disabled) {
  background: #1a1f3a;
  transform: translateY(-2px);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-card {
  min-height: 220px;
  display: flex;
  gap: 12px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #617089;
}

.availability-calendar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-shell {
  border: 1px solid #dce1ec;
  border-radius: 8px;
  background: #fff;
  padding: 10px;
  overflow-x: auto;
}

.calendar-shell :deep(.fc) {
  min-width: 760px;
  font-family: inherit;
}

.calendar-shell :deep(.fc-col-header-cell) {
  background: #f5f7fb;
  color: #223047;
  padding: 10px 6px;
}

.calendar-shell :deep(.fc-event) {
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.ghost-button {
  padding: 10px 16px;
  border: 2px solid #dce1ec;
  background: white;
  color: #324055;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ghost-button:hover {
  border-color: #667eea;
  background: #f0f4ff;
  color: #667eea;
  transform: translateY(-1px);
}

/* Calendar Grid Styles */
.calendar-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid #dce1ec;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-column-header {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.day-header {
  padding: 12px 8px;
  text-align: center;
  font-size: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.day-header:last-child {
  border-right: none;
}

.day-date {
  font-size: 10px;
  opacity: 0.9;
  font-weight: 500;
}

.calendar-body {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  max-height: 650px;
  overflow-y: auto;
  background: white;
}

.time-column {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  background: #fafbff;
}

.day-column {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #dce1ec;
  user-select: none;
  cursor: crosshair;
}

.day-column:last-child {
  border-right: none;
}

.time-slot-label {
  padding: 8px;
  text-align: center;
  font-size: 11px;
  color: #617089;
  font-weight: 600;
  background: #fafbff;
  border-bottom: 1px solid #dce1ec;
  border-right: 1px solid #dce1ec;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-slot-label:last-child {
  border-bottom: none;
}

.availability-slot {
  padding: 0;
  min-height: 40px;
  border-bottom: 1px solid #dce1ec;
  background: white;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.availability-slot:last-child {
  border-bottom: none;
}

.availability-slot:hover {
  background: #f9fbff;
  box-shadow: inset 0 0 0 1px rgba(102, 126, 234, 0.2);
}

.availability-slot.available {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}

/* Legend */
.legend {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-size: 13px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #dce1ec;
  background: white;
}

.legend-box.available {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
  border-color: #66bb6a;
}

/* Legend */
.legend {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-size: 13px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #dce1ec;
  background: white;
}

.legend-box.available {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
  border-color: #66bb6a;
}

/* History Section */
.history-list {
  display: grid;
  gap: 12px;
}

.history-row {
  border: 1px solid #dfe4ef;
  border-radius: 8px;
  padding: 12px 16px;
  background: #f9fbff;
}

.history-row strong {
  display: block;
  margin-bottom: 4px;
  color: #324055;
}

.history-row p {
  margin: 0;
  font-size: 13px;
  color: #617089;
}

.empty-copy {
  text-align: center;
  padding: 20px;
  color: #99a6b7;
  font-style: italic;
}

/* Time Editor Modal */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 27, 39, 0.6);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-editor {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-editor header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-editor h2 {
  font-size: 20px;
  font-weight: 700;
  color: #324055;
}

.icon-inline {
  width: 36px;
  height: 36px;
  border: 1px solid #dce1ec;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-inline:hover {
  background: #f9fbff;
  border-color: #667eea;
  color: #667eea;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #324055;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  border: 2px solid #dce1ec;
  background: #f9fbff;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  outline: none;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.unavailable-list {
  display: grid;
  gap: 8px;
}

.unavailable-row {
  border: 1px solid #f0b4c0;
  border-radius: 8px;
  background: #fff6f8;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.danger-icon {
  color: #b4233c;
  border-color: #f0b4c0;
}

.unavailable-row p {
  color: #617089;
  font-size: 13px;
  margin-top: 4px;
}

.time-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f9fbff;
  border: 2px solid #dce1ec;
  border-radius: 8px;
  padding: 8px 12px;
}

.time-picker input {
  width: 60px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 700;
  color: #324055;
}

.time-picker input:focus {
  outline: none;
}

.separator {
  font-weight: 700;
  color: #667eea;
  font-size: 18px;
}

.time-display {
  padding: 12px;
  background: #f0f4ff;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  color: #667eea;
  border: 2px solid #e8ecf6;
}

.quick-time-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.quick-btn {
  padding: 10px 12px;
  border: 2px solid #dce1ec;
  background: white;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #324055;
}

.quick-btn:hover {
  border-color: #667eea;
  background: #f0f4ff;
  color: #667eea;
}

.quick-btn.danger {
  border-color: #ffcccc;
  color: #d32f2f;
}

.quick-btn.danger:hover {
  background: #ffebee;
  border-color: #ff6b6b;
}

.modal-editor footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.footer-left {
  margin-right: auto;
}

.btn-cancel,
.btn-save,
.btn-danger {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-danger {
  background: #fff1f3;
  color: #b4233c;
  border: 1px solid #f0b4c0;
}

.btn-cancel {
  background: #f0f0f0;
  color: #324055;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save {
  background: #667eea;
  color: white;
}

.btn-save:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .panel-header {
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
    justify-content: center;
  }

  .calendar-header {
    grid-template-columns: 60px repeat(7, 1fr);
  }

  .calendar-body {
    grid-template-columns: 60px repeat(7, 1fr);
  }

  .quick-actions {
    gap: 8px;
  }

  .ghost-button {
    flex: 1;
    min-width: 80px;
  }

  .legend {
    flex-direction: column;
    gap: 8px;
  }

  .modal-editor {
    max-width: calc(100% - 32px);
  }

  .quick-time-buttons {
    grid-template-columns: 1fr;
  }

  .two-col {
    grid-template-columns: 1fr;
  }

  .modal-editor footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}
</style>
