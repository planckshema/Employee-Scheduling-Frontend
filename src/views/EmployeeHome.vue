<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="mb-6">Employee Dashboard</h1>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <h3>Next Shift</h3>
          <p>Tuesday 2:00 PM - 5:00 PM</p>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <h3>Weekly Hours</h3>
          <p>12 / 20 hrs</p>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <h3>Pending Requests</h3>
          <p>1 request</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Upcoming Shift Detail -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card class="pa-6">
          <h2 class="mb-4">Upcoming Shift Details</h2>
          <p><strong>Position:</strong> Library Front Desk</p>
          <p><strong>Date:</strong> Tuesday</p>
          <p><strong>Time:</strong> 2:00 PM - 5:00 PM</p>
          <p><strong>Location:</strong> Main Library</p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card class="pa-6">
          <h2 class="mb-4">Quick Actions</h2>

          <v-btn class="mr-4" color="primary" @click="goToSchedule">
            View My Schedule
          </v-btn>

          <v-btn class="mr-4" color="secondary" @click="goToAvailability">
            Update Availability
          </v-btn>

          <v-btn color="error" @click="goToRequests"> Time Off Requests </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
