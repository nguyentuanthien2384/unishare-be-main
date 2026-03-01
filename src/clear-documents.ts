import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function clearDocuments() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
  }

  await mongoose.connect(dbUrl);
  console.log('Connected to MongoDB\n');

  const result = await mongoose.connection
    .collection('documents')
    .deleteMany({});
  console.log(`Deleted ${result.deletedCount} documents from database`);

  await mongoose.connection
    .collection('platformstats')
    .updateMany({}, { $set: { totalUploads: 0, totalDownloads: 0 } });
  console.log('Reset platform stats (uploads=0, downloads=0)');

  await mongoose.connection
    .collection('users')
    .updateMany({}, { $set: { uploadsCount: 0, downloadsCount: 0 } });
  console.log('Reset all user upload/download counts');

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedFiles = 0;
    for (const file of files) {
      if (file === '.gitkeep') continue;
      fs.unlinkSync(path.join(uploadsDir, file));
      deletedFiles++;
    }
    console.log(`Deleted ${deletedFiles} files from uploads/`);
  }

  await mongoose.disconnect();
  console.log('\nDone! All documents cleared.');
}

clearDocuments().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
