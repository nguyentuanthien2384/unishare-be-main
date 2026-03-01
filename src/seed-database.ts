import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['USER', 'MODERATOR', 'ADMIN'], default: 'USER' },
    status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
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
    filePath: { type: String },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PROCESSING', 'VISIBLE', 'BLOCKED'], default: 'VISIBLE' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
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
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    details: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

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
  const Stats = mongoose.model('PlatformStats', PlatformStatsSchema);
  const Log = mongoose.model('Log', LogSchema);

  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Major.deleteMany({});
  await Doc.deleteMany({});
  await Stats.deleteMany({});
  await Log.deleteMany({});
  console.log('All collections cleared.\n');

  // 1. USERS
  console.log('=== Seeding Users ===');
  const pw = await bcrypt.hash('123456', 10);
  const users = await User.insertMany([
    { email: 'admin@unishare.com', password: await bcrypt.hash('admin123', 10), fullName: 'System Admin', role: 'ADMIN' },
    { email: 'mod@st.phenikaa-uni.edu.vn', password: pw, fullName: 'Nguyễn Văn Moderator', role: 'MODERATOR' },
    { email: 'huy@st.phenikaa-uni.edu.vn', password: pw, fullName: 'Vũ Viết Huy' },
    { email: 'minh@st.phenikaa-uni.edu.vn', password: pw, fullName: 'Phạm Quang Minh' },
    { email: 'quang@st.phenikaa-uni.edu.vn', password: pw, fullName: 'Nguyễn Văn Quang' },
    { email: 'tien@st.phenikaa-uni.edu.vn', password: pw, fullName: 'Nguyễn Duy Tiến' },
    { email: 'linh@st.phenikaa-uni.edu.vn', password: pw, fullName: 'Hà Nguyễn Trúc Linh' },
  ]);
  const [admin, mod, sv1, sv2, sv3, sv4, sv5] = users;
  console.log(`  Created ${String(users.length)} users\n`);

  // 2. SUBJECTS
  console.log('=== Seeding Subjects ===');
  const subjects = await Subject.insertMany([
    { name: 'Nhập môn lập trình', code: 'CSE101', managingFaculty: 'CNTT' },
    { name: 'Cấu trúc dữ liệu và giải thuật', code: 'CSE201', managingFaculty: 'CNTT' },
    { name: 'Cơ sở dữ liệu', code: 'CSE301', managingFaculty: 'CNTT' },
    { name: 'Lập trình hướng đối tượng', code: 'CSE202', managingFaculty: 'CNTT' },
    { name: 'Mạng máy tính', code: 'CSE302', managingFaculty: 'CNTT' },
    { name: 'Phân tích và thiết kế phần mềm', code: 'CSE401', managingFaculty: 'CNTT' },
    { name: 'Công nghệ phần mềm', code: 'CSE402', managingFaculty: 'CNTT' },
    { name: 'Trí tuệ nhân tạo', code: 'CSE501', managingFaculty: 'CNTT' },
    { name: 'Toán rời rạc', code: 'CSE703024', managingFaculty: 'CNTT' },
    { name: 'Giải tích 1', code: 'MATH101', managingFaculty: 'KHCB' },
    { name: 'Giải tích 2', code: 'MATH102', managingFaculty: 'KHCB' },
    { name: 'Đại số tuyến tính', code: 'MATH201', managingFaculty: 'KHCB' },
    { name: 'Xác suất thống kê', code: 'MATH301', managingFaculty: 'KHCB' },
    { name: 'Vật lý đại cương', code: 'PHY101', managingFaculty: 'KHCB' },
    { name: 'Kinh tế vi mô', code: 'ECO101', managingFaculty: 'KTQT' },
    { name: 'Kinh tế vĩ mô', code: 'ECO102', managingFaculty: 'KTQT' },
    { name: 'Tiếng Anh 1', code: 'ENG101', managingFaculty: 'NN' },
    { name: 'Tiếng Anh 2', code: 'ENG102', managingFaculty: 'NN' },
  ]);
  console.log(`  Created ${String(subjects.length)} subjects\n`);

  // 3. MAJORS
  console.log('=== Seeding Majors ===');
  const cse = subjects.filter((s) => String(s.managingFaculty) === 'CNTT');
  const math = subjects.filter((s) => ['KHCB'].includes(String(s.managingFaculty)));
  const eco = subjects.filter((s) => String(s.managingFaculty) === 'KTQT');

  const majors = await Major.insertMany([
    { name: 'Công nghệ thông tin', code: 'CNTT', description: 'Khoa CNTT', subjects: [...cse.map((s) => s._id), ...math.map((s) => s._id)] },
    { name: 'Khoa học máy tính', code: 'CS', description: 'Ngành KHMT', subjects: cse.map((s) => s._id) },
    { name: 'Kinh tế', code: 'KT', description: 'Khoa Kinh tế', subjects: [...eco.map((s) => s._id), ...math.slice(0, 3).map((s) => s._id)] },
  ]);
  console.log(`  Created ${String(majors.length)} majors\n`);

  // 4. DOCUMENTS
  console.log('=== Seeding Documents ===');
  const sampleDocs = [
    { title: 'Slide bài giảng Nhập môn lập trình - Chương 1', description: 'Giới thiệu về lập trình C/C++', subject: subjects[0]._id, uploader: sv1._id, documentType: 'Lecture Notes', schoolYear: '2024-2025', downloadCount: 15, viewCount: 42 },
    { title: 'Đề thi giữa kỳ Cấu trúc dữ liệu 2024', description: 'Đề thi giữa kỳ kèm đáp án chi tiết', subject: subjects[1]._id, uploader: sv2._id, documentType: 'Exam Paper', schoolYear: '2024-2025', downloadCount: 89, viewCount: 200 },
    { title: 'Tổng hợp lý thuyết Cơ sở dữ liệu', description: 'Tóm tắt toàn bộ lý thuyết CSDL: ER, SQL, chuẩn hóa', subject: subjects[2]._id, uploader: sv3._id, documentType: 'Solved Exercises', schoolYear: '2024-2025', downloadCount: 56, viewCount: 130 },
    { title: 'Bài tập OOP Java có lời giải', description: 'Bài tập lập trình hướng đối tượng Java kèm lời giải', subject: subjects[3]._id, uploader: sv1._id, documentType: 'Solved Exercises', schoolYear: '2024-2025', downloadCount: 34, viewCount: 78 },
    { title: 'Đề cương ôn tập Mạng máy tính', description: 'Đề cương chi tiết cho kỳ thi cuối kỳ', subject: subjects[4]._id, uploader: sv4._id, documentType: 'Lecture Notes', schoolYear: '2024-2025', downloadCount: 23, viewCount: 67 },
    { title: 'Báo cáo đồ án Phân tích thiết kế phần mềm', description: 'Báo cáo nhóm 8 - Hệ thống UniShare', subject: subjects[5]._id, uploader: sv1._id, documentType: 'Tutorial', schoolYear: '2024-2025', downloadCount: 12, viewCount: 35 },
    { title: 'Slide Trí tuệ nhân tạo - Machine Learning', description: 'Bài giảng về các thuật toán ML cơ bản', subject: subjects[7]._id, uploader: sv5._id, documentType: 'Lecture Notes', schoolYear: '2024-2025', downloadCount: 45, viewCount: 112 },
    { title: 'Cheat sheet Toán rời rạc', description: 'Tóm tắt công thức tổ hợp, đồ thị, logic', subject: subjects[8]._id, uploader: sv2._id, documentType: 'Lecture Notes', schoolYear: '2024-2025', downloadCount: 67, viewCount: 155 },
    { title: 'Đề thi cuối kỳ Giải tích 1 (5 năm)', description: 'Tổng hợp đề thi Giải tích 1 từ 2019-2024', subject: subjects[9]._id, uploader: sv3._id, documentType: 'Exam Paper', schoolYear: '2024-2025', downloadCount: 120, viewCount: 310 },
    { title: 'Công thức Xác suất thống kê', description: 'Tổng hợp công thức cần nhớ', subject: subjects[12]._id, uploader: sv4._id, documentType: 'Lecture Notes', schoolYear: '2024-2025', downloadCount: 78, viewCount: 190 },
  ];

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  function createSamplePdf(title: string, description: string): { filePath: string; fileName: string; fileSize: number } {
    const fileName = `seed-${Date.now()}-${String(Math.random()).slice(2, 8)}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const content = [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
      '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
      `4 0 obj<</Length 44>>stream\nBT /F1 16 Tf 72 720 Td (${title}) Tj ET\nendstream\nendobj`,
      'xref\n0 6',
      'trailer<</Size 6/Root 1 0 R>>',
      '%%EOF',
    ].join('\n');
    fs.writeFileSync(filePath, content);
    return { filePath: `uploads/${fileName}`, fileName, fileSize: fs.statSync(filePath).size };
  }

  const docsToInsert = sampleDocs.map((d) => {
    const pdf = createSamplePdf(d.title, d.description);
    return {
      ...d,
      fileUrl: `http://localhost:8000/${pdf.filePath.replace(/\\/g, '/')}`,
      filePath: pdf.filePath,
      fileType: 'application/pdf',
      fileSize: pdf.fileSize,
    };
  });

  const docs = await Doc.insertMany(docsToInsert);

  // Cập nhật uploadsCount
  const uploaderCounts: Record<string, number> = {};
  for (const d of sampleDocs) {
    const id = String(d.uploader);
    uploaderCounts[id] = (uploaderCounts[id] || 0) + 1;
  }
  for (const [userId, count] of Object.entries(uploaderCounts)) {
    await User.updateOne({ _id: userId }, { uploadsCount: count });
  }

  console.log(`  Created ${String(docs.length)} documents\n`);

  // 5. PLATFORM STATS
  console.log('=== Seeding Platform Stats ===');
  const totalDl = sampleDocs.reduce((s, d) => s + (d.downloadCount || 0), 0);
  await Stats.create({ totalUploads: docs.length, totalDownloads: totalDl, activeUsers: users.length });
  console.log(`  Stats: ${String(docs.length)} uploads, ${String(totalDl)} downloads, ${String(users.length)} users\n`);

  // 6. LOGS
  console.log('=== Seeding Logs ===');
  await Log.insertMany([
    { performedBy: admin._id, action: 'SYSTEM_SEED', details: 'Seeded database' },
    { performedBy: mod._id, action: 'BLOCK_DOCUMENT', targetDocument: docs[0]._id },
  ]);
  console.log('  Created 2 logs\n');

  console.log('========================================');
  console.log('  DATABASE SEEDED SUCCESSFULLY!');
  console.log('========================================');
  console.log('  Admin: admin@unishare.com / admin123');
  console.log('  Mod:   mod@st.phenikaa-uni.edu.vn / 123456');
  console.log('  Users: huy,minh,quang,tien,linh @st.phenikaa-uni.edu.vn / 123456');

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
