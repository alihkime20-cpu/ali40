import asyncio
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse
import yt_dlp

SUPPORTED_ROOTS = ("tiktok.com", "instagram.com", "instagr.am")
URL_RE = re.compile(r"https?://[^\s<>]+", re.I)

class DownloadError(Exception): pass

def extract_url(text: str) -> str | None:
    match = URL_RE.search(text or "")
    return match.group(0).rstrip(".,)") if match else None

def validate_url(url: str) -> None:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme not in {"http", "https"} or not any(hostname == root or hostname.endswith("." + root) for root in SUPPORTED_ROOTS):
        raise DownloadError("أرسل رابطًا عامًا من TikTok أو Instagram فقط.")

def _download(url: str, max_bytes: int, timeout: int) -> tuple[str, str]:
    validate_url(url)
    folder = tempfile.mkdtemp(prefix="social-video-")
    output = str(Path(folder) / "video.%(ext)s")
    options = {
        "outtmpl": output,
        "format": "best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": timeout,
        "retries": 2,
        "max_filesize": max_bytes,
        "restrictfilenames": True,
    }
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title") or "video"
        files = [p for p in Path(folder).iterdir() if p.is_file()]
        if not files: raise DownloadError("لم يتم العثور على فيديو قابل للتنزيل.")
        path = files[0]
        if path.stat().st_size > max_bytes: raise DownloadError("حجم الفيديو أكبر من الحد المسموح.")
        return str(path), title
    except DownloadError: raise
    except Exception as exc:
        raise DownloadError("تعذر تنزيل الرابط. تأكد أنه عام ويعمل من دون تسجيل دخول.") from exc

async def download(url: str, max_bytes: int, timeout: int) -> tuple[str, str]:
    return await asyncio.to_thread(_download, url, max_bytes, timeout)

def cleanup(path: str) -> None:
    folder = Path(path).parent
    try:
        for child in folder.iterdir(): child.unlink(missing_ok=True)
        folder.rmdir()
    except OSError: pass
