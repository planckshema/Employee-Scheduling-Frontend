<template>
    <div v-if="show" class="overlay" @click.self="$emit('close')">
        <section class="modal detail-modal">
            <header>
                <h2>Shift Details</h2>
                <button class="icon-inline" @click="$emit('close')">
                    <v-icon>mdi-close</v-icon>
                </button>
            </header>

            <div class="modal-body">
                <div class="detail-row">
                    <v-icon color="primary">mdi-account</v-icon>
                    <div class="detail-info">
                        <label>Staff Member</label>
                        <strong>{{ employeeName }}</strong>
                    </div>
                </div>

                <div class="detail-row">
                    <v-icon color="primary">mdi-briefcase-outline</v-icon>
                    <div class="detail-info">
                        <label>Position</label>
                        <strong>{{ shift.position || 'General Staff' }}</strong>
                    </div>
                </div>

                <div class="detail-row">
                    <v-icon color="primary">mdi-calendar-clock</v-icon>
                    <div class="detail-info">
                        <label>Schedule</label>
                        <strong>{{ formattedDate }}</strong>
                        <span>{{ formattedTimeRange }}</span>
                    </div>
                </div>
            </div>

            <footer>
                <button class="danger-button" @click="$emit('delete', shift.shiftId)">
                    Delete Shift
                </button>
                <button class="primary-button" @click="$emit('close')">
                    Close
                </button>
            </footer>
        </section>
    </div>
</template>

<script>
export default {
    name: "ShiftDetailModal",
    props: {
        show: Boolean,
        shift: Object,
        employeeName: String
    },
    computed: {
        formattedDate() {
            if (!this.shift.startDate) return "No Date Set";

            // If the date is "2026-01-26", some browsers treat it as UTC and shift it by a day.
            // We replace hyphens with slashes or add a time to force local interpretation.
            const dateString = this.shift.startDate.split('T')[0];
            const dateObj = new Date(dateString + "T00:00:00");

            if (isNaN(dateObj.getTime())) {
                return this.shift.startDate; // Fallback to raw string if parsing fails
            }

            return dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        },
        formattedTimeRange() {
            if (!this.shift.startTime || !this.shift.endTime) return "";
            return `${this.formatTime(this.shift.startTime)} - ${this.formatTime(this.shift.endTime)}`;
        }
    },
    methods: {
        formatTime(time) {
            const timePart = time.includes("T") ? time.split("T")[1].substring(0, 5) : time;
            const [h, m] = timePart.split(":");
            const hour = parseInt(h);
            return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
        }
    }
};
</script>

<style scoped>
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    /* This is the gray out */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    /* High number to stay on top */
}

.modal {
    background: white !important;
    /* Forces the background to be white */
    background-color: #ffffff;
    border-radius: 8px;
    width: 450px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: block;
    /* Ensures it's not hidden */
    color: #3c4043;
    /* Dark text for readability */
}

/* Rest of your existing detail styles */
.detail-row {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
    text-align: left;
}

.detail-info {
    display: flex;
    flex-direction: column;
}

.detail-info label {
    font-size: 11px;
    color: #70757a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.detail-info strong {
    font-size: 18px;
    margin: 2px 0;
}

.detail-info span {
    color: #5f6368;
    font-size: 14px;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
}

.danger-button {
    background: #d93025;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: auto;
}

.primary-button {
    background: #1a73e8;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>