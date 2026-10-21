import { createClient } from '@libsql/client';

const DB_PATH = process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db';

async function main() {
  const c = createClient({ url: DB_PATH });

  console.log('=== DB:', DB_PATH);

  // 1) Snapshot BEFORE
  const before = await c.execute(
    `SELECT kind, COUNT(*) as n, COALESCE(categoryId,'(empty)') as cat FROM DecorItem GROUP BY kind, categoryId`
  );
  console.log('\n--- DecorItem BEFORE link ---');
  for (const r of before.rows) console.log('  ', r);

  const beforePf = await c.execute(
    `SELECT COUNT(*) as n, COALESCE(categoryId,'(empty)') as cat FROM PlayerFrame GROUP BY categoryId`
  );
  console.log('\n--- PlayerFrame BEFORE link ---');
  for (const r of beforePf.rows) console.log('  ', r);

  // 2) Run the same UPDATEs as linkExistingItemsToCategories()
  await c.execute(
    `UPDATE DecorItem SET categoryId = 'wall_hangings' WHERE kind = 'ornament' AND (categoryId IS NULL OR categoryId = '')`
  );
  await c.execute(
    `UPDATE DecorItem SET categoryId = 'themes' WHERE kind = 'theme' AND (categoryId IS NULL OR categoryId = '')`
  );
  await c.execute(
    `UPDATE DecorItem SET categoryId = 'profile_card' WHERE kind = 'card' AND (categoryId IS NULL OR categoryId = '')`
  );
  await c.execute(
    `UPDATE DecorItem SET visible = 'shown' WHERE visible IS NULL OR visible = ''`
  );
  await c.execute(
    `UPDATE DecorItem SET source = 'ours' WHERE source IS NULL OR source = ''`
  );
  await c.execute(
    `UPDATE PlayerFrame SET visible = 'shown' WHERE visible IS NULL OR visible = ''`
  );
  await c.execute(
    `UPDATE PlayerFrame SET source = 'ours' WHERE source IS NULL OR source = ''`
  );
  await c.execute(
    `UPDATE PlayerFrame SET categoryId = 'frames' WHERE categoryId IS NULL OR categoryId = ''`
  );
  await c.execute(
    `INSERT OR IGNORE INTO StoreCategory (id, nameAr, icon, layoutType, sortOrder, visible, redDotCondition)
     VALUES ('frames', 'الإطارات', '/yalla-ui/cart.png', 'frame_shop', 0, 1, '')`
  );

  // 3) Snapshot AFTER
  const after = await c.execute(
    `SELECT kind, COUNT(*) as n, COALESCE(categoryId,'(empty)') as cat FROM DecorItem GROUP BY kind, categoryId`
  );
  console.log('\n--- DecorItem AFTER link ---');
  for (const r of after.rows) console.log('  ', r);

  const afterPf = await c.execute(
    `SELECT COUNT(*) as n, COALESCE(categoryId,'(empty)') as cat FROM PlayerFrame GROUP BY categoryId`
  );
  console.log('\n--- PlayerFrame AFTER link ---');
  for (const r of afterPf.rows) console.log('  ', r);

  // 4) Show items per store category
  const cats = ['frames','wall_hangings','themes','profile_card','ludo_skin','entry_effects','jackaroo_skin'];
  console.log('\n--- Items per category (visible=shown, isActive=1) ---');
  for (const cat of cats) {
    const r1 = await c.execute({
      sql: `SELECT COUNT(*) as n FROM DecorItem WHERE categoryId=? AND COALESCE(visible,'shown')='shown' AND isActive=1`,
      args: [cat],
    });
    const n1 = (r1.rows[0] as Record<string, unknown>)?.n;
    let n2 = 0;
    if (cat === 'frames') {
      const r2 = await c.execute(
        `SELECT COUNT(*) as n FROM PlayerFrame WHERE COALESCE(visible,'shown')='shown' AND isActive=1`
      );
      n2 = (r2.rows[0] as Record<string, unknown>)?.n;
    }
    console.log(`  ${cat}: DecorItem=${n1} | PlayerFrame=${n2}`);
  }

  process.exit(0);
}

main().catch((e) => { console.error('FAIL:', e); process.exit(1); });
