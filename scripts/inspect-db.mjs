import {pool} from '../server/db.js';
try {const result=await pool.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')");console.log(JSON.stringify(result.rows));}
catch(e){console.error('Database inspection failed:',e.code||e.name);process.exitCode=1;}
finally{await pool.end();}
