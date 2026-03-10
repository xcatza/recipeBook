import Database from 'better-sqlite3';

const db = new Database('./dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite%'").all();
console.log('Tables:', tables.map(t => t.name));

for (const table of ['TagsOnRecipes', 'Ingredient', 'Recipe', 'Tag']) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM "${table}"`).get();
  console.log(`${table}: ${count.c} rows`);
  db.prepare(`DELETE FROM "${table}"`).run();
}

console.log('Cleared all data from dev.db');
db.close();
