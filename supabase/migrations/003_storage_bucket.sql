-- ============================================
-- SUPABASE STORAGE BUCKET FOR INSPECTION PHOTOS
-- Muayene fotoğrafları için storage bucket
-- ============================================

-- NOT: Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın
-- Storage bucket'lar SQL ile oluşturulamaz, Dashboard'dan oluşturulmalı

-- Bucket oluşturma adımları:
-- 1. Supabase Dashboard > Storage bölümüne gidin
-- 2. "New bucket" butonuna tıklayın
-- 3. Bucket name: "inspection-photos"
-- 4. Public bucket: EVET (işaretleyin)
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage politikaları (Dashboard > Storage > Policies):

-- 1. SELECT (okuma) - Herkes okuyabilir
-- CREATE POLICY "Public read access"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'inspection-photos');

-- 2. INSERT (yükleme) - Authenticated kullanıcılar yükleyebilir
-- CREATE POLICY "Authenticated upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'inspection-photos');

-- 3. DELETE (silme) - Authenticated kullanıcılar silebilir
-- CREATE POLICY "Authenticated delete"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'inspection-photos');

-- ============================================
-- INSPECTIONS TABLOSUNA photo_url KOLONU EKLE
-- ============================================

-- Mevcut photo_base64 yerine photo_url kullanacağız
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- NOT: Eski photo_base64 kolonu korunuyor (geriye uyumluluk için)
-- İleride silinebilir: ALTER TABLE inspections DROP COLUMN photo_base64;
