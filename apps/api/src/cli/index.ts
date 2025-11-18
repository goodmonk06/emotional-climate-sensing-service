#!/usr/bin/env node
// CLI tool for operational tasks
import { PrismaClient } from '@prisma/client';
import { createEmotionAnalyzer } from '../adapters';
import { IngestionService } from '../services/IngestionService';
import { AnalysisService } from '../services/AnalysisService';
import { ClimateService } from '../services/ClimateService';
import { CommunityService } from '../services/CommunityService';
import { AlertService } from '../services/AlertService';
import { config } from '../lib/config';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'analyze-community':
      await analyzeCommand(args[1]);
      break;

    case 'backfill':
      await backfillCommand(args[1], parseInt(args[2] || '7'));
      break;

    case 'test-alert':
      await testAlertCommand(args[1]);
      break;

    case 'stats':
      await statsCommand(args[1]);
      break;

    case 'cleanup':
      await cleanupCommand(parseInt(args[1] || '90'));
      break;

    case 'list-communities':
      await listCommunitiesCommand();
      break;

    default:
      printHelp();
      process.exit(1);
  }

  await prisma.$disconnect();
  process.exit(0);
}

async function analyzeCommand(communityId: string) {
  if (!communityId) {
    console.error('Error: Community ID is required');
    process.exit(1);
  }

  console.log(`Analyzing community: ${communityId}`);

  const analyzer = createEmotionAnalyzer(config.AI_PROVIDER, config.OPENAI_API_KEY);
  const analysisService = new AnalysisService(prisma, analyzer);
  const climateService = new ClimateService(prisma, analyzer);

  // Run analysis
  console.log('Processing unanalyzed signals...');
  const analysisResult = await analysisService.processBatch(100);
  console.log(`  Processed: ${analysisResult.processed}`);
  console.log(`  Failed: ${analysisResult.failed}`);

  // Create snapshot
  console.log('Creating climate snapshot...');
  const snapshot = await climateService.createSnapshot(communityId, config.SNAPSHOT_WINDOW_HOURS);
  console.log(`  Snapshot ID: ${snapshot.id}`);
  console.log(`  Sentiment: ${snapshot.aggregateSentiment.toFixed(3)}`);
  console.log(`  Signal Count: ${snapshot.signalCount}`);

  console.log('✓ Analysis complete');
}

async function backfillCommand(communityId: string, days: number) {
  if (!communityId) {
    console.error('Error: Community ID is required');
    process.exit(1);
  }

  console.log(`Backfilling ${days} days of data for community: ${communityId}`);
  console.log('Note: This is a placeholder. Implement backfill logic based on your requirements.');

  // TODO: Implement backfill logic
  // - Fetch historical signals
  // - Analyze if needed
  // - Generate snapshots for each day

  console.log('✓ Backfill complete (placeholder)');
}

async function testAlertCommand(ruleId: string) {
  if (!ruleId) {
    console.error('Error: Alert rule ID is required');
    process.exit(1);
  }

  console.log(`Testing alert rule: ${ruleId}`);

  const alertService = new AlertService(prisma);
  const rule = await alertService.getAlertRule(ruleId);

  console.log(`Rule: ${rule.name}`);
  console.log(`  Condition: ${rule.conditionType}`);
  console.log(`  Threshold: ${rule.threshold}`);
  console.log(`  Enabled: ${rule.enabled}`);

  // Get latest snapshot for the community
  const snapshot = await prisma.climateSnapshot.findFirst({
    where: { communityId: rule.communityId },
    orderBy: { windowEnd: 'desc' },
  });

  if (!snapshot) {
    console.log('  No snapshots found for this community');
    return;
  }

  console.log(`Latest snapshot sentiment: ${snapshot.aggregateSentiment.toFixed(3)}`);

  // Simple evaluation
  let wouldTrigger = false;
  switch (rule.conditionType) {
    case 'sentiment_below':
      wouldTrigger = snapshot.aggregateSentiment < rule.threshold;
      break;
    case 'sentiment_above':
      wouldTrigger = snapshot.aggregateSentiment > rule.threshold;
      break;
  }

  console.log(`  Would trigger: ${wouldTrigger ? 'YES' : 'NO'}`);

  console.log('✓ Alert test complete');
}

async function statsCommand(communityId?: string) {
  if (communityId) {
    console.log(`Statistics for community: ${communityId}\n`);

    const communityService = new CommunityService(prisma);
    const stats = await communityService.getCommunityStats(communityId);

    console.log(`Community: ${stats.community.name}`);
    console.log(`  Status: ${stats.community.status}`);
    console.log(`  Total Signals: ${stats.signalCount}`);
    console.log(`  Total Snapshots: ${stats.community._count.snapshots}`);
    console.log(`  Active Alert Rules: ${stats.community._count.alertRules}`);
    console.log(`  Active Alerts: ${stats.activeAlerts}`);

    if (stats.latestSnapshot) {
      console.log(`  Latest Sentiment: ${stats.latestSnapshot.aggregateSentiment.toFixed(3)}`);
      console.log(`  Last Snapshot: ${stats.latestSnapshot.windowEnd.toISOString()}`);
    }
  } else {
    console.log('Global Statistics\n');

    const totalCommunities = await prisma.communityProfile.count();
    const totalSignals = await prisma.rawSignal.count();
    const totalAnalyses = await prisma.emotionalAnalysis.count();
    const totalSnapshots = await prisma.climateSnapshot.count();
    const pendingAnalyses = totalSignals - totalAnalyses;

    console.log(`  Communities: ${totalCommunities}`);
    console.log(`  Total Signals: ${totalSignals}`);
    console.log(`  Analyzed Signals: ${totalAnalyses}`);
    console.log(`  Pending Analyses: ${pendingAnalyses}`);
    console.log(`  Total Snapshots: ${totalSnapshots}`);
  }

  console.log('\n✓ Stats retrieved');
}

async function cleanupCommand(olderThanDays: number) {
  console.log(`Cleaning up data older than ${olderThanDays} days`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  console.log(`  Cutoff date: ${cutoffDate.toISOString()}`);

  // Count what would be deleted
  const oldSignals = await prisma.rawSignal.count({
    where: { createdAt: { lt: cutoffDate } },
  });

  const oldSnapshots = await prisma.climateSnapshot.count({
    where: { createdAt: { lt: cutoffDate } },
  });

  console.log(`  Signals to archive: ${oldSignals}`);
  console.log(`  Snapshots to archive: ${oldSnapshots}`);

  console.log('\nNote: Actual deletion not implemented. Implement archival strategy first.');
  console.log('✓ Cleanup dry-run complete');
}

async function listCommunitiesCommand() {
  console.log('Communities:\n');

  const communityService = new CommunityService(prisma);
  const { communities } = await communityService.listCommunities({ limit: 100 });

  for (const community of communities) {
    console.log(`  ${community.id} - ${community.name}`);
    console.log(`    Status: ${community.status}`);
    console.log(`    Snapshots: ${community._count.snapshots}`);
    console.log(`    Alert Rules: ${community._count.alertRules}`);
    console.log('');
  }

  console.log(`Total: ${communities.length} communities`);
}

function printHelp() {
  console.log(`
Emotional Climate CLI

Usage:
  cli <command> [options]

Commands:
  analyze-community <id>           Force analysis and snapshot generation for a community
  backfill <communityId> <days>    Backfill historical snapshots (default: 7 days)
  test-alert <ruleId>              Test an alert rule configuration
  stats [communityId]              Show statistics (global or for specific community)
  cleanup <days>                   Archive data older than N days (default: 90)
  list-communities                 List all communities

Examples:
  cli analyze-community team-alpha
  cli backfill team-alpha 30
  cli test-alert rule-123
  cli stats team-alpha
  cli stats
  cli cleanup 90
  cli list-communities
`);
}

main().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});
