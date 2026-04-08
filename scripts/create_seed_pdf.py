"""Creates a sample PDF for testing. Run: python scripts/create_seed_pdf.py"""
import os

def create_sample_pdf(output_path: str):
    content = """%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 850>>
stream
BT /F1 18 Tf 50 740 Td (Introduction to Retrieval-Augmented Generation) Tj
/F1 12 Tf 0 -30 Td (RAG Architecture Overview) Tj
0 -20 Td (Retrieval-Augmented Generation combines large language models with) Tj
0 -16 Td (external knowledge retrieval to provide accurate, grounded responses.) Tj
0 -30 Td (Key Components:) Tj
0 -20 Td (1. Document Ingestion - PDFs parsed and chunked into segments) Tj
0 -16 Td (2. Embedding Generation - Text chunks converted to vectors) Tj
0 -16 Td (3. Vector Storage - Embeddings stored in pgVector for similarity search) Tj
0 -16 Td (4. Query Processing - User questions embedded and matched) Tj
0 -16 Td (5. Context Assembly - Top matching chunks form the context window) Tj
0 -16 Td (6. LLM Generation - Model generates answers using retrieved context) Tj
0 -30 Td (Benefits of RAG:) Tj
0 -20 Td (- Reduces hallucination by grounding responses in real documents) Tj
0 -16 Td (- Enables domain-specific knowledge without fine-tuning) Tj
0 -16 Td (- Supports real-time knowledge updates by adding new documents) Tj
0 -16 Td (- Provides source attribution for generated answers) Tj
0 -16 Td (- Cost-effective compared to training custom models) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000001170 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
1237
%%EOF"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        f.write(content)
    print(f"Sample PDF created: {output_path}")

if __name__ == "__main__":
    create_sample_pdf(os.path.join(os.path.dirname(__file__), "..", "seed_data", "sample_rag_overview.pdf"))
