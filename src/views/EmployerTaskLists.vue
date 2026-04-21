<template>
  <section class="tab-content">
    <div class="toolbar-row">
      <div>
        <h2>Task Lists</h2>
        <p class="muted">Create task lists to assign to employee shifts</p>
      </div>
      <button class="primary-button" @click="openCreateDialog">
        <v-icon size="18">mdi-plus</v-icon>
        New Task List
      </button>
    </div>

    <div class="cards-grid">
      <article v-for="list in taskLists" :key="list.taskListId" class="card">
        <div class="card-top">
          <div>
            <h3>{{ list.name }}</h3>
            <p class="muted">{{ list.description }}</p>
          </div>
          <div class="card-actions">
            <button class="icon-inline" @click="openEditDialog(list)">
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </button>
            <button class="icon-inline danger" @click="removeTaskList(list)">
              <v-icon size="18">mdi-delete-outline</v-icon>
            </button>
          </div>
        </div>
        <ul class="task-items">
          <li v-for="item in list.items" :key="item">
            <input type="checkbox" disabled />
            {{ item }}
          </li>
        </ul>
        <div class="card-footer">
          <span class="mini-tag">{{ list.items.length }} tasks</span>
          <small>{{ formatDate(list.date) }}</small>
        </div>
      </article>
    </div>

    <div v-if="createTaskListDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>Create Task List</h2>
          <button class="icon-inline" @click="createTaskListDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>List Name</label>
        <input
          v-model="createForm.name"
          type="text"
          placeholder="e.g., Opening Duties"
        />
        <label>Description</label>
        <textarea
          v-model="createForm.description"
          placeholder="Brief description of this task list"
        ></textarea>
        <div class="inline-head">
          <label>Tasks</label>
          <button class="ghost-button" @click="addCreateTaskField">
            <v-icon size="18">mdi-plus</v-icon>Add Task
          </button>
        </div>
        <div
          v-for="(item, index) in createForm.items"
          :key="`new-${index}`"
          class="task-row"
        >
          <span>{{ index + 1 }}.</span>
          <input
            v-model="createForm.items[index]"
            type="text"
            placeholder="Task description"
          />
          <button class="icon-inline" @click="removeCreateTaskField(index)">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <footer>
          <button class="ghost-button" @click="createTaskListDialog = false">
            Cancel
          </button>
          <button class="primary-button" @click="createTaskList">
            Create Task List
          </button>
        </footer>
      </section>
    </div>

    <div v-if="editTaskListDialog" class="overlay">
      <section class="modal">
        <header>
          <h2>Edit Task List</h2>
          <button class="icon-inline" @click="editTaskListDialog = false">
            <v-icon>mdi-close</v-icon>
          </button>
        </header>
        <label>List Name</label>
        <input v-model="editForm.name" type="text" />
        <label>Description</label>
        <textarea v-model="editForm.description"></textarea>
        <div class="inline-head">
          <label>Tasks</label>
          <button class="ghost-button" @click="addEditTaskField">
            <v-icon size="18">mdi-plus</v-icon>Add Task
          </button>
        </div>
        <div
          v-for="(item, index) in editForm.items"
          :key="`edit-${index}`"
          class="task-row"
        >
          <span>{{ index + 1 }}.</span>
          <input v-model="editForm.items[index]" type="text" />
          <button class="icon-inline" @click="removeEditTaskField(index)">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <footer>
          <button class="ghost-button" @click="editTaskListDialog = false">
            Cancel
          </button>
          <button class="primary-button" @click="saveTaskList">
            Save Changes
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script>
import SchedulerServices from "@/services/schedulerServices";

export default {
  name: "EmployerTaskLists",
  data() {
    return {
      createTaskListDialog: false,
      editTaskListDialog: false,
      taskLists: [],
      createForm: {
        name: "",
        description: "",
        items: [""],
      },
      editForm: {
        taskListId: null,
        name: "",
        description: "",
        items: [""],
      },
    };
  },
  created() {
    this.fetchTaskLists();
  },
  methods: {
    fetchTaskLists() {
      SchedulerServices.getTaskLists()
        .then((response) => {
          this.taskLists = response.data || [];
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    formatDate(value) {
      if (!value) {
        return "";
      }
      return new Date(value).toLocaleDateString();
    },
    openCreateDialog() {
      this.createForm = { name: "", description: "", items: [""] };
      this.createTaskListDialog = true;
    },
    addCreateTaskField() {
      this.createForm.items.push("");
    },
    removeCreateTaskField(index) {
      if (this.createForm.items.length === 1) {
        this.createForm.items[0] = "";
        return;
      }
      this.createForm.items.splice(index, 1);
    },
    createTaskList() {
      if (!this.createForm.name.trim()) {
        return;
      }

      SchedulerServices.createTaskList({
        name: this.createForm.name.trim(),
        description: this.createForm.description.trim(),
        items: this.createForm.items.map((item) => item.trim()).filter(Boolean),
      })
        .then(() => {
          this.createTaskListDialog = false;
          this.fetchTaskLists();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    openEditDialog(list) {
      this.editForm = {
        taskListId: list.taskListId,
        name: list.name,
        description: list.description,
        items: list.items.length ? [...list.items] : [""],
      };
      this.editTaskListDialog = true;
    },
    addEditTaskField() {
      this.editForm.items.push("");
    },
    removeEditTaskField(index) {
      if (this.editForm.items.length === 1) {
        this.editForm.items[0] = "";
        return;
      }
      this.editForm.items.splice(index, 1);
    },
    saveTaskList() {
      if (!this.editForm.taskListId || !this.editForm.name.trim()) {
        return;
      }

      SchedulerServices.updateTaskList(this.editForm.taskListId, {
        name: this.editForm.name.trim(),
        description: this.editForm.description.trim(),
        items: this.editForm.items.map((item) => item.trim()).filter(Boolean),
      })
        .then(() => {
          this.editTaskListDialog = false;
          this.fetchTaskLists();
        })
        .catch((error) => {
          console.log("error", error);
        });
    },
    removeTaskList(list) {
      SchedulerServices.deleteTaskList(list.taskListId)
        .then(() => {
          this.fetchTaskLists();
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
  padding: 0 20px 28px;
}

h2 {
  margin: 0;
  font-size: 22px;
  color: var(--app-text);
}

h3 {
  margin-bottom: 4px;
  color: var(--app-text);
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}

.card {
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  padding: 16px;
  box-shadow: var(--app-shadow-sm);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.task-items {
  list-style: none;
  padding: 0;
  margin: 8px 0 12px;
}

.task-items li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: var(--app-text-soft);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--app-border);
  padding-top: 8px;
}

.mini-tag {
  background: rgba(123, 201, 111, 0.18);
  color: var(--app-primary);
  border-radius: 999px;
  padding: 3px 9px;
  font-weight: 700;
  font-size: 12px;
}

.muted {
  color: var(--app-text-soft);
}

.icon-inline {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  border-radius: 12px;
  width: 38px;
  height: 38px;
  box-shadow: 0 10px 18px rgba(36, 74, 46, 0.05);
}

.icon-inline.danger {
  color: var(--app-danger);
}

.ghost-button,
.primary-button {
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-button {
  border-color: var(--app-primary-deep);
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-secondary) 100%);
  color: #fff;
  box-shadow: 0 16px 28px rgba(47, 107, 63, 0.18);
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(24, 44, 30, 0.46);
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 900px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  border: 1px solid var(--app-border);
  border-radius: 24px;
  padding: 24px;
  max-height: 94vh;
  overflow-y: auto;
  box-shadow: var(--app-shadow-lg);
}

.modal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal label {
  font-size: 15px;
  font-weight: 700;
  margin-top: 10px;
  margin-bottom: 6px;
  display: inline-block;
  color: var(--app-text);
}

.modal input,
.modal textarea {
  width: 100%;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  border-radius: 16px;
  min-height: 50px;
  padding: 11px 16px;
  margin-bottom: 6px;
  color: var(--app-text);
}

.modal textarea {
  min-height: 110px;
  resize: vertical;
}

.modal input:focus,
.modal textarea:focus {
  border-color: var(--app-primary);
  background: var(--app-surface);
  box-shadow: 0 0 0 4px rgba(79, 155, 88, 0.12);
  outline: none;
}

.modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.inline-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.task-row {
  display: grid;
  grid-template-columns: 32px 1fr 38px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

@media (max-width: 980px) {
  .tab-content {
    padding: 0 14px 16px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
