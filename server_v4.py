import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
from openai import OpenAI
import win32com.client  # 🔊 NEW: Direct native Windows Speech API access
import pythoncom  # 🔊 NEW: Required to register background threads with Windows

app = Flask(__name__)
CORS(app)

# Configuration settings
MODEL_PATH = r"C:\Models\all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_PATH)
VAULT_FOLDER = r"C:\Users\ASUS\Documents\MyceliumVault"

ai_client = OpenAI(
    base_url="http://localhost:1234/v1", 
    api_key="lm-studio"
)

# === 1. SEMANTIC SEARCH ROUTE ===
@app.route('/search', methods=['POST'])
def search_notes():
    data = request.json
    query = data.get('query', '')
    if not query:
        return jsonify({"results": []})
    
    if not os.path.exists(VAULT_FOLDER):
        return jsonify({"error": "Vault folder not found"}), 404
        
    filenames = [f for f in os.listdir(VAULT_FOLDER) if f.endswith('.md')]
    if not filenames:
        return jsonify({"results": []})
        
    documents = []
    valid_files = []
    for f in filenames:
        try:
            with open(os.path.join(VAULT_FOLDER, f), 'r', encoding='utf-8') as file:
                documents.append(file.read())
                valid_files.append(f)
        except Exception:
            continue

    if not documents:
        return jsonify({"results": []})

    query_embedding = model.encode(query, convert_to_tensor=True)
    doc_embeddings = model.encode(documents, convert_to_tensor=True)
    cosine_scores = util.cos_sim(query_embedding, doc_embeddings)[0]
    
    results = []
    for idx, score in enumerate(cosine_scores):
        results.append({
            "filename": valid_files[idx],
            "score": float(score)
        })
        
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    return jsonify({"results": results})


# === 2. ASK AI VAULT ROUTE WITH BULLETPROOF VOICE ===
@app.route('/ask-vault', methods=['POST'])
def ask_vault():
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({"answer": "Please provide a question."})
        
    try:
        if not os.path.exists(VAULT_FOLDER):
            return jsonify({"error": "Vault folder not found"}), 404
            
        filenames = [f for f in os.listdir(VAULT_FOLDER) if f.endswith('.md')]
        if not filenames:
            return jsonify({"answer": "Your vault is empty."})
            
        documents = []
        valid_files = []
        for f in filenames:
            try:
                with open(os.path.join(VAULT_FOLDER, f), 'r', encoding='utf-8') as file:
                    documents.append(file.read())
                    valid_files.append(f)
            except Exception:
                continue

        query_embedding = model.encode(query, convert_to_tensor=True)
        doc_embeddings = model.encode(documents, convert_to_tensor=True)
        cosine_scores = util.cos_sim(query_embedding, doc_embeddings)[0]
        
        scored_docs = sorted(
            zip(valid_files, documents, cosine_scores), 
            key=lambda x: x[2], 
            reverse=True
        )
        
        top_context = ""
        for filename, content, score in scored_docs[:2]:
            if score > 0.2:  
                top_context += f"\n--- From Note: {filename} ---\n{content}\n"

        system_instruction = (
            "You are Mycelium AI, a private assistant. Use the provided personal notes context "
            "to accurately answer the user's question. If the notes don't contain the answer, "
            "use your general knowledge but mention that it wasn't explicitly found in the notes."
        )
        
        user_prompt = f"Context from my personal notes:\n{top_context}\n\nQuestion: {query}"
        
        response = ai_client.chat.completions.create(
            model="local-model",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4
        )
        
        ai_answer = response.choices[0].message.content

        # 🔊 NATIVE WINDOWS TTS SPEAK BLOCK (Thread-Safe Version)
        try:
            # 1. Initialize this specific background thread for Windows COM
            pythoncom.CoInitialize() 

            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            speaker.Speak(ai_answer)

        except Exception as tts_err:
            print(f"Voice generation skipped or failed: {tts_err}")
        finally:
            # 2. Always clean up and unregister the thread when done speaking
            pythoncom.CoUninitialize()

        return jsonify({"answer": ai_answer})
        
    except Exception as e:
        return jsonify({"error": f"Could not get AI answer: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5050, debug=True)
