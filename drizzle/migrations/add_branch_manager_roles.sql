-- ============================================================
-- Migration: Add Branch Manager Role + Checklist + Schedule
-- ============================================================

-- 1. توسيع enum الأدوار في جدول users
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'superadmin', 'area_manager', 'branch_manager') NOT NULL DEFAULT 'area_manager';

-- 2. إضافة عمود بيانات تقييم الخروج (JSON) على جدول visits
ALTER TABLE visits ADD COLUMN visitChecklistData TEXT NULL COMMENT 'JSON: نتيجة مودال التقييم الإلزامي عند الخروج';

-- 3. إضافة عمود حالة التقييم المعلق (للخروج التلقائي)
ALTER TABLE visits ADD COLUMN checklistPending ENUM('yes', 'no') NOT NULL DEFAULT 'no' COMMENT 'هل الخروج تلقائي ولم يكتمل التقييم بعد؟';

-- 4. إنشاء جدول الجدولة الأسبوعية لمدراء المناطق
CREATE TABLE IF NOT EXISTS areaManagerSchedules (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  managerId     INT NOT NULL COMMENT 'يشير إلى جدول managers',
  branchId      INT NOT NULL COMMENT 'الفرع المراد زيارته',
  dayOfWeek     INT NOT NULL COMMENT '0=الأحد, 1=الإثنين, ..., 6=السبت',
  plannedTime   VARCHAR(5) NULL COMMENT 'وقت الزيارة المخطط HH:MM',
  note          TEXT NULL COMMENT 'ملاحظة شخصية اختيارية',
  createdAt     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_schedule_manager_day (managerId, dayOfWeek)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. (اختياري) ترحيل المستخدمين القديمين role='user' إلى area_manager
-- يمكن تنفيذه بشكل انتقائي حسب الحاجة:
-- UPDATE users SET role = 'area_manager' WHERE role = 'user';
