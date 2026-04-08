"""PDF text extraction and text chunking utilities."""

import pymupdf  # PyMuPDF


def extract_text_from_pdf(file_bytes: bytes) -> list[str]:
    """Extract text from each page of a PDF. Returns list of strings, one per page."""
    pages = []
    with pymupdf.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                pages.append(text.strip())
    return pages


def chunk_text(text: str, chunk_size: int = 512, chunk_overlap: int = 50) -> list[dict]:
    """Split text into overlapping chunks by word count."""
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunk_text_str = " ".join(chunk_words)
        chunks.append({
            "text": chunk_text_str,
            "token_count": len(chunk_words),
            "page": None,
        })
        start += chunk_size - chunk_overlap

    return chunks
