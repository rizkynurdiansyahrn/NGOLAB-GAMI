import zipfile
import os

def extract_media(docx_path, out_dir):
    print(f"=== Extracting media from {docx_path} ===")
    os.makedirs(out_dir, exist_ok=True)
    try:
        with zipfile.ZipFile(docx_path) as z:
            media_files = [f for f in z.namelist() if f.startswith('word/media/')]
            print(f"Found {len(media_files)} media files")
            for f in media_files:
                basename = os.path.basename(f)
                out_path = os.path.join(out_dir, basename)
                with open(out_path, 'wb') as out_f:
                    out_f.write(z.read(f))
                print(f"Extracted {basename} ({len(z.read(f))} bytes)")
    except Exception as e:
        print(f"Error: {e}")

extract_media("d:/Tugas_Akhir_Ngolab-Gami/TA_NGOLAB-GAMI-NEW.docx", "extracted_media_ta")
extract_media("d:/Tugas_Akhir_Ngolab-Gami/NGOLAB-GAMI PLATFORM MINI APPS DAN GAME GAMIFIKASI UNTUK POINT DAN REWARD MEMBER NGOLAB (Rizky_Nurdiansyah).docx", "extracted_media_proposal")
