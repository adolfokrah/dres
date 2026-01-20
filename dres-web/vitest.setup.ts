// Any setup scripts you might need go here

// Load .env.test for integration tests (uses separate test database)
import { config } from 'dotenv'
config({ path: '.env.test' })
