/**
 * Course Analyzer - Detects department and class level from ODTUClass courses
 */

// Department code to full name mapping
export const DEPT_CODES: Record<string, string> = {
  'CENG': 'Bilgisayar Mühendisliği',
  'EE': 'Elektrik-Elektronik Mühendisliği',
  'EEE': 'Elektrik-Elektronik Mühendisliği',
  'ME': 'Makina Mühendisliği',
  'CE': 'İnşaat Mühendisliği',
  'CHE': 'Kimya Mühendisliği',
  'METE': 'Metalurji ve Malzeme Mühendisliği',
  'AERO': 'Havacılık ve Uzay Mühendisliği',
  'AEE': 'Havacılık ve Uzay Mühendisliği',
  'IE': 'Endüstri Mühendisliği',
  'ENVE': 'Çevre Mühendisliği',
  'FDE': 'Gıda Mühendisliği',
  'GEOE': 'Jeoloji Mühendisliği',
  'MINE': 'Maden Mühendisliği',
  'PETE': 'Petrol ve Doğalgaz Mühendisliği',
  'ARCH': 'Mimarlık',
  'CRP': 'Şehir ve Bölge Planlama',
  'ID': 'Endüstriyel Tasarım',
  'PHYS': 'Fizik',
  'CHEM': 'Kimya',
  'MATH': 'Matematik',
  'STAT': 'İstatistik',
  'BIO': 'Biyoloji',
  'MOLS': 'Moleküler Biyoloji ve Genetik',
  'ECON': 'İktisat',
  'BA': 'İşletme',
  'ADM': 'İşletme',
  'IR': 'Uluslararası İlişkiler',
  'SOC': 'Sosyoloji',
  'PSY': 'Psikoloji',
  'PHIL': 'Felsefe',
  'HIST': 'Tarih',
  'DBE': 'Hazırlık',
  'BASE': 'Hazırlık',
  'ENG': 'İngilizce',
  'EFL': 'İngilizce',
};

// Common/service courses that don't indicate department
const COMMON_DEPTS = ['MATH', 'PHYS', 'CHEM', 'ENG', 'HIST', 'TK', 'IS', 'EFL', 'MUS', 'PE', 'BASE', 'DBE'];

export interface CourseInfo {
  name: string;
  code?: string;
  url?: string;
}

export interface DetectionResult {
  detectedDepartment: string | null;
  detectedDepartmentCode: string | null;
  detectedClass: string | null;
  confidence: 'high' | 'medium' | 'low';
  isPrep: boolean;
  courseBreakdown: {
    deptCounts: Record<string, number>;
    classCounts: Record<string, number>;
  };
}

/**
 * Parse course code from course name
 * Examples: "CENG 101 - Intro to CS" -> { dept: "CENG", num: 101 }
 *           "DBE 1010 - English" -> { dept: "DBE", num: 1010 }
 */
function parseCourseCode(courseName: string): { dept: string; num: number } | null {
  // Match patterns like "CENG 101", "EE 101", "DBE 1010", "BASE 101"
  const match = courseName.match(/^([A-Z]{2,4})\s*(\d{3,4})/i);
  if (match) {
    return {
      dept: match[1].toUpperCase(),
      num: parseInt(match[2], 10)
    };
  }
  return null;
}

/**
 * Get class level from course number
 * 1xx = 1st year, 2xx = 2nd year, etc.
 * DBE courses (1xxx) = Prep
 */
function getClassLevel(courseNum: number, dept: string): string {
  if (dept === 'DBE' || dept === 'BASE' || dept === 'EFL') return 'Hazırlık';
  if (courseNum >= 1000 && (dept === 'DBE' || dept === 'BASE')) return 'Hazırlık'; // DBE-style numbering
  
  const level = Math.floor(courseNum / 100);
  switch (level) {
    case 1: return '1. Sınıf';
    case 2: return '2. Sınıf';
    case 3: return '3. Sınıf';
    case 4: return '4. Sınıf';
    case 5: return 'Yüksek Lisans';
    case 6: return 'Doktora';
    default: return '1. Sınıf';
  }
}

/**
 * Analyze courses and detect department + class level
 */
export function analyzeCourses(courses: CourseInfo[]): DetectionResult {
  const deptCounts: Record<string, number> = {};
  const classCounts: Record<string, number> = {};
  let isPrep = false;

  for (const course of courses) {
    const parsed = parseCourseCode(course.name || course.code || '');
    if (!parsed) continue;

    const { dept, num } = parsed;

    // Check if prep student
    if (dept === 'DBE' || dept === 'BASE' || dept === 'EFL') {
      isPrep = true;
    }

    // Count department occurrences (excluding common courses)
    if (!COMMON_DEPTS.includes(dept)) {
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    }

    // Count class levels
    const classLevel = getClassLevel(num, dept);
    classCounts[classLevel] = (classCounts[classLevel] || 0) + 1;
  }

  // Find most common department
  let detectedDeptCode: string | null = null;
  let maxDeptCount = 0;
  for (const [dept, count] of Object.entries(deptCounts)) {
    if (count > maxDeptCount) {
      maxDeptCount = count;
      detectedDeptCode = dept;
    }
  }

  // Find most common class level (ignore Hazırlık if not prep)
  let detectedClass: string | null = null;
  let maxClassCount = 0;
  for (const [classLevel, count] of Object.entries(classCounts)) {
    if (isPrep && classLevel === 'Hazırlık') {
      detectedClass = 'Hazırlık';
      break;
    }
    if (classLevel !== 'Hazırlık' && count > maxClassCount) {
      maxClassCount = count;
      detectedClass = classLevel;
    }
  }

  // If prep student, class is Hazırlık
  if (isPrep && !detectedClass) {
    detectedClass = 'Hazırlık';
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (maxDeptCount >= 3) confidence = 'high';
  else if (maxDeptCount >= 2) confidence = 'medium';

  // If it's a prep student and we didn't find a real department, or it's just 'Hazırlık', clear it
  const finalDeptName = detectedDeptCode ? (DEPT_CODES[detectedDeptCode] || detectedDeptCode) : null;
  const isRedundantDept = isPrep && (finalDeptName === 'Hazırlık' || !detectedDeptCode);

  return {
    detectedDepartment: isRedundantDept ? null : finalDeptName,
    detectedDepartmentCode: isRedundantDept ? null : detectedDeptCode,
    detectedClass,
    confidence,
    isPrep,
    courseBreakdown: {
      deptCounts,
      classCounts
    }
  };
}

/**
 * Format detection result for display
 */
export function formatDetectionMessage(result: DetectionResult): string {
  if (result.isPrep && !result.detectedDepartment) {
    return `Hazırlık öğrencisi olarak tespit edildiniz. Bölümünüz henüz belirlenemedi.`;
  }
  
  if (result.detectedDepartment && result.detectedClass) {
    return `${result.detectedDepartment} - ${result.detectedClass} olarak tespit edildiniz.`;
  }
  
  if (result.detectedDepartment) {
    return `${result.detectedDepartment} bölümü olarak tespit edildiniz.`;
  }
  
  if (result.detectedClass) {
    return `${result.detectedClass} olarak tespit edildiniz.`;
  }
  
  return 'Bölüm ve sınıf bilgileriniz tespit edilemedi.';
}
