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

    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Weekly Pattern</p>
          <h2>Your Availability</h2>
          <p class="muted">Click or drag to mark the times you are available to work each week.</p>
        </div>
        <button class="primary-button" :disabled="saving || !availabilityChanged" @click="saveAvailability">
          <v-icon size="18">mdi-content-save-outline</v-icon>
          {{ saving ? "Saving..." : "Save Availability" }}
        </button>
      </div>

      <div v-if="loading" class="loading-card">
        <v-progress-circular indeterminate color="#2647c8" size="34" width="3" />
        <p>Loading availability...</p>
      </div>

      <div v-else class="availability-calendar">
        <!-- Quick actions -->
        <div class="quick-actions">
          <button class="ghost-button" @click="setAllHours">
            <v-icon size="16">mdi-check-all</v-icon>Mark All Available
          </button>
          <button class="ghost-button" @click="clearAllHours">
            <v-icon size="16">mdi-close-all</v-icon>Clear All
          </button>
          <button class="ghost-button" @click="setBusinessHours">
            <v-icon size="16">mdi-briefcase</v-icon>Business Hours (9-5)
          </button>
        </div>

        <!-- Calendar grid with draggable hours -->
        <div class="calendar-grid">
          <!-- Header with day names -->
          <div class="calendar-header">
            <div class="time-column-header"></div>
            <div v-for="day in weekDays" :key="day.key" class="day-header">
              <strong>{{ day.label }}</strong>
              <span class="day-date">{{ day.shortDate }}</span>
            </div>
          </div>

          <!-- Time slots body -->
          <div class="calendar-body">
            <!-- Time column (hours) -->
            <div class="time-column">
              <div v-for="hour in hours" :key="hour" class="time-slot-label">
                {{ formatHour(hour) }}
              </div>
            </div>

            <!-- Day columns (draggable) -->
            <div 
              v-for="(day, dayIndex) in weekDays" 
              :key="day.key" 
              class="day-column"
              @mousedown.left="startDayDrag(dayIndex, $event)"
              @mousemove="dragDaySelection(dayIndex, $event)"
              @mouseup="endDayDrag"
              @mouseleave="endDayDrag"
            >
              <div
                v-for="hour in hours"
                :key="`${day.key}-${hour}`"
                :class="[
                  'availability-slot',
                  { available: isHourAvailable(dayIndex, hour) }
                ]"
                @mouseenter.left="dragDaySelection(dayIndex, $event)"
                @click="openTimeEditor(dayIndex)"
                :title="`Click to edit time for ${day.label}`"
              >
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="legend">
          <div class="legend-item">
            <div class="legend-box available"></div>
            <span>Available (click to edit time)</span>
          </div>
          <div class="legend-item">
            <div class="legend-box"></div>
            <span>Not available</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Time Editor Modal -->
    <div v-if="showTimeEditor" class="overlay" @click.self="closeTimeEditor">
      <section class="modal-editor">
        <header>
          <h2>Edit Availability for {{ editingDay.label }}</h2>
          <button class="icon-inline" @click="closeTimeEditor">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>

        <div class="editor-content">
          <div class="form-group">
            <label>Start Time</label>
            <div class="time-picker">
              <input 
                v-model.number="editingTimes.startHour" 
                type="number" 
                min="7" 
                max="21" 
                placeholder="HH"
                @change="validateTimes"
              />
              <span class="separator">:</span>
              <input 
                v-model.number="editingTimes.startMinute" 
                type="number" 
                min="0" 
                max="59" 
                placeholder="MM"
                @change="validateTimes"
              />
            </div>
          </div>

          <div class="form-group">
            <label>End Time</label>
            <div class="time-picker">
              <input 
                v-model.number="editingTimes.endHour" 
                type="number" 
                min="7" 
                max="21" 
                placeholder="HH"
                @change="validateTimes"
              />
              <span class="separator">:</span>
              <input 
                v-model.number="editingTimes.endMinute" 
                type="number" 
                min="0" 
                max="59" 
                placeholder="MM"
                @change="validateTimes"
              />
            </div>
          </div>

          <div class="time-display">
            <strong>{{ formatTimeRange(editingTimes) }}</strong>
          </div>

          <div class="quick-time-buttons">
            <button class="quick-btn" @click="setQuickTime('businessHours')">9 AM - 5 PM</button>
            <button class="quick-btn" @click="setQuickTime('morning')">7 AM - 12 PM</button>
            <button class="quick-btn" @click="setQuickTime('afternoon')">12 PM - 9 PM</button>
            <button class="quick-btn danger" @click="clearDayAvailability">Clear Day</button>
          </div>
        </div>

        <footer>
          <button class="btn-cancel" @click="closeTimeEditor">Cancel</button>
          <button class="btn-save" @click="saveTimeEdit">Save Time</button>
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
import EmployeeServices from "@/services/employeeServices";

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // 7 AM to 9 PM
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default defineComponent({
  name: "EmployeeAvailability",
  data() {
    return {
      loading: true,
      saving: false,
      errorMessage: "",
      successMessage: "",
      availabilityTimes: {},
      savedTimesSnapshot: "{}",
      timeOffHistory: [],
      hours: HOURS,
      weekDays: DAYS.map((key, index) => ({
        key,
        label: DAY_LABELS[index],
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
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters.getLoginUserInfo || {};
    },
    availabilityChanged() {
      return JSON.stringify(this.availabilityTimes) !== this.savedTimesSnapshot;
    },
    editingDay() {
      if (this.editingDayIndex < 0) return {};
      return this.weekDays[this.editingDayIndex];
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
        this.savedTimesSnapshot = JSON.stringify(this.availabilityTimes);
        this.timeOffHistory = data.timeOffHistory || [];
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "We could not load employee availability.";
      } finally {
        this.loading = false;
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
    startDayDrag(dayIndex, event) {
      if (event.button !== 0) return; // Only left click
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
        await EmployeeServices.updateEmployeeAvailability(this.currentUser.userId, availabilityData);
        this.savedTimesSnapshot = JSON.stringify(this.availabilityTimes);
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

.btn-cancel,
.btn-save {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
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

  .modal-editor footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}
</style>
