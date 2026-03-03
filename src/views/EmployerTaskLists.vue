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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 14px;
}

.card {
  border: 1px solid #dce1ec;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
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
  color: #4e5c77;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #e8ebf2;
  padding-top: 8px;
}

.mini-tag {
  background: #eceff5;
  border-radius: 14px;
  padding: 3px 9px;
  font-weight: 700;
  font-size: 12px;
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

.icon-inline.danger {
  color: #e53935;
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
.modal textarea {
  width: 100%;
  border: none;
  background: #f1f2f7;
  border-radius: 12px;
  min-height: 52px;
  padding: 11px 16px;
  outline: none;
  margin-bottom: 6px;
}

.modal textarea {
  min-height: 92px;
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
