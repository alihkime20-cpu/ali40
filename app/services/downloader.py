import asyncio
import html
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import yt_dlp

SUPPORTED_ROOTS = ("tiktok.com", "instagram.com", "instagr.am")
URL_RE = re.compile(r"https?://[^\s<>]+", re.I)

class DownloadError(Exception): pass

def extract_url(text: str) -> str | None:
    match = URL_RE.search(text or "")
    return match.group(0).rstrip(".,)") if match else None

def validate_url(url: str) -> None:
    parsed = urlparse(url); hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme not in {"http", "https"} or not any(hostname == root or hostname.endswith("." + root) for root in SUPPORTED_ROOTS):
        raise DownloadError("أرسل رابطًا عامًا من TikTok أو Instagram فقط.")

def _download_ytdlp(url: str, folder: str, max_bytes: int, timeout: int) -> tuple[str, str]:
    output = str(Path(folder) / "video.%(ext)s")
    options = {"outtmpl": output, "format": "best[ext=mp4]/best", "merge_output_format": "mp4", "noplaylist": True, "quiet": True, "no_warnings": True, "socket_timeout": timeout, "retries": 2, "max_filesize": max_bytes, "restrictfilenames": True, "http_headers": {"User-Agent": "Mozilla/5.0"}}
    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get("title") or "video"
    files = [p for p in Path(folder).iterdir() if p.is_file()]
    if not files: raise DownloadError("لم يتم العثور على فيديو قابل للتنزيل.")
    path = files[0]
    if path.stat().st_size > max_bytes: raise DownloadError("حجم الفيديو أكبر من الحد المسموح.")
    return str(path), title

def _download_instagram_meta(url: str, folder: str, max_bytes: int, timeout: int) -> tuple[str, str]:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", "Accept-Language": "en-US,en;q=0.9"})
    with urlopen(request, timeout=timeout) as response: page = response.read(2_000_000).decode("utf-8", errors="replace")
    match = re.search(r'<meta[^>]+property=["\']og:video["\'][^>]+content=["\']([^"\']+)', page, re.I) or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:video["\']', page, re.I)
    if not match: raise DownloadError("رابط Instagram خاص أو لا يوفر فيديو عامًا يمكن الوصول إليه.")
    video_url = html.unescape(match.group(1)).replace("&amp;", "&")
    path = Path(folder) / "instagram.mp4"
    req = Request(video_url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=timeout) as response, open(path, "wb") as output:
        total = 0
        while True:
            chunk = response.read(1024 * 256)
            if not chunk: break
            total += len(chunk)
            if total > max_bytes: raise DownloadError("حجم فيديو Instagram أكبر من الحد المسموح.")
            output.write(chunk)
    return str(path), "Instagram video"

def _download(url: str, max_bytes: int, timeout: int) -> tuple[str, str]:
    validate_url(url); folder = tempfile.mkdtemp(prefix="social-video-")
    try:
        try: return _download_ytdlp(url, folder, max_bytes, timeout)
        except Exception as first_error:
            if "instagram.com" in (urlparse(url).hostname or "") or "instagr.am" in (urlparse(url).hostname or ""):
                try: return _download_instagram_meta(url, folder, max_bytes, timeout)
                except Exception as second_error: raise DownloadError("تعذر تنزيل Instagram. يجب أن يكون المنشور عامًا وليس Story أو حسابًا خاصًا.") from second_error
            raise DownloadError("تعذر تنزيل الرابط. تأكد أن الرابط عام ويعمل.") from first_error
    except Exception:
        for child in Path(folder).glob("*"): child.unlink(missing_ok=True)
        Path(folder).rmdir()
        raise

async def download(url: str, max_bytes: int, timeout: int) -> tuple[str, str]: return await asyncio.to_thread(_download, url, max_bytes, timeout)

def cleanup(path: str) -> None:
    folder = Path(path).parent
    try:
        for child in folder.iterdir(): child.unlink(missing_ok=True)
        folder.rmdir()
    except OSError: pass
