import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ============== SCHEMAS ==============

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

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    managingFaculty: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const MajorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String },
    description: { type: String },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  },
  { timestamps: true },
);

const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'VISIBLE', 'BLOCKED'],
      default: 'VISIBLE',
    },
    faculty: { type: String },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    documentType: { type: String },
    schoolYear: { type: String },
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'uploadDate', updatedAt: true } },
);

const PlatformStatsSchema = new mongoose.Schema({
  totalUploads: { type: Number, default: 0 },
  totalDownloads: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
});

const LogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true },
    targetId: { type: String },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } },
);

// ============== SEED DATA ==============

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(dbUrl);
  console.log('Connected to MongoDB\n');

  const User = mongoose.model('User', UserSchema);
  const Subject = mongoose.model('Subject', SubjectSchema);
  const Major = mongoose.model('Major', MajorSchema);
  const Doc = mongoose.model('Document', DocumentSchema);
  const PlatformStats = mongoose.model('PlatformStats', PlatformStatsSchema);
  const Log = mongoose.model('Log', LogSchema);

  // Hỏi xác nhận xóa dữ liệu cũ
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Major.deleteMany({});
  await Doc.deleteMany({});
  await PlatformStats.deleteMany({});
  await Log.deleteMany({});
  console.log('All collections cleared.\n');

  // ========= 1. USERS =========
  console.log('=== Seeding Users ===');
  const password = await bcrypt.hash('123456', 10);

  const users = await User.insertMany([
    {
      email: 'admin@unishare.com',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'System Admin',
      role: 'ADMIN',
    },
    {
      email: 'mod@st.phenikaa-uni.edu.vn',
      password,
      fullName: 'Nguyễn Văn Moderator',
      role: 'MODERATOR',
    },
    {
      email: 'huy@st.phenikaa-uni.edu.vn',
      password,
      fullName: 'Vũ Viết Huy',
      role: 'USER',
    },
    {
      email: 'minh@st.phenikaa-uni.edu.vn',
      password,
      fullName: 'Phạm Quang Minh',
      role: 'USER',
    },
    {
      email: 'quang@st.phenikaa-uni.edu.vn',
      password,
      fullName: 'Nguyễn Văn Quang',
      role: 'USER',
    },
    {
      email: 'tien@st.phenikaa-uni.edu.vn',
      password,
      fullName: 'Nguyễn Duy Tiến',
      role: 'USER',
    },
    {
      email: 'linh@st.phenikaa-uni.edu.vn',
      password,
      fullName: 'Hà Nguyễn Trúc Linh',
      role: 'USER',
    },
  ]);

  const admin = users[0];
  const mod = users[1];
  const sv1 = users[2];
  const sv2 = users[3];
  const sv3 = users[4];
  const sv4 = users[5];
  const sv5 = users[6];

  console.log(`  Created ${String(users.length)} users`);
  console.log('  Admin:     admin@unishare.com / admin123');
  console.log('  Moderator: mod@st.phenikaa-uni.edu.vn / 123456');
  console.log('  Students:  huy, minh, quang, tien, linh @st.phenikaa-uni.edu.vn / 123456\n');

  // ========= 2. SUBJECTS (Môn học) =========
  console.log('=== Seeding Subjects ===');
  const subjects = await Subject.insertMany([
    // Khoa CNTT (CSE)
    {
      name: 'Nhập môn lập trình',
      code: 'CSE101',
      managingFaculty: 'CSE',
    },
    {
      name: 'Cấu trúc dữ liệu và giải thuật',
      code: 'CSE201',
      managingFaculty: 'CSE',
    },
    {
      name: 'Cơ sở dữ liệu',
      code: 'CSE301',
      managingFaculty: 'CSE',
    },
    {
      name: 'Lập trình hướng đối tượng',
      code: 'CSE202',
      managingFaculty: 'CSE',
    },
    {
      name: 'Mạng máy tính',
      code: 'CSE302',
      managingFaculty: 'CSE',
    },
    {
      name: 'Phân tích và thiết kế phần mềm',
      code: 'CSE401',
      managingFaculty: 'CSE',
    },
    {
      name: 'Công nghệ phần mềm',
      code: 'CSE402',
      managingFaculty: 'CSE',
    },
    {
      name: 'Trí tuệ nhân tạo',
      code: 'CSE501',
      managingFaculty: 'CSE',
    },
    {
      name: 'Toán rời rạc',
      code: 'CSE703024',
      managingFaculty: 'CSE',
    },
    // Khoa Khoa học cơ bản
    {
      name: 'Giải tích 1',
      code: 'MATH101',
      managingFaculty: 'FFS',
    },
    {
      name: 'Giải tích 2',
      code: 'MATH102',
      managingFaculty: 'FFS',
    },
    {
      name: 'Đại số tuyến tính',
      code: 'MATH201',
      managingFaculty: 'FFS',
    },
    {
      name: 'Xác suất thống kê',
      code: 'MATH301',
      managingFaculty: 'FFS',
    },
    {
      name: 'Vật lý đại cương',
      code: 'PHY101',
      managingFaculty: 'FFS',
    },
    // Khoa Kinh tế
    {
      name: 'Kinh tế vi mô',
      code: 'ECO101',
      managingFaculty: 'FEB',
    },
    {
      name: 'Kinh tế vĩ mô',
      code: 'ECO102',
      managingFaculty: 'FEB',
    },
    // Khoa Ngoại ngữ
    {
      name: 'Tiếng Anh 1',
      code: 'ENG101',
      managingFaculty: 'FFL',
    },
    {
      name: 'Tiếng Anh 2',
      code: 'ENG102',
      managingFaculty: 'FFL',
    },
  ]);
  console.log(`  Created ${String(subjects.length)} subjects\n`);

  // ========= 3. MAJORS (Ngành học / Khoa) =========
  console.log('=== Seeding Majors ===');
  const cseSubjects = subjects.filter((s) => String(s.managingFaculty) === 'CSE');
  const ffsSubjects = subjects.filter((s) => String(s.managingFaculty) === 'FFS');
  const febSubjects = subjects.filter((s) => String(s.managingFaculty) === 'FEB');
  const fflSubjects = subjects.filter((s) => String(s.managingFaculty) === 'FFL');

  const majors = await Major.insertMany([
    {
      name: 'Công nghệ thông tin',
      code: 'CSE',
      description: 'Khoa Công nghệ thông tin - Đại học Phenikaa',
      subjects: [
        ...cseSubjects.map((s) => s._id),
        ...ffsSubjects.map((s) => s._id),
      ],
    },
    {
      name: 'Khoa học máy tính',
      code: 'CS',
      description: 'Ngành Khoa học máy tính - Đại học Phenikaa',
      subjects: cseSubjects.map((s) => s._id),
    },
    {
      name: 'Kinh tế',
      code: 'FEB',
      description: 'Khoa Kinh tế và Kinh doanh - Đại học Phenikaa',
      subjects: [
        ...febSubjects.map((s) => s._id),
        ...ffsSubjects.slice(0, 3).map((s) => s._id),
      ],
    },
    {
      name: 'Ngoại ngữ',
      code: 'FFL',
      description: 'Khoa Ngoại ngữ - Đại học Phenikaa',
      subjects: fflSubjects.map((s) => s._id),
    },
  ]);
  console.log(`  Created ${String(majors.length)} majors\n`);

  // ========= 4. DOCUMENTS (Tài liệu mẫu) =========
  console.log('=== Seeding Documents ===');

  const sampleDocs = [
    {
      title: 'Slide bài giảng Nhập môn lập trình - Chương 1',
      description: 'Giới thiệu về lập trình C/C++, biến, kiểu dữ liệu',
      subject: subjects[0]._id,
      uploader: sv1._id,
      documentType: 'Slide bài giảng',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 15,
      viewCount: 42,
    },
    {
      title: 'Đề thi giữa kỳ Cấu trúc dữ liệu 2024',
      description: 'Đề thi giữa kỳ kèm đáp án chi tiết',
      subject: subjects[1]._id,
      uploader: sv2._id,
      documentType: 'Đề thi',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 89,
      viewCount: 200,
    },
    {
      title: 'Tổng hợp lý thuyết Cơ sở dữ liệu',
      description: 'Tóm tắt toàn bộ lý thuyết CSDL: ER, SQL, chuẩn hóa',
      subject: subjects[2]._id,
      uploader: sv3._id,
      documentType: 'Tài liệu tổng hợp',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 56,
      viewCount: 130,
    },
    {
      title: 'Bài tập OOP Java có lời giải',
      description: 'Bài tập lập trình hướng đối tượng Java kèm lời giải',
      subject: subjects[3]._id,
      uploader: sv1._id,
      documentType: 'Bài tập',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 34,
      viewCount: 78,
    },
    {
      title: 'Đề cương ôn tập Mạng máy tính',
      description: 'Đề cương chi tiết cho kỳ thi cuối kỳ',
      subject: subjects[4]._id,
      uploader: sv4._id,
      documentType: 'Đề cương',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 23,
      viewCount: 67,
    },
    {
      title: 'Báo cáo đồ án Phân tích thiết kế phần mềm',
      description: 'Báo cáo nhóm 8 - Hệ thống chia sẻ tài liệu UniShare',
      subject: subjects[5]._id,
      uploader: sv1._id,
      documentType: 'Báo cáo',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 12,
      viewCount: 35,
    },
    {
      title: 'Slide Trí tuệ nhân tạo - Machine Learning',
      description: 'Bài giảng về các thuật toán ML cơ bản',
      subject: subjects[7]._id,
      uploader: sv5._id,
      documentType: 'Slide bài giảng',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 45,
      viewCount: 112,
    },
    {
      title: 'Cheat sheet Toán rời rạc',
      description: 'Tóm tắt công thức tổ hợp, đồ thị, logic',
      subject: subjects[8]._id,
      uploader: sv2._id,
      documentType: 'Tài liệu tổng hợp',
      faculty: 'CSE',
      schoolYear: '2024-2025',
      downloadCount: 67,
      viewCount: 155,
    },
    {
      title: 'Đề thi cuối kỳ Giải tích 1 (5 năm)',
      description: 'Tổng hợp đề thi cuối kỳ Giải tích 1 từ 2019-2024',
      subject: subjects[9]._id,
      uploader: sv3._id,
      documentType: 'Đề thi',
      faculty: 'FFS',
      schoolYear: '2024-2025',
      downloadCount: 120,
      viewCount: 310,
    },
    {
      title: 'Công thức Xác suất thống kê',
      description: 'Tổng hợp công thức cần nhớ cho kỳ thi',
      subject: subjects[12]._id,
      uploader: sv4._id,
      documentType: 'Tài liệu tổng hợp',
      faculty: 'FFS',
      schoolYear: '2024-2025',
      downloadCount: 78,
      viewCount: 190,
    },
    {
      title: 'Slide Kinh tế vi mô - Chương 1-5',
      description: 'Slide bài giảng cung cầu, co giãn, thị trường',
      subject: subjects[14]._id,
      uploader: sv5._id,
      documentType: 'Slide bài giảng',
      faculty: 'FEB',
      schoolYear: '2024-2025',
      downloadCount: 19,
      viewCount: 45,
    },
    {
      title: 'Vocabulary Tiếng Anh 1 - Unit 1-6',
      description: 'Danh sách từ vựng theo từng unit',
      subject: subjects[16]._id,
      uploader: sv2._id,
      documentType: 'Tài liệu tổng hợp',
      faculty: 'FFL',
      schoolYear: '2024-2025',
      downloadCount: 30,
      viewCount: 85,
    },
  ];

  const docs = await Doc.insertMany(
    sampleDocs.map((d) => ({
      ...d,
      fileUrl: `http://localhost:8000/uploads/sample-${String(Math.random()).slice(2, 10)}.pdf`,
      filePath: `uploads/sample-${String(Math.random()).slice(2, 10)}.pdf`,
      fileType: 'application/pdf',
      fileSize: Math.floor(Math.random() * 5000000) + 500000,
      status: 'VISIBLE',
    })),
  );
  console.log(`  Created ${String(docs.length)} documents\n`);

  // Cập nhật uploadsCount cho các user
  const uploaderCounts: Record<string, number> = {};
  for (const doc of sampleDocs) {
    const id = String(doc.uploader);
    uploaderCounts[id] = (uploaderCounts[id] || 0) + 1;
  }
  for (const [userId, count] of Object.entries(uploaderCounts)) {
    await User.updateOne({ _id: userId }, { uploadsCount: count });
  }

  // ========= 5. PLATFORM STATS =========
  console.log('=== Seeding Platform Stats ===');
  const totalDownloads = sampleDocs.reduce(
    (sum, d) => sum + (d.downloadCount || 0),
    0,
  );
  await PlatformStats.create({
    totalUploads: docs.length,
    totalDownloads,
    activeUsers: users.length,
  });
  console.log(
    `  Stats: ${String(docs.length)} uploads, ${String(totalDownloads)} downloads, ${String(users.length)} active users\n`,
  );

  // ========= 6. LOGS =========
  console.log('=== Seeding Logs ===');
  await Log.insertMany([
    { actor: admin._id, action: 'SYSTEM_SEED', targetId: 'database' },
    {
      actor: mod._id,
      action: 'REVIEW_DOCUMENT',
      targetId: String(docs[0]._id),
    },
  ]);
  console.log('  Created 2 sample logs\n');

  // ========= DONE =========
  console.log('========================================');
  console.log('  DATABASE SEEDED SUCCESSFULLY!');
  console.log('========================================');
  console.log('');
  console.log('Accounts:');
  console.log('  Admin:     admin@unishare.com / admin123');
  console.log('  Moderator: mod@st.phenikaa-uni.edu.vn / 123456');
  console.log('  Students:  huy, minh, quang, tien, linh');
  console.log('             @st.phenikaa-uni.edu.vn / 123456');
  console.log('');
  console.log(`Collections: ${String(users.length)} users, ${String(subjects.length)} subjects, ${String(majors.length)} majors, ${String(docs.length)} documents`);

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
