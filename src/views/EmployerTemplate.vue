<template>
    <div v-if="show" class="overlay" @click.self="$emit('close')">
        <section class="modal template-modal">
            <header>
                <h2>Schedule Templates</h2>
                <button class="icon-inline" @click="$emit('close')">
                    <v-icon>mdi-close</v-icon>
                </button>
            </header>

            <div class="modal-body">
                <div class="template-actions">
                    <button class="primary-button full-width" @click="saveCurrentAsTemplate">
                        <v-icon left>mdi-content-save-plus</v-icon> Save Current Week as Template
                    </button>
                </div>

                <hr class="divider" />

                <h3>Saved Templates</h3>
                <div v-if="templates.length === 0" class="empty-state">
                    No templates saved yet.
                </div>

                <ul class="template-list">
                    <li v-for="temp in templates" :key="temp.id">
                        <span>{{ temp.name }}</span>
                        <div class="list-actions">
                            <button class="apply-btn" @click="applyTemplate(temp)">Apply</button>
                            <button class="delete-icon" @click="deleteTemplate(temp.id)">
                                <v-icon small>mdi-delete</v-icon>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </section>
    </div>
</template>

<script>
import TemplateServices from "@/services/templateServices";

export default {
    name: "EmployerTemplate",
    props: {
        show: Boolean,
        currentWeekShifts: Array, // We pass the shifts currently on screen
        currentMonday: Date       // We need to know what week we are looking at
    },
    data() {
        return {
            templates: [],
            newTemplateName: ""
        };
    },
    watch: {
        show(val) {
            if (val) this.loadTemplates();
        }
    },
    methods: {
        async loadTemplates() {
            try {
                const res = await TemplateServices.getAllTemplates();
                this.templates = res.data;
            } catch (err) {
                console.error("Error loading templates", err);
            }
        },
        saveCurrentAsTemplate() {
            const name = prompt("Enter a name for this template:");
            if (!name) return;

            try {
                const templateShifts = this.currentWeekShifts
                    .filter(s => s.startDate && s.startTime) // 1. ONLY process shifts that have a date and time
                    .map(s => {
                        // 2. Safe Date parsing
                        const cleanDateString = s.startDate.includes('T') ? s.startDate.split('T')[0] : s.startDate;
                        const dateObj = new Date(cleanDateString.replace(/-/g, '/'));
                        const dayNum = dateObj.getDay();

                        const cleanTime = (t) => (t && t.includes("T")) ? t.split("T")[1] : t;

                        return {
                            EmployeeID: s.EmployeeID,
                            position: s.position || "Staff",
                            startTime: cleanTime(s.startTime),
                            endTime: cleanTime(s.endTime),
                            dayOfWeek: dayNum
                        };
                    });

                if (templateShifts.length === 0) {
                    alert("No valid shifts found to save in this template.");
                    return;
                }

                const payload = {
                    name: name,
                    description: `Saved from week of ${this.currentMonday ? this.currentMonday.toLocaleDateString() : 'Unknown'}`,
                    shifts: templateShifts
                };

                console.log("Payload ready to send:", payload);

                TemplateServices.createTemplate(payload)
                    .then((res) => {
                        this.loadTemplates();
                        alert("Template saved successfully!");
                    })
                    .catch((err) => {
                        console.error("API Error:", err);
                        alert("Server rejected the template. check console.");
                    });

            } catch (error) {
                console.error("Mapping Error:", error);
                alert("A shift in your schedule has invalid data and couldn't be saved.");
            }
        },
        async applyTemplate(template) {
            // This is where the magic happens later!
            this.$emit('apply', template);
        },
        async deleteTemplate(id) {
            if (confirm("Delete this template?")) {
                await TemplateServices.deleteTemplate(id);
                this.loadTemplates();
            }
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
    background: rgba(24, 44, 30, 0.46);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
}

.modal {
    background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%) !important;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    width: 500px;
    max-height: 85vh;
    padding: 24px;
    box-shadow: var(--app-shadow-lg);
    display: flex;
    flex-direction: column;
    color: var(--app-text);
}

.modal-body {
    overflow-y: auto;
    margin-top: 15px;
    padding-right: 5px;
}

.full-width {
    width: 100%;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.divider {
    margin: 20px 0;
    border: 0;
    border-top: 1px solid var(--app-border);
}

.template-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.template-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px;
    border: 1px solid var(--app-border);
    margin-bottom: 10px;
    border-radius: 16px;
    transition: background 0.2s;
    background: var(--app-surface);
}

.template-list li:hover {
    background: var(--app-surface-soft);
}

.list-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.apply-btn {
    background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
    color: white;
    border: 1px solid var(--app-primary-deep);
    padding: 8px 16px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
}

.apply-btn:hover {
    filter: brightness(0.98);
}

.delete-icon {
    background: none;
    border: none;
    color: var(--app-danger);
    cursor: pointer;
    display: flex;
    align-items: center;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--app-border);
}

h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: var(--app-text-soft);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
