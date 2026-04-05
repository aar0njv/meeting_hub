import chromadb
from chromadb.utils import embedding_functions

chroma_client = chromadb.PersistentClient(path="./chroma_data")


sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")


collection = chroma_client.get_or_create_collection(
    name="transcripts",
    embedding_function=sentence_transformer_ef
)

def chunk_text(text: str, chunk_size: int = 150, overlap: int = 30):
    """Splits a transcript into overlapping chunks of words."""
    words = text.split()
    chunks = []
    if not words:
        return chunks
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks



def add_transcript_to_vector_db(transcript_id: str, filename: str, content: str):
    """Chunks the text and stores it in ChromaDB with metadata for citations."""
    chunks = chunk_text(content)

    if not chunks:
        return 0
    
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({"transcript_id": transcript_id, "filename": filename})
        ids.append(f"transcript_{transcript_id}_chunk_{i}")
        
    if not documents:
        return 0


    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    print(f"Added {len(chunks)} chunks for {filename} to ChromaDB.")
    return len(chunks)

def search_vector_db(query: str, n_results: int = 5, transcripts_ids: list = None):
    collection_count = collection.count()
    if collection_count == 0:
        return {"documents": [[]], "metadatas": [[]]}
    
    actual_n = min(n_results, collection_count)

    where_filter = None
    if transcripts_ids:
        if len(transcripts_ids) == 1:
            where_filter = {"transcript_id": transcripts_ids[0]}
        else:
            where_filter = {"transcript_id": {"$in": transcripts_ids}}

    
    results = collection.query(
        query_texts=[query],
        n_results=actual_n,
        where=where_filter
    )

    return results