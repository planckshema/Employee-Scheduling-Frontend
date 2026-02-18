<template>
  <div class="employee-page">
    <section class="employee-card">
      <h1>Employee Dashboard</h1>
      <p>This is your employee view placeholder.</p>
      <button @click="$router.push({ name: 'employerDashboard' })">
        Switch to Employer View
      </button>
    </section>
  </div>
</template>

<script>
export default {
  name: "EmployeeDashboard",
};
</script>

<style scoped>
.employee-page {
  min-height: 100vh;
  background: #eef1f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.employee-card {
  background: #fff;
  border: 1px solid #dce1ec;
  border-radius: 14px;
  padding: 26px;
  width: 100%;
  max-width: 600px;
  text-align: center;
}

h1 {
  margin-bottom: 10px;
}

p {
  color: #60708a;
  margin-bottom: 14px;
}

button {
  border: 1px solid #060828;
  background: #060828;
  color: #fff;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 700;
}
</style>
