import chromadb
from chromadb.utils import embedding_functions

chroma_client = chromadb.PersistentClient(path="./chroma_data")


sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")


collection = chroma_client.get_or_create_collection(
    name="transcripts",
    embedding_function=sentence_transformer_ef
)

def chunk_text(text: str, chunk_size: int = 150, overlap: int = 30):
    """Splits a long transcript into overlapping chunks of words."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def add_transcript_to_vector_db(transcript_id: str, filename: str, content: str):
    """Chunks the text and stores it in ChromaDB with metadata for citations."""
    chunks = chunk_text(content)
    
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

def search_transcripts(query: str, n_results: int = 5, transcript_id: str = None):
    """Searches the vector DB, optionally filtering by a specific transcript."""
    
    if transcript_id is not None:
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"transcript_id": transcript_id} 
        )
    else:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
    return results
