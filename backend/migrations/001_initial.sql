-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
  student_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'project', 'lab_record', 'quiz', 'test', 'practical')),
  title VARCHAR(500) NOT NULL,
  instructions TEXT,
  deadline TIMESTAMP NOT NULL,
  marks INTEGER NOT NULL DEFAULT 0,
  submission_format VARCHAR(50) CHECK (submission_format IN ('soft_copy_pdf', 'hard_copy_spiral', 'hard_copy_hard_binding', 'in_class')),
  is_group BOOLEAN DEFAULT FALSE,
  group_size INTEGER,
  topic_allocation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submission_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Tests / Exams / Practicals
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('test', 'model_exam', 'lab_practical')),
  title VARCHAR(500) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL,
  syllabus_topics JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Study Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  days JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

-- Roadmap Progress
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  completed_topics JSONB DEFAULT '[]',
  unsure_topics JSONB DEFAULT '[]',
  checked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(roadmap_id, day_number)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
