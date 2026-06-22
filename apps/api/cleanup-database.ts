/**
 * CLEANUP: Delete all prospects from database
 *
 * WARNING: DESTRUCTIVE OPERATION
 * This will delete all prospects and related data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('\n' + '═'.repeat(90));
  console.log('⚠️  DATABASE CLEANUP - DELETING ALL PROSPECTS');
  console.log('═'.repeat(90) + '\n');

  try {
    // Count before
    const countBefore = await prisma.prospect.count();
    console.log(`📊 Prospects before cleanup: ${countBefore}\n`);

    if (countBefore === 0) {
      console.log('✅ Database is already clean (0 prospects)');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Delete in order (respecting foreign keys)
    console.log('Deleting related data...');

    // Delete validation feedback
    const feedbackDeleted = await prisma.validationFeedback.deleteMany({});
    console.log(`  ✓ Deleted ${feedbackDeleted.count} validation feedbacks`);

    // Delete prospect validations
    const validationsDeleted = await prisma.prospectValidation.deleteMany({});
    console.log(`  ✓ Deleted ${validationsDeleted.count} prospect validations`);

    // Delete enrichment results
    const enrichmentDeleted = await prisma.enrichmentResult.deleteMany({});
    console.log(`  ✓ Deleted ${enrichmentDeleted.count} enrichment results`);

    // Delete enrichment jobs
    const enrichmentJobsDeleted = await prisma.enrichmentJob.deleteMany({});
    console.log(`  ✓ Deleted ${enrichmentJobsDeleted.count} enrichment jobs`);

    // Delete research jobs
    const researchJobsDeleted = await prisma.researchJob.deleteMany({});
    console.log(`  ✓ Deleted ${researchJobsDeleted.count} research jobs`);

    // Delete proposals
    const proposalsDeleted = await prisma.proposal.deleteMany({});
    console.log(`  ✓ Deleted ${proposalsDeleted.count} proposals`);

    // Delete outreach activities
    const outreachDeleted = await prisma.outreachActivity.deleteMany({});
    console.log(`  ✓ Deleted ${outreachDeleted.count} outreach activities`);

    // Delete deals
    const dealsDeleted = await prisma.deal.deleteMany({});
    console.log(`  ✓ Deleted ${dealsDeleted.count} deals`);

    // Delete deal stage history
    const dealHistoryDeleted = await prisma.dealStageHistory.deleteMany({});
    console.log(`  ✓ Deleted ${dealHistoryDeleted.count} deal stage histories`);

    // Finally, delete prospects
    console.log('\nDeleting prospects...');
    const prospectsDeleted = await prisma.prospect.deleteMany({});
    console.log(`  ✓ Deleted ${prospectsDeleted.count} prospects`);

    // Verify
    const countAfter = await prisma.prospect.count();
    console.log(`\n📊 Prospects after cleanup: ${countAfter}`);

    if (countAfter === 0) {
      console.log('\n✅ DATABASE CLEAN - All prospects deleted');
    } else {
      console.log('\n⚠️  WARNING: Some prospects remain');
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '═'.repeat(90) + '\n');
  process.exit(0);
}

// Run
cleanupDatabase();
