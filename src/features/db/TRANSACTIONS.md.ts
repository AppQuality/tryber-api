/**
 * Transactions Support in Tryber API
 *
 * This file provides examples of how to use Knex transactions in the codebase.
 * Transactions ensure that multiple database operations are executed atomically:
 * either all succeed or all are rolled back.
 */

import * as db from "@src/features/db";
import { tryber } from "@src/features/database";

/**
 * Example 1: Using db.transaction() helper with raw queries
 *
 * The transaction() helper automatically handles commit/rollback:
 * - If the callback completes successfully, the transaction is committed
 * - If an error is thrown, the transaction is rolled back
 */
export async function exampleRawQueries() {
  await db.transaction(async (trx) => {
    // Execute multiple queries in the same transaction
    await db.query("INSERT INTO users (name) VALUES ('John')", trx);
    await db.query(
      "INSERT INTO profiles (user_id, bio) VALUES (1, 'Bio')",
      trx
    );

    // If any query fails, all changes are rolled back
  });
}

/**
 * Example 2: Using transactions with Database class
 *
 * All methods in the Database class now accept an optional `trx` parameter
 */
export async function exampleDatabaseClass() {
  const Experience = new (
    await import("@src/features/db/class/Experience")
  ).default();

  await db.transaction(async (trx) => {
    // Insert operations within a transaction
    const result1 = await Experience.insert(
      {
        tester_id: 1,
        amount: 100,
        creation_date: new Date().toISOString(),
        activity_id: 1,
        reason: "Campaign participation",
        campaign_id: 1,
        pm_id: 1,
      },
      trx
    );

    const result2 = await Experience.insert(
      {
        tester_id: 1,
        amount: 50,
        creation_date: new Date().toISOString(),
        activity_id: 2,
        reason: "Bug report",
        campaign_id: 1,
        pm_id: 1,
      },
      trx
    );

    // Query within the same transaction
    const records = await Experience.query({
      where: [{ tester_id: 1 }],
      trx,
    });

    // Update within the same transaction
    await Experience.update({
      data: { amount: 150 },
      where: [{ id: result1.insertId }],
      trx,
    });

    // Delete within the same transaction
    await Experience.delete([{ id: result2.insertId }], trx);
  });
}

/**
 * Example 3: Using transactions with tryber tables (Knex query builder)
 *
 * You can also use the tryber instance directly with transactions
 */
export async function exampleKnexQueryBuilder() {
  await db.transaction(async (trx) => {
    // Using Knex query builder with transaction
    await tryber.tables.WpUsers.do().transacting(trx).insert({
      ID: 123,
      user_login: "test_user",
      user_email: "test@example.com",
    });

    // Multiple operations in the same transaction
    const user = await tryber.tables.WpUsers.do()
      .transacting(trx)
      .where({ user_email: "test@example.com" })
      .first();

    if (user) {
      await tryber.tables.WpAppqEvdProfile.do().transacting(trx).insert({
        wp_user_id: user.ID,
        id: 1,
        email: user.user_email,
        education_id: 1,
        employment_id: 1,
      });
    }
  });
}

/**
 * Example 4: Error handling and rollback
 *
 * When an error occurs, the transaction is automatically rolled back
 */
export async function exampleErrorHandling() {
  try {
    await db.transaction(async (trx) => {
      await db.query("INSERT INTO users (name) VALUES ('John')", trx);

      // This will cause an error and rollback all changes
      throw new Error("Something went wrong");

      // This line will never be executed
      await db.query(
        "INSERT INTO profiles (user_id, bio) VALUES (1, 'Bio')",
        trx
      );
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    // All database changes have been rolled back
  }
}

/**
 * Example 5: Mixed usage - transaction with both Database class and raw queries
 */
export async function exampleMixedUsage() {
  const Experience = new (
    await import("@src/features/db/class/Experience")
  ).default();

  await db.transaction(async (trx) => {
    // Use Database class
    const expResult = await Experience.insert(
      {
        tester_id: 1,
        amount: 100,
        creation_date: new Date().toISOString(),
        activity_id: 1,
        reason: "Test",
        campaign_id: 1,
        pm_id: 1,
      },
      trx
    );

    // Use raw query
    await db.query(
      `UPDATE wp_appq_user SET total_exp = total_exp + 100 WHERE id = 1`,
      trx
    );

    // Use Knex query builder
    await tryber.tables.WpAppqEventTransactionalMail.do()
      .transacting(trx)
      .insert({
        event_name: "experience_added",
        template_id: 1,
        last_editor_tester_id: 1,
      });
  });
}

/**
 * IMPORTANT NOTES:
 *
 * 1. Always pass the `trx` parameter to ALL database operations within the transaction
 * 2. Don't mix transactional and non-transactional operations in the same logical flow
 * 3. Keep transactions short to avoid locking issues
 * 4. The transaction is automatically committed if the callback completes without errors
 * 5. The transaction is automatically rolled back if an error is thrown
 * 6. All methods are backward compatible - the `trx` parameter is optional
 */
