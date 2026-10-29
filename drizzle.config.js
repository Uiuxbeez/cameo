import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect:'postgresql', schema:'./server/schema.js', out:'./server/migrations', schemaFilter:['cameo_cms'] });
