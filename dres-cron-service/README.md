# DRES Cron Service

A scalable cron job service for the DRES application that handles scheduled tasks like draft reminders, analytics reports, and cleanup jobs.

## Structure

```
cron-service/
├── src/
│   ├── index.js          # Main entry point
│   ├── jobs/             # Individual cron jobs
│   │   ├── draftReminder.js
│   │   ├── analyticsReport.js
│   │   └── cleanup.js
│   └── utils/            # Shared utilities
│       ├── apiClient.js  # API communication
│       ├── jobLoader.js  # Dynamic job loading
│       └── logger.js     # Logging utilities
├── package.json
├── .env.example
└── README.md
```

## Adding New Jobs

1. Create a new file in `src/jobs/` (e.g., `myNewJob.js`)
2. Export an object with the required structure:

```javascript
module.exports = {
  name: 'my-new-job',
  description: 'Description of what this job does',
  schedule: '0 0 * * *', // Cron schedule
  
  async handler() {
    // Your job logic here
    return { success: true, message: 'Job completed' };
  }
};
```

The job will be automatically loaded and scheduled!

## Cron Schedule Examples

- `'* * * * *'` - Every minute (testing)
- `'0 0 * * *'` - Daily at midnight UTC
- `'0 6 * * *'` - Daily at 6 AM UTC
- `'0 2 * * 0'` - Weekly on Sunday at 2 AM UTC
- `'0 0 1 * *'` - Monthly on the 1st at midnight

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `API_URL` - DRES API base URL
- `CRON_SECRET` - Secret for authenticating with API

## Running

```bash
npm install
npm start
```