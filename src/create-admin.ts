import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    role: {
      type: String,
      enum: ['USER', 'MODERATOR', 'ADMIN'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
    uploadsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'joinedDate', updatedAt: true } },
);

async function createAdmin() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(dbUrl);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', UserSchema);

  const adminEmail = 'admin@unishare.com';
  const adminPassword = 'admin123';

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log('Admin account already exists:', adminEmail);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await User.create({
    email: adminEmail,
    password: hashedPassword,
    fullName: 'System Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  console.log('Admin account created successfully!');
  console.log('  Email:   ', String(admin.email));
  console.log('  Password:', adminPassword);
  console.log('  Role:    ', String(admin.role));

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

createAdmin().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
