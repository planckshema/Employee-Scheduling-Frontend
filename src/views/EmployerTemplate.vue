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

      // Map the current shifts to "Template Shifts" (no specific dates, just day of week)
      const templateShifts = this.currentWeekShifts.map(s => {
        const shiftDate = new Date(s.startDate + "T00:00:00");
        return {
          EmployeeID: s.EmployeeID,
          startTime: s.startTime,
          endTime: s.endTime,
          position: s.position,
          dayOfWeek: shiftDate.getDay() // 0 = Sun, 1 = Mon, etc.
        };
      });

      const payload = {
        name: name,
        shifts: templateShifts
      };

      TemplateServices.createTemplate(payload).then(() => {
        this.loadTemplates();
        alert("Template saved!");
      });
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
  background: rgba(0, 0, 0, 0.6); /* Slightly darker for better focus */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200; /* Ensure it's above the main calendar */
}

.modal {
  background: white !important; /* Forces solid background */
  background-color: #ffffff;
  border-radius: 8px;
  width: 500px;
  max-height: 85vh;
  padding: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  color: #3c4043;
}

.modal-body {
  overflow-y: auto;
  margin-top: 15px;
  padding-right: 5px;
}

/* UI Elements */
.full-width { width: 100%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.divider { margin: 20px 0; border: 0; border-top: 1px solid #eee; }

.template-list { list-style: none; padding: 0; margin: 0; }
.template-list li { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 14px; 
  border: 1px solid #e0e0e0; 
  margin-bottom: 10px;
  border-radius: 6px;
  transition: background 0.2s;
}
.template-list li:hover { background: #f8f9fa; }

.list-actions { display: flex; align-items: center; gap: 12px; }
.apply-btn { background: #34a853; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-weight: 500; }
.apply-btn:hover { background: #2d9249; }

.delete-icon { background: none; border: none; color: #d93025; cursor: pointer; display: flex; align-items: center; }

header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #eee; }
h3 { margin: 0 0 15px 0; font-size: 16px; color: #5f6368; text-transform: uppercase; letter-spacing: 0.5px; }
</style>