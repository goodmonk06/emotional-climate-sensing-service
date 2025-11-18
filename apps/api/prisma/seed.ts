// Seed database with sample data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const syntheticSignals = [
  // Positive signals
  { text: "This is amazing! I'm so excited about the progress we're making!", sentiment: 'positive', community: 'team-alpha' },
  { text: "Great work everyone! Really proud of what we've accomplished.", sentiment: 'positive', community: 'team-alpha' },
  { text: "I love how supportive this community is. Thank you all!", sentiment: 'positive', community: 'team-alpha' },
  { text: "Fantastic presentation today! Looking forward to the next steps.", sentiment: 'positive', community: 'team-bravo' },
  { text: "The new features are working perfectly. Well done team!", sentiment: 'positive', community: 'team-bravo' },

  // Negative signals
  { text: "I'm really frustrated with the current situation. Nothing seems to be working.", sentiment: 'negative', community: 'team-alpha' },
  { text: "This is disappointing. We need to address these issues urgently.", sentiment: 'negative', community: 'team-alpha' },
  { text: "Feeling quite anxious about the upcoming deadline. Not sure we'll make it.", sentiment: 'negative', community: 'team-bravo' },
  { text: "The bugs are piling up and it's getting overwhelming.", sentiment: 'negative', community: 'team-bravo' },

  // Neutral/Mixed signals
  { text: "Meeting scheduled for tomorrow at 2pm. Please confirm attendance.", sentiment: 'neutral', community: 'team-alpha' },
  { text: "We made some progress but there's still a lot of work to do.", sentiment: 'neutral', community: 'team-alpha' },
  { text: "The new system has pros and cons. Need to evaluate further.", sentiment: 'neutral', community: 'team-bravo' },
  { text: "Update: Project is on track, though we had some minor setbacks.", sentiment: 'neutral', community: 'team-bravo' },

  // More positive
  { text: "Incredible breakthrough today! This changes everything for the better.", sentiment: 'positive', community: 'team-charlie' },
  { text: "I'm grateful to be part of such an innovative team.", sentiment: 'positive', community: 'team-charlie' },
  { text: "The collaboration here is outstanding. Keep it up!", sentiment: 'positive', community: 'team-charlie' },

  // More negative
  { text: "Concerned about the direction we're heading. We need to reconsider.", sentiment: 'negative', community: 'team-charlie' },
  { text: "The lack of communication is causing serious problems.", sentiment: 'negative', community: 'team-charlie' },

  // Recent signals (last few hours)
  { text: "Just wrapped up a productive session! Feeling energized.", sentiment: 'positive', community: 'team-alpha', hoursAgo: 1 },
  { text: "Quick question: has anyone seen the latest report?", sentiment: 'neutral', community: 'team-alpha', hoursAgo: 2 },
  { text: "Struggling with this implementation. Could use some help.", sentiment: 'negative', community: 'team-bravo', hoursAgo: 3 },
  { text: "Success! Finally got it working. Thanks for the support!", sentiment: 'positive', community: 'team-bravo', hoursAgo: 4 },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create signal sources
  const chatSource = await prisma.signalSource.upsert({
    where: { key: 'chat-platform-1' },
    update: {},
    create: {
      key: 'chat-platform-1',
      name: 'Primary Chat Platform',
      description: 'Main team communication channel',
      sourceType: 'chat',
      metaJson: { platform: 'slack' }
    }
  });

  const forumSource = await prisma.signalSource.upsert({
    where: { key: 'forum-1' },
    update: {},
    create: {
      key: 'forum-1',
      name: 'Community Forum',
      description: 'Public discussion forum',
      sourceType: 'forum',
      metaJson: { platform: 'discourse' }
    }
  });

  const surveySource = await prisma.signalSource.upsert({
    where: { key: 'survey-tool-1' },
    update: {},
    create: {
      key: 'survey-tool-1',
      name: 'Pulse Survey',
      description: 'Weekly team pulse check',
      sourceType: 'survey',
      metaJson: { frequency: 'weekly' }
    }
  });

  console.log('✅ Created signal sources');

  // Create raw signals
  const now = new Date();
  let signalCount = 0;

  for (const signal of syntheticSignals) {
    const hoursAgo = signal.hoursAgo || Math.floor(Math.random() * 48); // Random within last 48 hours
    const ts = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    await prisma.rawSignal.create({
      data: {
        sourceId: chatSource.id,
        communityId: signal.community,
        externalMessageId: `msg-${Date.now()}-${signalCount}`,
        authorRef: `user-${Math.floor(Math.random() * 10)}`,
        text: signal.text,
        ts,
        metaJson: { sentiment: signal.sentiment }
      }
    });

    signalCount++;
  }

  console.log(`✅ Created ${signalCount} raw signals`);

  // Get analyzer info
  console.log('');
  console.log('📊 Database seeded successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run analysis: POST /api/analysis/process');
  console.log('2. Create snapshots: POST /api/communities/team-alpha/climate/snapshot');
  console.log('3. View results: GET /api/communities/team-alpha/climate/latest');
  console.log('');
  console.log('Available communities:');
  console.log('  - team-alpha');
  console.log('  - team-bravo');
  console.log('  - team-charlie');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
